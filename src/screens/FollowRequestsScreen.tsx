import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  approveFollowRequest,
  getPendingFollowRequests,
  ignoreFollowRequest,
} from '../api/friendships';
import { IgUser } from '../types/instagram';
import { Avatar } from '../ui/Avatar';
import { EmptyState, Loading, Screen } from '../ui/Screen';
import { colors, spacing } from '../ui/theme';

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
    <Screen>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={users}
        keyExtractor={(u) => u.pk}
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
                <TouchableOpacity
                  disabled={isBusy}
                  style={[styles.btn, styles.accept]}
                  onPress={() => act(item, true)}
                >
                  <Text style={styles.btnText}>Accepter</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={isBusy}
                  style={[styles.btn, styles.decline]}
                  onPress={() => act(item, false)}
                >
                  <Text style={styles.btnText}>Refuser</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, padding: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1, marginLeft: spacing.md },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  full: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  actions: { gap: spacing.xs },
  btn: { paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: 8, alignItems: 'center' },
  accept: { backgroundColor: colors.accent },
  decline: { backgroundColor: colors.surfaceAlt },
  btnText: { color: colors.text, fontWeight: '600', fontSize: 13 },
});
