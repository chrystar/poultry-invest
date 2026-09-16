import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const CONTENT_KEYS = [
  { key: 'about_us', label: 'About Us' },
  { key: 'terms', label: 'Terms & Conditions' },
  { key: 'privacy', label: 'Privacy Policy' },
];

export default function AdminContentScreen() {
  const [activeKey, setActiveKey] = useState('about_us');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const loadContent = async (key: string) => {
    const { data } = await supabase.from('app_content').select('*').eq('key', key).single();
    if (data) {
      setTitle(data.title);
      setBody(data.body);
    }
    setLoaded((prev) => ({ ...prev, [key]: true }));
  };

  const selectKey = (key: string) => {
    setActiveKey(key);
    loadContent(key);
  };

  useState(() => { loadContent(activeKey); });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('app_content')
      .update({ title, body, updated_at: new Date().toISOString() })
      .eq('key', activeKey);
    setSaving(false);

    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }
    Alert.alert('Saved', 'Content updated successfully.');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>

          <Text style={styles.eyebrow}>ADMIN</Text>
          <Text style={styles.title}>Edit app content</Text>

          <View style={styles.tabRow}>
            {CONTENT_KEYS.map((c) => (
              <Pressable
                key={c.key}
                style={[styles.tab, activeKey === c.key && styles.tabActive]}
                onPress={() => selectKey(c.key)}
              >
                <Text style={[styles.tabText, activeKey === c.key && styles.tabTextActive]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          <InputField label="Title" value={title} onChangeText={setTitle} />
          <InputField
            label="Body"
            value={body}
            onChangeText={setBody}
            multiline
            style={{ height: 260, textAlignVertical: 'top', paddingTop: spacing.sm }}
          />

          <PrimaryButton label="Save changes" onPress={handleSave} loading={saving} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text, marginBottom: spacing.lg },
  tabRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  tabTextActive: { color: '#fff' },
});