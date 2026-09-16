import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function BroadcastScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [route, setRoute] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing fields', 'Title and message are required.');
      return;
    }

    setSending(true);
    const { error } = await supabase.rpc('broadcast_notification', {
      p_title: title.trim(),
      p_body: body.trim(),
      p_route: route.trim() || null,
    });
    setSending(false);

    if (error) {
      Alert.alert('Send failed', error.message);
      return;
    }

    Alert.alert('Sent', 'Notification broadcast to all users.', [{ text: 'OK', onPress: () => router.back() }]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>

          <Text style={styles.eyebrow}>ADMIN</Text>
          <Text style={styles.title}>Broadcast notification</Text>
          <Text style={styles.subtitle}>Sends to every registered user.</Text>

          <View style={{ marginTop: spacing.xl }}>
            <InputField label="Title" value={title} onChangeText={setTitle} />
            <InputField label="Message" value={body} onChangeText={setBody} multiline style={{ height: 90, textAlignVertical: 'top', paddingTop: spacing.sm }} />
            <InputField label="Route on tap (optional, e.g. /ventures)" value={route} onChangeText={setRoute} autoCapitalize="none" />
          </View>

          <PrimaryButton label="Send to all users" onPress={handleSend} loading={sending} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
});