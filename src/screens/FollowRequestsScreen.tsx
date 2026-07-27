import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  approveFollowRequest,
  getPendingFollowRequests,
  ignoreFollowRequest,
} from '../api/friendships';
import { IgUser } from '../types/instagram';
import { Avatar } from '../ui/Avatar';
import { Button, LargeHeader, Separator } from '../ui/components';
import { EmptyState, Loading, Screen } from '../ui/Screen';
import { colors, spacing, type } from '../ui/theme';

export function FollowRequestsScreen() {
  const [users, setUsers] = useState<IgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await getPendingFollowRequests();
      setUsers(res.users ?? []);
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

  const act = useCallback(async (user: IgUser, accept: boolean) => {
    setBusy(user.pk);
    try {
      if (accept) await approveFollowRequest(user.pk);
      else await ignoreFollowRequest(user.pk);
      setUsers((prev) => prev.filter((u) => u.pk !== user.pk));
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action échouée');
    } finally {
      setBusy(null);
    }
  }, []);

  if (loading) return <Loading />;

  return (
    <Screen edges={['top']}>
      <LargeHeader title="Demandes" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={users}
        keyExtractor={(u) => u.pk}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <Separator inset={80} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.textMuted}
          />
        }
        ListEmptyComponent={<EmptyState text="Aucune demande d'abonnement." />}
        renderItem={({ item }) => {
          const isBusy = busy === item.pk;
          return (
            <View style={styles.row}>
              <Avatar uri={item.profile_pic_url} size={52} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.username}
                </Text>
                {item.full_name ? (
                  <Text style={styles.full} numberOfLines={1}>
                    {item.full_name}
                  </Text>
                ) : null}
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
  error: { ...type.footnote, color: colors.danger, paddingHorizontal: spacing.lg },
  listContent: { paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  info: { flex: 1, marginLeft: spacing.md },
  name: { ...type.headline, fontWeight: '600' },
  full: { ...type.footnote, marginTop: 2 },
  actions: { gap: spacing.sm },
  btn: { minHeight: 34, paddingHorizontal: spacing.md },
});
