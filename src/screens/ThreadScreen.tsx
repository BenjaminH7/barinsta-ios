import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { getThread, sendText } from '../api/directMessages';
import { useAuth } from '../context/AuthContext';
import { DirectItem } from '../types/instagram';
import { RootStackParamList } from '../navigation/types';
import { Loading, Screen } from '../ui/Screen';
import { colors, spacing } from '../ui/theme';

type ThreadRoute = RouteProp<RootStackParamList, 'Thread'>;

export function ThreadScreen() {
  const route = useRoute<ThreadRoute>();
  const { threadId } = route.params;
  const { session } = useAuth();
  const selfId = session?.userId ?? '';

  const [items, setItems] = useState<DirectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await getThread(threadId);
      setItems(res.thread?.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    // Optimistic append.
    const optimistic: DirectItem = {
      item_id: `local-${Date.now()}`,
      item_type: 'text',
      user_id: Number(selfId),
      timestamp: Date.now() * 1000,
      text,
    };
    setItems((prev) => [optimistic, ...prev]);
    setDraft('');
    try {
      await sendText(threadId, text);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi");
    } finally {
      setSending(false);
    }
  }, [draft, sending, selfId, threadId, load]);

  if (loading) return <Loading />;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <FlatList
          data={items}
          inverted
          keyExtractor={(m) => m.item_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const mine = String(item.user_id) === selfId;
            return (
              <View style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={styles.bubbleText}>
                    {item.item_type === 'text' ? item.text : `[${item.item_type}]`}
                  </Text>
                </View>
              </View>
            );
          }}
        />
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={!draft.trim() || sending}
            style={styles.sendBtn}
          >
            <Text style={[styles.send, (!draft.trim() || sending) && styles.sendOff]}>
              Envoyer
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  error: { color: colors.danger, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  list: { padding: spacing.md },
  bubbleRow: { marginVertical: 3, flexDirection: 'row' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 18 },
  mine: { backgroundColor: colors.accent },
  theirs: { backgroundColor: colors.surfaceAlt },
  bubbleText: { color: colors.text, fontSize: 15 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 120,
  },
  sendBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  send: { color: colors.accent, fontWeight: '700' },
  sendOff: { color: colors.textMuted },
});
