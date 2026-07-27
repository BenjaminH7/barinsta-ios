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
import { EmptyState, Loading, Screen } from '../ui/Screen';
import { colors, spacing } from '../ui/theme';

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
    <Screen>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.requestsBtn}
          onPress={() => navigation.navigate('MessageRequests')}
        >
          <Text style={styles.requestsText}>
            Demandes de message{pendingCount ? ` (${pendingCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.logout}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={threads}
        keyExtractor={(t) => t.thread_id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={<EmptyState text="Aucune conversation." />}
        renderItem={({ item }) => {
          const title = threadTitle(item, selfId);
          const unread = (item.read_state ?? 0) > 0;
          const other = item.users.find((u) => u.pk !== selfId) ?? item.users[0];
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                navigation.navigate('Thread', { threadId: item.thread_id, title })
              }
            >
              <Avatar uri={other?.profile_pic_url} size={56} />
              <View style={styles.rowText}>
                <Text style={[styles.name, unread && styles.bold]} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={[styles.preview, unread && styles.bold]} numberOfLines={1}>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  requestsBtn: {},
  requestsText: { color: colors.accent, fontWeight: '600' },
  logout: { color: colors.textMuted },
  error: { color: colors.danger, padding: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowText: { flex: 1, marginLeft: spacing.md },
  name: { color: colors.text, fontSize: 15 },
  preview: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  bold: { fontWeight: '700', color: colors.text },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginLeft: spacing.sm,
  },
});
