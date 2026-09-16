import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../constants/theme';

type Props = {
  uri: string;
  style?: ViewStyle;
  autoPlay?: boolean;
};

export default function FarmVideoPlayer({ uri, style, autoPlay = true }: Props) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
    if (autoPlay) instance.play();
  });

  return (
    <View style={[styles.wrap, style]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.text,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});
