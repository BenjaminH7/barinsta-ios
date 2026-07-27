import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getUserInfo } from '../api/users';
import { followUser, unfollowUser } from '../api/friendships';
import { FriendshipStatus, IgUserProfile } from '../types/instagram';
import { RootStackParamList } from '../navigation/types';
import { Avatar } from '../ui/Avatar';
import { EmptyState, Loading, Screen } from '../ui/Screen';
import { colors, spacing } from '../ui/theme';

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
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Avatar uri={profile.profile_pic_url} size={96} />
        <Text style={styles.username} numberOfLines={1}>
          {profile.username}
          {profile.is_verified ? ' ✔' : ''}
        </Text>
        {profile.full_name ? (
          <Text style={styles.fullName}>{profile.full_name}</Text>
        ) : null}
        {profile.biography ? (
          <Text style={styles.bio}>{profile.biography}</Text>
        ) : null}

        <TouchableOpacity
          disabled={busy}
          onPress={toggleFollow}
          style={[styles.followBtn, following ? styles.followingBtn : styles.notFollowingBtn]}
        >
          {busy ? (
            <ActivityIndicator color={following ? colors.text : '#ffffff'} />
          ) : (
            <Text style={[styles.followText, following && styles.followingText]}>
              {followLabel(profile.friendship_status)}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', padding: spacing.xl },
  username: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  fullName: { color: colors.textMuted, fontSize: 15, marginTop: spacing.xs },
  bio: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  followBtn: {
    marginTop: spacing.xl,
    minWidth: 200,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFollowingBtn: { backgroundColor: colors.accent },
  followingBtn: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  followText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  followingText: { color: colors.text },
});
