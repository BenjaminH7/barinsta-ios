import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { getReelsMedia } from '../api/stories';
import { StoryItem } from '../types/instagram';
import { RootStackParamList } from '../navigation/types';
import { Icon } from '../ui/Icon';
import { spacing } from '../ui/theme';

type ViewerRoute = RouteProp<RootStackParamList, 'StoryViewer'>;

const IMAGE_DURATION_MS = 5000;

export function StoryViewerScreen() {
  const route = useRoute<ViewerRoute>();
  const navigation = useNavigation();
  const { userIds, username } = route.params;
  const { width, height } = useWindowDimensions();

  const [items, setItems] = useState<StoryItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getReelsMedia(userIds)
      .then((res) => {
        const reels = res.reels ?? {};
        const all: StoryItem[] = [];
        for (const id of userIds) {
          const reel = reels[id];
          if (reel?.items) all.push(...reel.items);
        }
        // Fallback: some responses use the array form.
        if (all.length === 0 && res.reels_media) {
          for (const reel of res.reels_media) all.push(...(reel.items ?? []));
        }
        setItems(all);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false));
  }, [userIds]);

  const current = items[index];
  const isVideo = current?.media_type === 2;

  const imageUrl = useMemo(() => {
    const candidates = current?.image_versions2?.candidates ?? [];
    return candidates[0]?.url;
  }, [current]);

  const videoUrl = current?.video_versions?.[0]?.url;

  const advance = (dir: 1 | -1) => {
    setIndex((i) => {
      const next = i + dir;
      if (next < 0) return 0;
      if (next >= items.length) {
        navigation.goBack();
        return i;
      }
      return next;
    });
  };

  // Auto-advance images.
  useEffect(() => {
    if (loading || isVideo || !current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => advance(1), IMAGE_DURATION_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, loading, isVideo, current]);

  return (
    <View style={styles.container}>
      {/* progress segments */}
      <View style={styles.progressRow}>
        {items.map((_, i) => (
          <View key={i} style={styles.progressSeg}>
            <View
              style={[
                styles.progressFill,
                { width: i < index ? '100%' : i === index ? '50%' : '0%' },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={styles.header}>
        <Text style={styles.username}>{username}</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="close" size={22} color="#fff" strokeWidth={2} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#fff" style={styles.center} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !current ? (
        <Text style={styles.error}>Story indisponible.</Text>
      ) : isVideo && videoUrl ? (
        <Video
          source={{ uri: videoUrl }}
          style={{ width, height }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={(s) => {
            if ('didJustFinish' in s && s.didJustFinish) advance(1);
          }}
        />
      ) : imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width, height }} resizeMode="contain" />
      ) : (
        <Text style={styles.error}>Média non pris en charge.</Text>
      )}

      {/* tap zones: left = previous, right = next */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.tapRow}>
          <Pressable style={styles.tapZone} onPress={() => advance(-1)} />
          <Pressable style={styles.tapZone} onPress={() => advance(1)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  center: { position: 'absolute', alignSelf: 'center' },
  progressRow: {
    position: 'absolute',
    top: 48,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    zIndex: 10,
    gap: 3,
  },
  progressSeg: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  header: {
    position: 'absolute',
    top: 58,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  username: { color: '#fff', fontWeight: '700', fontSize: 15 },
  close: { color: '#fff', fontSize: 22 },
  error: { color: '#fff', textAlign: 'center', padding: spacing.xl },
  tapRow: { flex: 1, flexDirection: 'row' },
  tapZone: { flex: 1 },
});
