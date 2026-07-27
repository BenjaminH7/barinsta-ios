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
import { getInbox } from '../api/directMessages';
import { useAuth } from '../context/AuthContext';
import { DirectThread } from '../types/instagram';
import { RootStackParamList } from '../navigation/types';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { Button, LargeHeader, Separator } from '../ui/components';
import { EmptyState, Loading, Screen } from '../ui/Screen';
import { colors, spacing, type } from '../ui/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function threadTitle(thread: DirectThread, selfId: string): string {
  if (thread.thread_title) return thread.thread_title;
  const others = thread.users.filter((u) => u.pk !== selfId);
  return others.map((u) => u.username).join(', ') || 'Conversation';
}

function preview(thread: DirectThread): string {
  const last = thread.items?.[0];
  if (!last) return '';
  if (last.item_type === 'text') return last.text ?? '';
  return `[${last.item_type}]`;
}

export function InboxScreen() {
  const navigation = useNavigation<Nav>();
  const { session, signOut } = useAuth();
  const [threads, setThreads] = useState<DirectThread[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await getInbox();
      setThreads(res.inbox?.threads ?? []);
      setPendingCount(res.pending_requests_total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  if (loading) return <Loading />;

  const selfId = session?.userId ?? '';

  return (
    <Screen edges={['top']}>
      <LargeHeader
        title="Messages"
        right={<Button label="Déconnexion" variant="ghost" onPress={signOut} />}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={threads}
        keyExtractor={(t) => t.thread_id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <Separator inset={84} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} />
        }
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.requestsRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MessageRequests')}
          >
            <View style={styles.requestsIcon}>
              <Icon name="person" size={22} color={colors.accent} />
            </View>
            <Text style={styles.requestsText}>Demandes de message</Text>
            {pendingCount ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            ) : null}
            <Icon name="chevron" size={18} color={colors.textFaint} />
          </TouchableOpacity>
        }
        ListEmptyComponent={<EmptyState text="Aucune conversation." />}
        renderItem={({ item }) => {
          const title = threadTitle(item, selfId);
          const unread = (item.read_state ?? 0) > 0;
          const other = item.users.find((u) => u.pk !== selfId) ?? item.users[0];
          return (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('Thread', { threadId: item.thread_id, title })
              }
            >
              <Avatar uri={other?.profile_pic_url} size={56} />
              <View style={styles.rowText}>
                <Text style={[styles.name, unread && styles.bold]} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
                  {preview(item)}
                </Text>
              </View>
              {unread ? <View style={styles.dot} /> : null}
            </TouchableOpacity>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { ...type.footnote, color: colors.danger, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  listContent: { paddingBottom: spacing.xl },
  requestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  requestsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsText: { ...type.callout, flex: 1, marginLeft: spacing.md },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  badgeText: { color: colors.onAccent, fontSize: 12, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowText: { flex: 1, marginLeft: spacing.md },
  name: { ...type.headline, fontWeight: '600' },
  bold: { fontWeight: '700' },
  preview: { ...type.subhead, marginTop: 3 },
  previewUnread: { color: colors.text, fontWeight: '500' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginLeft: spacing.sm,
  },
});
