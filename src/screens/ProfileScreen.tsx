import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getUserInfo } from '../api/users';
import { followUser, unfollowUser } from '../api/friendships';
import { FriendshipStatus, IgUserProfile } from '../types/instagram';
import { RootStackParamList } from '../navigation/types';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/components';
import { EmptyState, Loading, Screen } from '../ui/Screen';
import { colors, spacing, type } from '../ui/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

/** Derives the follow button's label from the current relationship. */
function followLabel(status?: FriendshipStatus): string {
  if (status?.following) return 'Abonné';
  if (status?.outgoing_request) return 'Demande envoyée';
  return "S'abonner";
}

export function ProfileScreen({ route }: Props) {
  const { userId } = route.params;
  const [profile, setProfile] = useState<IgUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setProfile(await getUserInfo(userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFollow = useCallback(async () => {
    if (!profile) return;
    const status = profile.friendship_status;
    const wasFollowing = !!(status?.following || status?.outgoing_request);
    setBusy(true);
    try {
      const res = wasFollowing
        ? await unfollowUser(profile.pk)
        : await followUser(profile.pk);
      setProfile((prev) =>
        prev
          ? { ...prev, friendship_status: res.friendship_status ?? prev.friendship_status }
          : prev,
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action échouée');
    } finally {
      setBusy(false);
    }
  }, [profile]);

  if (loading) return <Loading />;
  if (error || !profile) {
    return (
      <Screen>
        <EmptyState text={error ?? 'Profil introuvable.'} />
      </Screen>
    );
  }

  const following = !!(
    profile.friendship_status?.following || profile.friendship_status?.outgoing_request
  );

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Avatar uri={profile.profile_pic_url} size={104} />
        <View style={styles.nameRow}>
          <Text style={styles.username} numberOfLines={1}>
            {profile.username}
          </Text>
          {profile.is_verified ? (
            <View style={styles.verified}>
              <Icon name="check" size={11} color={colors.onAccent} strokeWidth={1.8} />
            </View>
          ) : null}
        </View>
        {profile.full_name ? (
          <Text style={styles.fullName}>{profile.full_name}</Text>
        ) : null}
        {profile.biography ? (
          <Text style={styles.bio}>{profile.biography}</Text>
        ) : null}

        <Button
          label={followLabel(profile.friendship_status)}
          variant={following ? 'secondary' : 'primary'}
          loading={busy}
          onPress={toggleFollow}
          style={styles.followBtn}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.lg },
  username: { ...type.title3, fontSize: 22 },
  verified: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullName: { ...type.subhead, marginTop: spacing.xs },
  bio: {
    ...type.body,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  followBtn: { marginTop: spacing.xl, minWidth: 220 },
});
