import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import {
  approveThread,
  declineThread,
  getPendingInbox,
} from '../api/directMessages';
import { useAuth } from '../context/AuthContext';
import { DirectThread } from '../types/instagram';
import { Avatar } from '../ui/Avatar';
import { Button, Separator } from '../ui/components';
import { EmptyState, Loading, Screen } from '../ui/Screen';
import { colors, spacing, type } from '../ui/theme';

export function MessageRequestsScreen() {
  const { session } = useAuth();
  const selfId = session?.userId ?? '';
  const [threads, setThreads] = useState<DirectThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getPendingInbox();
      setThreads(res.inbox?.threads ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = useCallback(
    async (thread: DirectThread, accept: boolean) => {
      setBusy(thread.thread_id);
      try {
        if (accept) await approveThread(thread.thread_id);
        else await declineThread(thread.thread_id);
        setThreads((prev) => prev.filter((t) => t.thread_id !== thread.thread_id));
      } catch (e) {
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Action échouée');
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  if (loading) return <Loading />;

  return (
    <Screen edges={['bottom']}>
      <FlatList
        data={threads}
        keyExtractor={(t) => t.thread_id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <Separator inset={80} />}
        ListEmptyComponent={<EmptyState text="Aucune demande de message." />}
        renderItem={({ item }) => {
          const other = item.users.find((u) => u.pk !== selfId) ?? item.users[0];
          const last = item.items?.[0];
          const isBusy = busy === item.thread_id;
          return (
            <View style={styles.row}>
              <Avatar uri={other?.profile_pic_url} size={52} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {other?.username ?? item.thread_title}
                </Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {last?.item_type === 'text' ? last.text : `[${last?.item_type ?? ''}]`}
                </Text>
              </View>
              <View style={styles.actions}>
                <Button
                  label="Accepter"
                  variant="primary"
                  disabled={isBusy}
                  onPress={() => act(item, true)}
                  style={styles.btn}
                />
                <Button
                  label="Refuser"
                  variant="secondary"
                  disabled={isBusy}
                  onPress={() => act(item, false)}
                  style={styles.btn}
                />
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  info: { flex: 1, marginLeft: spacing.md },
  name: { ...type.headline, fontWeight: '600' },
  preview: { ...type.footnote, marginTop: 2 },
  actions: { gap: spacing.sm },
  btn: { minHeight: 34, paddingHorizontal: spacing.md },
});
