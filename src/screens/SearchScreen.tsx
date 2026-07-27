import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchUsers } from '../api/users';
import { IgUser } from '../types/instagram';
import { RootStackParamList } from '../navigation/types';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { LargeHeader, Separator } from '../ui/components';
import { EmptyState, Screen } from '../ui/Screen';
import { colors, radius, spacing, type } from '../ui/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IgUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce so we don't fire a request on every keystroke.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        setError(null);
        setResults(await searchUsers(q));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const openProfile = useCallback(
    (user: IgUser) => {
      navigation.navigate('Profile', { userId: user.pk, username: user.username });
    },
    [navigation],
  );

  return (
    <Screen edges={['top']}>
      <LargeHeader title="Recherche" />
      <View style={styles.searchBar}>
        <View style={styles.field}>
          <Icon name="search" size={18} color={colors.textMuted} strokeWidth={1.8} />
          <TextInput
            style={styles.input}
            placeholder="Rechercher un profil"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            value={query}
            onChangeText={setQuery}
          />
          {loading ? <ActivityIndicator color={colors.textMuted} size="small" /> : null}
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={results}
        keyExtractor={(u) => u.pk}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <Separator inset={72} />}
        ListEmptyComponent={
          !loading && query.trim() ? (
            <EmptyState text="Aucun résultat." />
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => openProfile(item)}>
            <Avatar uri={item.profile_pic_url} size={44} />
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.username}
                </Text>
                {item.is_verified ? (
                  <View style={styles.verified}>
                    <Icon name="check" size={9} color={colors.onAccent} strokeWidth={1.6} />
                  </View>
                ) : null}
              </View>
              {item.full_name ? (
                <Text style={styles.full} numberOfLines={1}>
                  {item.full_name}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    padding: 0,
  },
  error: { ...type.footnote, color: colors.danger, paddingHorizontal: spacing.lg },
  listContent: { paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  info: { flex: 1, marginLeft: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...type.headline, fontWeight: '600' },
  verified: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { ...type.footnote, marginTop: 2 },
});
