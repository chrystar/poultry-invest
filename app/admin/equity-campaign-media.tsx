import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { deleteCampaignMedia, updateCampaignMedia, uploadCampaignMedia, useEquityCampaignMedia, type CampaignMedia } from '../../hooks/useEquityCampaignMedia';

export default function AdminEquityCampaignMediaScreen() {
  const { campaignId, title } = useLocalSearchParams<{ campaignId: string; title?: string }>();
  const { user } = useAuth();
  const { items, loading, refetch } = useEquityCampaignMedia(campaignId, true);
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<CampaignMedia | null>(null);

  const pickAndUpload = async (mediaType: 'photo' | 'video') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0] || !user || !campaignId) return;

    setUploading(true);
    try {
      await uploadCampaignMedia({
        campaignId,
        uri: result.assets[0].uri,
        mimeType: result.assets[0].mimeType,
        fileName: result.assets[0].fileName,
        userId: user.id,
        mediaType,
      });
      refetch();
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (item: CampaignMedia) => {
    Alert.alert('Delete media', 'This removes the file permanently. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCampaignMedia(item);
            refetch();
          } catch (err: any) {
            Alert.alert('Delete failed', err.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{title ?? 'Batch Media'}</Text>
      </View>

      <View style={styles.privacyNotice}>
        <Feather name="lock" size={13} color={colors.primary} />
        <Text style={styles.privacyText}>Only confirmed investors in this campaign can see this media.</Text>
      </View>

      <View style={styles.uploadRow}>
        <Pressable style={[styles.uploadBtn, shadow.card]} onPress={() => pickAndUpload('photo')} disabled={uploading}>
          <Feather name="image" size={16} color={colors.primary} />
          <Text style={styles.uploadBtnText}>Add photo</Text>
        </Pressable>
        <Pressable style={[styles.uploadBtn, shadow.card]} onPress={() => pickAndUpload('video')} disabled={uploading}>
          <Feather name="video" size={16} color={colors.primary} />
          <Text style={styles.uploadBtnText}>Add video</Text>
        </Pressable>
      </View>

      {uploading && (
        <View style={styles.uploadingBanner}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.row, shadow.card]}>
              <Pressable onPress={() => setEditingItem(item)}>
                <Image source={{ uri: item.signedUrl }} style={styles.thumb} contentFit="cover" />
                {item.media_type === 'video' && (
                  <View style={styles.playBadge}><Feather name="play" size={11} color="#fff" /></View>
                )}
              </Pressable>
              <Pressable style={{ flex: 1 }} onPress={() => setEditingItem(item)}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
                <Text style={styles.rowMeta}>{item.media_type === 'video' ? 'Video' : 'Photo'}</Text>
              </Pressable>
              <View style={styles.rowActions}>
                <Switch
                  value={item.is_published}
                  onValueChange={async () => { await updateCampaignMedia(item.id, { is_published: !item.is_published }); refetch(); }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
                <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                  <Feather name="trash-2" size={16} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No media uploaded yet.</Text>}
        />
      )}

      {editingItem && (
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditingItem(null)} />
          <EditSheet item={editingItem} onClose={() => setEditingItem(null)} onSaved={() => { setEditingItem(null); refetch(); }} />
        </View>
      )}
    </SafeAreaView>
  );
}

function EditSheet({ item, onClose, onSaved }: { item: CampaignMedia; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(item.title);
  const [caption, setCaption] = useState(item.caption);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCampaignMedia(item.id, { title, caption });
      onSaved();
    } catch (err: any) {
      Alert.alert('Save failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />
      <Text style={styles.sheetTitle}>Edit details</Text>
      <InputField label="Title" value={title} onChangeText={setTitle} />
      <InputField label="Caption" value={caption} onChangeText={setCaption} multiline style={{ height: 80, textAlignVertical: 'top', paddingTop: spacing.sm }} />
      <PrimaryButton label="Save" onPress={handleSave} loading={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text },
  privacyNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryMuted, marginHorizontal: spacing.lg, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.md },
  privacyText: { flex: 1, fontFamily: fonts.body, fontSize: 11.5, color: colors.primary },
  uploadRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: spacing.md },
  uploadBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.text },
  uploadingBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryMuted, marginHorizontal: spacing.lg, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.md },
  uploadingText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.primary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  thumb: { width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.primaryMuted },
  playBadge: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text, marginBottom: 2 },
  rowMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },
  rowActions: { alignItems: 'center', gap: spacing.sm },
  sheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xl },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginBottom: spacing.lg },
});