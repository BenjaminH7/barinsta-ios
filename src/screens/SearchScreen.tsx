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
import { EmptyState, Screen } from '../ui/Screen';
import { colors, spacing } from '../ui/theme';

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
    <Screen>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Rechercher un profil"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          value={query}
          onChangeText={setQuery}
        />
        {loading ? <ActivityIndicator color={colors.accent} /> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={results}
        keyExtractor={(u) => u.pk}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !loading && query.trim() ? (
            <EmptyState text="Aucun résultat." />
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => openProfile(item)}>
            <Avatar uri={item.profile_pic_url} size={44} />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {item.username}
                {item.is_verified ? ' ✔' : ''}
              </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  error: { color: colors.danger, paddingHorizontal: spacing.lg },
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
});
