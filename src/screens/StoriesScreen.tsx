import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getReelsTray } from '../api/stories';
import { ReelsTrayItem } from '../types/instagram';
import { RootStackParamList } from '../navigation/types';
import { Avatar } from '../ui/Avatar';
import { EmptyState, Loading, Screen } from '../ui/Screen';
import { colors, spacing } from '../ui/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function StoriesScreen() {
  const navigation = useNavigation<Nav>();
  const [tray, setTray] = useState<ReelsTrayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await getReelsTray();
      setTray(res.tray ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openStory = useCallback(
    (item: ReelsTrayItem) => {
      navigation.navigate('StoryViewer', {
        userIds: [String(item.user.pk)],
        startIndex: 0,
        username: item.user.username,
      });
    },
    [navigation],
  );

  if (loading) return <Loading />;

  return (
    <Screen>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={tray}
        keyExtractor={(t) => String(t.user.pk)}
        numColumns={3}
        columnWrapperStyle={styles.rowWrap}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={<EmptyState text="Aucune story en ce moment." />}
        renderItem={({ item }) => {
          const seen = (item.seen ?? 0) >= (item.latest_reel_media ?? 0) && !!item.seen;
          return (
            <TouchableOpacity style={styles.cell} onPress={() => openStory(item)}>
              <Avatar uri={item.user.profile_pic_url} size={78} ring={!seen} />
              <Text style={styles.username} numberOfLines={1}>
                {item.user.username}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, padding: spacing.lg },
  grid: { padding: spacing.sm },
  rowWrap: { justifyContent: 'flex-start' },
  cell: { width: '33.33%', alignItems: 'center', paddingVertical: spacing.md },
  username: {
    color: colors.text,
    fontSize: 12,
    marginTop: spacing.xs,
    maxWidth: 90,
    textAlign: 'center',
  },
});
