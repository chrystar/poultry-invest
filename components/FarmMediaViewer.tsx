import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';
import type { FarmMedia } from '../hooks/useFarmMedia';
import FarmVideoPlayer from './FarmVideoPlayer';

type Props = {
  item: FarmMedia | null;
  onClose: () => void;
};

export default function FarmMediaViewer({ item, onClose }: Props) {
  return (
    <Modal visible={!!item} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
          <Feather name="x" size={20} color="#fff" />
        </Pressable>

        {item?.media_type === 'video' ? (
          <FarmVideoPlayer uri={item.public_url} style={styles.video} />
        ) : item ? (
          <Image source={{ uri: item.public_url }} style={styles.photo} contentFit="contain" />
        ) : null}

        {item && (item.title || item.caption) ? (
          <View style={styles.captionBlock}>
            {item.title ? <Text style={styles.title}>{item.title}</Text> : null}
            {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#0E120F',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: spacing.lg,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '68%' },
  video: { borderRadius: 0, backgroundColor: '#000' },
  captionBlock: { marginTop: spacing.lg, paddingHorizontal: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 20, color: '#fff', marginBottom: 6 },
  caption: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.72)' },
});
