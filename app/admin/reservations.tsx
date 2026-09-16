import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

type ReservationRow = {
  id: string;
  reference_code: string;
  status: string;
  created_at: string;
  source: 'Livestock' | 'Equity' | 'Venture';
  table: 'investment_interests' | 'equity_interests' | 'venture_interests';
  user_id: string;
};

const FILTERS = ['all', 'pending', 'confirmed'] as const;
type Filter = (typeof FILTERS)[number];

function toDateOnlyString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  const [showBulkDatePicker, setShowBulkDatePicker] = useState(false);
  const [bulkDate, setBulkDate] = useState(new Date());

  const endOfToday = new Date();
endOfToday.setHours(23, 59, 59, 999);

  const fetchAll = useCallback(async () => {
    const [livestock, equity, ventures] = await Promise.all([
      supabase.from('investment_interests').select('id, reference_code, status, created_at, user_id').order('created_at', { ascending: false }),
      supabase.from('equity_interests').select('id, reference_code, status, created_at, user_id').order('created_at', { ascending: false }),
      supabase.from('venture_interests').select('id, reference_code, status, created_at, user_id').order('created_at', { ascending: false }),
    ]);

    const combined: ReservationRow[] = [
      ...(livestock.data ?? []).map((r) => ({ ...r, source: 'Livestock' as const, table: 'investment_interests' as const })),
      ...(equity.data ?? []).map((r) => ({ ...r, source: 'Equity' as const, table: 'equity_interests' as const })),
      ...(ventures.data ?? []).map((r) => ({ ...r, source: 'Venture' as const, table: 'venture_interests' as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
    let result = rows;
    if (filter === 'pending') result = result.filter((r) => r.status === 'pending');
    if (filter === 'confirmed') result = result.filter((r) => r.status === 'confirmed' || r.status === 'active');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => r.reference_code.toLowerCase().includes(q));
    }
    return result;
  }, [rows, filter, search]);

  const updateStatus = async (row: ReservationRow, newStatus: string) => {
    const { error } = await supabase.from(row.table).update({ status: newStatus }).eq('id', row.id);
    if (error) {
      Alert.alert('Update failed', error.message);
      return;
    }
    fetchAll();
  };

  const confirmStatusChange = (row: ReservationRow) => {
    Alert.alert('Update status', `Mark ${row.reference_code} as confirmed?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => updateStatus(row, 'confirmed') },
    ]);
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

  const handleBulkDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowBulkDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        if (selectedDate > new Date()) {
          Alert.alert('Invalid date', 'Batch start date cannot be in the future.');
          return;
        }
        setBulkDate(selectedDate);
        applyBulkBatchDateWithDate(selectedDate);
      }
      return;
    }
    if (selectedDate) setBulkDate(selectedDate);
  };

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
      confirmStatusChange(row);
    } else if (row.source === 'Livestock') {
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
        <View style={styles.headerActions}>
          <Pressable onPress={() => setViewMode(viewMode === 'list' ? 'table' : 'list')} style={styles.iconToggle}>
            <Feather name={viewMode === 'list' ? 'grid' : 'list'} size={15} color={colors.primary} />
          </Pressable>
          <Pressable onPress={toggleSelectMode} style={styles.iconToggle}>
            <Feather name={selectMode ? 'x' : 'check-square'} size={15} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={15} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by reference code"
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

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Confirmed'}
            </Text>
          </Pressable>
        ))}
      </View>

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
              <Text style={[styles.tableHeaderText, { flex: 1.3 }]}>Ref</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Source</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.9, textAlign: 'right' }]}>Date</Text>
            </View>
            {filteredRows.map((row) => (
              <Pressable key={row.id} style={styles.tableRow} onPress={() => handleRowPress(row)}>
                <Text style={[styles.tableCellBold, { flex: 1.3 }]} numberOfLines={1}>{row.reference_code}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>{row.source}</Text>
                <Text
                  style={[styles.tableCell, { flex: 1, color: row.status === 'pending' ? colors.gold : colors.primary }]}
                  numberOfLines={1}
                >
                  {row.status}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.9, textAlign: 'right' }]} numberOfLines={1}>
                  {new Date(row.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          filteredRows.map((row) => (
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
                <View style={[styles.pill, row.status === 'pending' ? styles.pillPending : styles.pillConfirmed]}>
                  <Text style={[styles.pillText, { color: row.status === 'pending' ? colors.gold : colors.primary }]}>
                    {row.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.rowSource}>
                {row.source} · {new Date(row.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
              </Text>
              {!selectMode && row.status === 'pending' && <Text style={styles.tapHint}>Tap to mark as confirmed</Text>}
              {!selectMode && row.status !== 'pending' && row.source === 'Livestock' && (
                <Text style={styles.tapHint}>Tap to set batch start date</Text>
              )}
            </Pressable>
          ))
        )}
      </ScrollView>

      {selectMode && selectedIds.size > 0 && (
        <View style={[styles.bulkBar, shadow.raised]}>
          <Text style={styles.bulkBarText}>{selectedIds.size} selected</Text>
          <Pressable style={styles.bulkBarBtn} onPress={() => setShowBulkDatePicker(true)}>
            <Feather name="calendar" size={14} color="#fff" />
            <Text style={styles.bulkBarBtnText}>Set start date</Text>
          </Pressable>
        </View>
      )}

{showBulkDatePicker && (
  <View style={styles.iosPickerWrap}>
    <DateTimePicker
      value={bulkDate}
      mode="date"
      display={Platform.OS === 'ios' ? 'inline' : 'default'}
      onChange={handleBulkDateChange}
      themeVariant="light"
    />
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
      <PrimaryButton
        label="Apply date to selected"
        onPress={async () => {
      
          await applyBulkBatchDateWithDate(bulkDate);
          setShowBulkDatePicker(false);
        }}
      />
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

  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  filterChipTextActive: { color: '#fff' },

  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },

  row: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  rowTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  rowCode: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillPending: { backgroundColor: '#FBF3E4' },
  pillConfirmed: { backgroundColor: colors.primaryMuted },
  pillText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5, textTransform: 'capitalize' },
  rowSource: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  tapHint: { fontFamily: fonts.body, fontSize: 11, color: colors.gold, marginTop: 6 },

  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },

  tableCard: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeaderText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  tableCell: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
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
});