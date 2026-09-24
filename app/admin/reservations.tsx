import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { notifyUsers } from '../../lib/notifyUsers';
import { supabase } from '../../lib/supabase';



type ReservationRow = {
  id: string;
  reference_code: string;
  status: string;
  created_at: string;
  source: 'Livestock' | 'Equity' | 'Venture';
  table: 'investment_interests' | 'equity_interests' | 'venture_interests';
  user_id: string;
  batch_started_at: string | null;
  investor?: { full_name: string; phone: string; email: string };
};

const FILTERS = ['all', 'pending', 'not_started', 'started', 'completed', 'confirmed', 'rejected'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  pending: 'Pending',
  not_started: 'Not Started',
  started: 'Started',
  completed: 'Completed',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
};

function toDateOnlyString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Computes an easy-to-scan operational badge for each row.
function getBadge(row: ReservationRow) {
  if (row.status === 'pending') return { label: 'Pending', color: colors.gold, bg: '#FBF3E4' };
  if (row.status === 'rejected') return { label: 'Rejected', color: colors.danger, bg: '#FBEAE5' };

  // Confirmed/active from here down
  if (row.source !== 'Livestock') {
    return { label: 'Confirmed', color: colors.primary, bg: colors.primaryMuted };
  }

  if (!row.batch_started_at) {
    return { label: 'Not Started', color: '#B3691F', bg: '#FCEEE0' };
  }

  const start = new Date(row.batch_started_at);
  const now = new Date();
  const elapsedDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (elapsedDays < 0) return { label: 'Scheduled', color: colors.gold, bg: '#FBF3E4' };
  if (elapsedDays >= 42) return { label: 'Completed', color: colors.primary, bg: colors.primaryMuted };
  return { label: 'Started', color: '#1F7A5C', bg: '#E3F3EC' };
}

function matchesFilter(row: ReservationRow, filter: Filter) {
  if (filter === 'all') return true;
  if (filter === 'pending') return row.status === 'pending';
  if (filter === 'rejected') return row.status === 'rejected';
  if (filter === 'confirmed') return (row.status === 'confirmed' || row.status === 'active') && row.source !== 'Livestock';

  if (row.source !== 'Livestock' || (row.status !== 'confirmed' && row.status !== 'active')) return false;

  const badge = getBadge(row);
  if (filter === 'not_started') return badge.label === 'Not Started' || badge.label === 'Scheduled';
  if (filter === 'started') return badge.label === 'Started';
  if (filter === 'completed') return badge.label === 'Completed';
  return false;
}

export default function ReservationsScreen() {
  const { filter: initialFilter } = useLocalSearchParams<{ filter?: Filter }>();
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>(initialFilter ?? 'all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showGroupSheet, setShowGroupSheet] = useState(false);
  const [groupLabel, setGroupLabel] = useState('');
  const [groupDate, setGroupDate] = useState(new Date());
  const [showGroupDatePicker, setShowGroupDatePicker] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const createBatchGroup = async () => {
    if (!groupLabel.trim()) {
      Alert.alert('Name this batch', 'Give the batch a label so you can find it later.');
      return;
    }
    setCreatingGroup(true);

    const { data: newBatch, error: batchError } = await supabase
      .from('production_batches')
      .insert({ label: groupLabel.trim(), start_date: toDateOnlyString(groupDate) })
      .select('id')
      .single();

    if (batchError || !newBatch) {
      setCreatingGroup(false);
      Alert.alert('Failed to create batch', batchError?.message ?? 'Unknown error');
      return;
    }

    const idsArray = Array.from(selectedIds);
    const { error: updateError } = await supabase
      .from('investment_interests')
      .update({ batch_id: newBatch.id })
      .in('id', idsArray);

    setCreatingGroup(false);

    if (updateError) {
      Alert.alert('Batch created, but assigning investors failed', updateError.message);
      return;
    }

    Alert.alert('Batch created', `${idsArray.length} investor(s) grouped into "${groupLabel.trim()}".`);
    setShowGroupSheet(false);
    setGroupLabel('');
    setSelectMode(false);
    setSelectedIds(new Set());
    fetchAll();
  };

  const [rejectTarget, setRejectTarget] = useState<ReservationRow | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [contactTarget, setContactTarget] = useState<ReservationRow | null>(null);
const [reviewTarget, setReviewTarget] = useState<ReservationRow | null>(null);
const [reviewDetails, setReviewDetails] = useState<any>(null);
const [reviewLoading, setReviewLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    const [livestock, equity, ventures] = await Promise.all([
      supabase.from('investment_interests').select('id, reference_code, status, created_at, user_id, batch_started_at').order('created_at', { ascending: false }),
      supabase.from('equity_interests').select('id, reference_code, status, created_at, user_id').order('created_at', { ascending: false }),
      supabase.from('venture_interests').select('id, reference_code, status, created_at, user_id').order('created_at', { ascending: false }),
    ]);

    const combined: ReservationRow[] = [
      ...(livestock.data ?? []).map((r) => ({ ...r, source: 'Livestock' as const, table: 'investment_interests' as const })),
      ...(equity.data ?? []).map((r) => ({ ...r, source: 'Equity' as const, table: 'equity_interests' as const, batch_started_at: null })),
      ...(ventures.data ?? []).map((r) => ({ ...r, source: 'Venture' as const, table: 'venture_interests' as const, batch_started_at: null })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Pull investor contact info in one batch query
    const uniqueUserIds = Array.from(new Set(combined.map((r) => r.user_id)));
    if (uniqueUserIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, phone, email').in('id', uniqueUserIds);
      const profilesById: Record<string, { full_name: string; phone: string; email: string }> = {};
      (profiles ?? []).forEach((p) => { profilesById[p.id] = p; });
      combined.forEach((r) => { r.investor = profilesById[r.user_id]; });
    }

    setRows(combined);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const filteredRows = useMemo(() => {
    let result = rows.filter((r) => matchesFilter(r, filter));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.reference_code.toLowerCase().includes(q) ||
          r.investor?.full_name?.toLowerCase().includes(q) ||
          r.investor?.phone?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rows, filter, search]);

  // Counts shown on each filter chip, so you know what's where at a glance
  const filterCounts = useMemo(() => {
    const counts: Record<Filter, number> = { all: rows.length, pending: 0, not_started: 0, started: 0, completed: 0, confirmed: 0, rejected: 0 };
    rows.forEach((r) => {
      FILTERS.forEach((f) => {
        if (f !== 'all' && matchesFilter(r, f)) counts[f]++;
      });
    });
    return counts;
  }, [rows]);

  const updateStatus = async (row: ReservationRow, newStatus: string) => {
    const { error } = await supabase.from(row.table).update({ status: newStatus }).eq('id', row.id);
    if (error) {
      Alert.alert('Update failed', error.message);
      return;
    }

    await notifyUsers({
      userIds: [row.user_id],
      title: newStatus === 'confirmed' ? 'Reservation confirmed' : 'Reservation update',
      body: `Your reservation (${row.reference_code}) has been ${newStatus}. Check My Assets for details.`,
      type: 'reservation',
      route: '/(tabs)/my-assets',
    });

    fetchAll();
  };

  const openReview = async (row: ReservationRow) => {
    setReviewTarget(row);
    setReviewDetails(null);
    setReviewLoading(true);

    if (row.source === 'Livestock') {
      const { data: interest } = await supabase
        .from('investment_interests')
        .select('snapshot_birds, snapshot_amount, snapshot_duration, snapshot_type_title')
        .eq('id', row.id)
        .single();
      setReviewDetails({
        type: 'Livestock',
        title: interest?.snapshot_type_title ?? 'Livestock Package',
        birds: interest?.snapshot_birds,
        duration: interest?.snapshot_duration,
        amount: interest?.snapshot_amount ?? 0,
      });
    } else if (row.source === 'Equity') {
      const { data: interest } = await supabase
        .from('equity_interests')
        .select('shares_requested, amount, campaign_id')
        .eq('id', row.id)
        .single();
      let campaignTitle = 'Equity Shares';
      if (interest?.campaign_id) {
        const { data: campaign } = await supabase.from('equity_campaigns').select('title').eq('id', interest.campaign_id).single();
        campaignTitle = campaign?.title ?? campaignTitle;
      }
      setReviewDetails({ type: 'Equity', title: campaignTitle, shares: interest?.shares_requested, amount: interest?.amount ?? 0 });
    } else {
      const { data: interest } = await supabase.from('venture_interests').select('amount, venture_id').eq('id', row.id).single();
      let ventureTitle = 'Capital Venture';
      if (interest?.venture_id) {
        const { data: venture } = await supabase.from('capital_ventures').select('title').eq('id', interest.venture_id).single();
        ventureTitle = venture?.title ?? ventureTitle;
      }
      setReviewDetails({ type: 'Venture', title: ventureTitle, amount: interest?.amount ?? 0 });
    }

    setReviewLoading(false);
  };

  const submitRejection = async () => {
    if (!rejectTarget) return;
    if (!rejectNote.trim()) {
      Alert.alert('Add a reason', 'Please explain why this reservation is being rejected — the investor will see this note.');
      return;
    }

    setRejecting(true);
    const { error } = await supabase
      .from(rejectTarget.table)
      .update({ status: 'rejected', rejection_note: rejectNote.trim() })
      .eq('id', rejectTarget.id);
    setRejecting(false);

    if (error) {
      Alert.alert('Failed', error.message);
      return;
    }

    await notifyUsers({
      userIds: [rejectTarget.user_id],
      title: 'Reservation rejected',
      body: `Your reservation (${rejectTarget.reference_code}) was rejected: ${rejectNote.trim()}`,
      type: 'reservation',
      route: '/(tabs)/my-assets',
    });

    setRejectTarget(null);
    setRejectNote('');
    fetchAll();
  };

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  };

  const toggleRowSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };


  // const handleBulkDateChange = (event: any, selectedDate?: Date) => {
  //   if (Platform.OS === 'android') {
  //     setShowBulkDatePicker(false);
  //     if (event.type === 'set' && selectedDate) {
  //       setBulkDate(selectedDate);
  //       applyBulkBatchDateWithDate(selectedDate);
  //     }
  //     return;
  //   }
  //   if (selectedDate) setBulkDate(selectedDate);
  // };




  const applyBulkBatchDateWithDate = async (d: Date) => {
    const dateString = toDateOnlyString(d);
    const idsArray = Array.from(selectedIds);
    const { error } = await supabase.from('investment_interests').update({ batch_started_at: dateString }).in('id', idsArray);
    if (error) {
      Alert.alert('Failed', error.message);
      return;
    }
    Alert.alert('Batch date set', `Applied ${dateString} to ${idsArray.length} reservation(s).`);
    setSelectMode(false);
    setSelectedIds(new Set());
    fetchAll();
  };

  const handleRowPress = (row: ReservationRow) => {
    if (selectMode) {
      if (row.source === 'Livestock') toggleRowSelected(row.id);
      return;
    }
    if (row.status === 'pending') {
      openReview(row);
    } else if (row.status !== 'rejected' && row.source === 'Livestock') {
      router.push({
        pathname: '/admin/set-batch-date',
        params: { interestId: row.id, referenceCode: row.reference_code },
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Reservations</Text>
        <Pressable onPress={() => router.push('/admin/production-batches')} style={styles.iconToggle}>
          <Feather name="users" size={15} color={colors.primary} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setViewMode(viewMode === 'list' ? 'table' : 'list')} style={styles.iconToggle}>
            <Feather name={viewMode === 'list' ? 'grid' : 'list'} size={15} color={colors.primary} />
          </Pressable>
          <Pressable onPress={toggleSelectMode} style={styles.iconToggle}>
            <Feather name={selectMode ? 'x' : 'check-square'} size={15} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={15} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ref code, name, or phone"
          placeholderTextColor={colors.textFaint}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={15} color={colors.textFaint} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {FILTER_LABELS[f]}{f !== 'all' ? ` (${filterCounts[f]})` : ''}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : filteredRows.length === 0 ? (
          <Text style={styles.emptyText}>No reservations match this filter.</Text>
        ) : viewMode === 'table' ? (
          <View style={[styles.tableCard, shadow.card]}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Ref</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.1 }]}>Investor</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Stage</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.8, textAlign: 'right' }]}>Date</Text>
            </View>
            {filteredRows.map((row) => {
              const badge = getBadge(row);
              return (
                <Pressable key={row.id} style={styles.tableRow} onPress={() => handleRowPress(row)}>
                  <Text style={[styles.tableCellBold, { flex: 1.2 }]} numberOfLines={1}>{row.reference_code}</Text>
                  <Text style={[styles.tableCell, { flex: 1.1 }]} numberOfLines={1}>{row.investor?.full_name ?? '—'}</Text>
                  <Text style={[styles.tableCell, { flex: 1, color: badge.color }]} numberOfLines={1}>{badge.label}</Text>
                  <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'right' }]} numberOfLines={1}>
                    {new Date(row.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          filteredRows.map((row) => {
            const badge = getBadge(row);
            return (
              <Pressable key={row.id} style={[styles.row, shadow.card]} onPress={() => handleRowPress(row)}>
                <View style={styles.rowTopLine}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                    {selectMode && row.source === 'Livestock' && (
                      <View style={[styles.checkbox, selectedIds.has(row.id) && styles.checkboxChecked]}>
                        {selectedIds.has(row.id) && <Feather name="check" size={12} color="#fff" />}
                      </View>
                    )}
                    <Text style={styles.rowCode}>{row.reference_code}</Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.pillText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={styles.rowSecondLine}>
                  <Text style={styles.rowSource}>
                    {row.source} · {new Date(row.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </Text>
                  {row.investor && (
                    <Pressable
                      style={styles.investorChip}
                      onPress={(e) => { e.stopPropagation(); setContactTarget(row); }}
                      hitSlop={6}
                    >
                      <Feather name="user" size={11} color={colors.primary} />
                      <Text style={styles.investorChipText} numberOfLines={1}>{row.investor.full_name || 'View investor'}</Text>
                    </Pressable>
                  )}
                </View>

                {!selectMode && row.status === 'pending' && <Text style={styles.tapHint}>Tap to confirm or reject</Text>}
                {!selectMode && row.status !== 'pending' && row.status !== 'rejected' && row.source === 'Livestock' && (
                  <Text style={styles.tapHint}>Tap to set batch start date</Text>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {selectMode && selectedIds.size > 0 && (
        <View style={[styles.bulkBar, shadow.raised]}>
          <Text style={styles.bulkBarText}>{selectedIds.size} selected</Text>
          <Pressable style={styles.bulkBarBtn} onPress={() => setShowGroupSheet(true)}>
            <Feather name="users" size={14} color="#fff" />
            <Text style={styles.bulkBarBtnText}>Group into batch</Text>
          </Pressable>
        </View>
      )}

      {showGroupSheet && (
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); setShowGroupSheet(false); }} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetKeyboardWrap}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Group {selectedIds.size} into a batch</Text>
              <Text style={styles.sheetSubtitle}>Name this batch and set its start date.</Text>
              <TextInput
                style={styles.groupLabelInput}
                placeholder="e.g. Batch A — September 2026"
                placeholderTextColor={colors.textFaint}
                value={groupLabel}
                onChangeText={setGroupLabel}
              />
              <Pressable style={styles.dateButton} onPress={() => setShowGroupDatePicker(true)}>
                <Feather name="calendar" size={15} color={colors.primary} />
                <Text style={styles.dateButtonText}>{toDateOnlyString(groupDate)}</Text>
              </Pressable>
              {showGroupDatePicker && (
                <DateTimePicker
                  value={groupDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(e, d) => { if (Platform.OS === 'android') setShowGroupDatePicker(false); if (d) setGroupDate(d); }}
                  themeVariant="light"
                />
              )}
              <View style={{ marginTop: spacing.lg }}>
                <PrimaryButton label="Create batch & assign" onPress={createBatchGroup} loading={creatingGroup} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Reject sheet */}
      {rejectTarget && (
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); setRejectTarget(null); }} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetKeyboardWrap}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>Reject {rejectTarget.reference_code}</Text>
                <Pressable onPress={Keyboard.dismiss} hitSlop={8}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>
              <Text style={styles.sheetSubtitle}>
                This note is shown to the investor, so explain clearly why this reservation didn't go through.
              </Text>
              <TextInput
                style={styles.noteInput}
                placeholder="e.g. Payment not received within the reservation window"
                placeholderTextColor={colors.textFaint}
                value={rejectNote}
                onChangeText={setRejectNote}
                multiline
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
              />
              <PrimaryButton label="Reject reservation" onPress={submitRejection} loading={rejecting} />
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {reviewTarget && (
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setReviewTarget(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Review {reviewTarget.reference_code}</Text>

            <View style={styles.contactCard}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactAvatarText}>
                  {reviewTarget.investor?.full_name?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{reviewTarget.investor?.full_name || 'Unnamed investor'}</Text>
                <Text style={styles.contactMeta}>{reviewTarget.investor?.phone || 'No phone on file'}</Text>
              </View>
            </View>

            {reviewLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
            ) : reviewDetails && (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewCardTitle}>{reviewDetails.title}</Text>
                {reviewDetails.type === 'Livestock' && (
                  <>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Birds</Text>
                      <Text style={styles.reviewValue}>{reviewDetails.birds?.toLocaleString() ?? '—'}</Text>
                    </View>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Duration</Text>
                      <Text style={styles.reviewValue}>{reviewDetails.duration ?? '—'}</Text>
                    </View>
                  </>
                )}
                {reviewDetails.type === 'Equity' && (
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Shares</Text>
                    <Text style={styles.reviewValue}>{reviewDetails.shares?.toLocaleString() ?? '—'}</Text>
                  </View>
                )}
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Amount</Text>
                  <Text style={[styles.reviewValue, { color: colors.gold }]}>₦{(reviewDetails.amount ?? 0).toLocaleString('en-NG')}</Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Reject"
                  variant="outline"
                  onPress={() => {
                    const target = reviewTarget;
                    setReviewTarget(null);
                    setRejectTarget(target);
                    setRejectNote('');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Confirm"
                  onPress={() => {
                    updateStatus(reviewTarget, 'confirmed');
                    setReviewTarget(null);
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Investor contact sheet */}
      {contactTarget && (
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setContactTarget(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Investor details</Text>
            <Text style={styles.sheetSubtitle}>Reservation {contactTarget.reference_code}</Text>

            <View style={styles.contactCard}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactAvatarText}>
                  {contactTarget.investor?.full_name?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{contactTarget.investor?.full_name || 'Unnamed investor'}</Text>
                <Text style={styles.contactMeta}>{contactTarget.investor?.phone || 'No phone on file'}</Text>
                <Text style={styles.contactMeta}>{contactTarget.investor?.email || 'No email on file'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Call"
                  onPress={() => contactTarget.investor?.phone && Linking.openURL(`tel:${contactTarget.investor.phone.replace(/\s/g, '')}`)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Email"
                  variant="outline"
                  onPress={() => contactTarget.investor?.email && Linking.openURL(`mailto:${contactTarget.investor.email}`)}
                />
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.md },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: fonts.displayMedium, fontSize: 19, color: colors.text },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconToggle: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, paddingHorizontal: spacing.md, height: 44,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: colors.text },

  filterScroll: { flexGrow: 0, marginBottom: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  filterChipTextActive: { color: '#fff' },

  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },

  row: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  rowTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowCode: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  rowSecondLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5 },
  rowSource: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  tapHint: { fontFamily: fonts.body, fontSize: 11, color: colors.gold, marginTop: 6 },

  investorChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, maxWidth: 150 },
  investorChipText: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.primary },

  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },

  tableCard: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeaderText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  tableCell: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  tableCellBold: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.text },

  bulkBar: {
    position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.md,
  },
  bulkBarText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#fff' },
  bulkBarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  bulkBarBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: '#fff' },

  iosPickerWrap: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, paddingBottom: spacing.lg },

  sheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetKeyboardWrap: { width: '100%' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xl },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  sheetTitle: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text },
  doneText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary },
  sheetSubtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
  noteInput: {
    minHeight: 100, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, fontFamily: fonts.body, fontSize: 14, color: colors.text,
    backgroundColor: colors.surface, textAlignVertical: 'top', marginBottom: spacing.lg,
  },

  contactCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  contactAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  contactAvatarText: { fontFamily: fonts.display, fontSize: 17, color: colors.primary },
  contactName: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text, marginBottom: 3 },
  contactMeta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginBottom: 1 },
  groupLabelInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, fontFamily: fonts.body, fontSize: 14, color: colors.text,
    backgroundColor: colors.surface, marginBottom: spacing.md,
  },
  dateButton: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, backgroundColor: colors.surface,
  },
  dateButtonText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  reviewCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  reviewCardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text, marginBottom: spacing.sm },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  reviewLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  reviewValue: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.text },
});