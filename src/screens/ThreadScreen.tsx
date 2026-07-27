import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, type RouteProp } from '@react-navigation/native';
import {
  getThread,
  markItemSeen,
  sendText,
  sendPhoto,
  sendVoice,
  uploadAudio,
  uploadPhoto,
  type ViewMode,
} from '../api/directMessages';
import { useAuth } from '../context/AuthContext';
import { DirectItem } from '../types/instagram';
import { RootStackParamList } from '../navigation/types';
import { Icon } from '../ui/Icon';
import { Loading, Screen } from '../ui/Screen';
import { colors, radius, spacing, type } from '../ui/theme';

type ThreadRoute = RouteProp<RootStackParamList, 'Thread'>;

/** Refresh the thread this often (ms) to see new incoming items live. */
const POLL_MS = 4000;

/** A rough waveform for voice messages — only used for the visual bars. */
function randomWaveform(): number[] {
  return Array.from({ length: 24 }, () => Math.round(Math.random() * 100) / 100);
}

/** Short human label for an item type (shown in the "live" banner). */
function typeLabel(item: DirectItem): string {
  switch (item.item_type) {
    case 'text':
      return 'Texte';
    case 'media':
      return 'Photo';
    case 'voice_media':
      return 'Message vocal';
    case 'visual_media':
    case 'raven_media':
      return item.visual_media?.view_mode === 'permanent' ? 'Photo' : 'Photo vue unique';
    case 'animated_media':
      return 'GIF';
    default:
      return item.item_type;
  }
}

/** A voice message bubble with a play/pause toggle. */
function VoiceBubble({ url }: { url?: string }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(
    () => () => {
      void soundRef.current?.unloadAsync();
    },
    [],
  );

  const toggle = useCallback(async () => {
    if (!url) return;
    if (playing) {
      await soundRef.current?.pauseAsync();
      setPlaying(false);
      return;
    }
    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) setPlaying(false);
      });
    }
    await soundRef.current.playAsync();
    setPlaying(true);
  }, [url, playing]);

  return (
    <TouchableOpacity style={styles.voiceRow} onPress={toggle} disabled={!url}>
      <View style={styles.voicePlay}>
        <Icon name={playing ? 'pause' : 'play'} size={16} color={colors.text} />
      </View>
      <Text style={styles.bubbleText}>Message vocal</Text>
    </TouchableOpacity>
  );
}

export function ThreadScreen() {
  const route = useRoute<ThreadRoute>();
  const { threadId } = route.params;
  const { session } = useAuth();
  const selfId = session?.userId ?? '';

  const [items, setItems] = useState<DirectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const recordingRef = useRef<Audio.Recording | null>(null);

  /** Silent refresh — never toggles the full-screen loader, never marks seen. */
  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await getThread(threadId);
      setItems(res.thread?.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }, [threadId]);

  useEffect(() => {
    void (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  // Poll for new incoming messages so we see their type in real time.
  useEffect(() => {
    const id = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const onSendText = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
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
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi");
    } finally {
      setSending(false);
    }
  }, [draft, sending, selfId, threadId, refresh]);

  const pickAndSendPhoto = useCallback(
    async (source: 'library' | 'camera', viewMode: ViewMode) => {
      try {
        const perm =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setError('Permission refusée pour la photo.');
          return;
        }
        const result =
          source === 'camera'
            ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
            : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
        if (result.canceled) return;
        const asset = result.assets[0];
        setSending(true);
        const uploadId = await uploadPhoto(asset.uri);
        await sendPhoto(threadId, uploadId, viewMode);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'envoi de la photo");
      } finally {
        setSending(false);
      }
    },
    [threadId, refresh],
  );

  const onAttach = useCallback(() => {
    Alert.alert('Envoyer une photo', undefined, [
      { text: 'Galerie', onPress: () => void pickAndSendPhoto('library', 'permanent') },
      { text: 'Caméra', onPress: () => void pickAndSendPhoto('camera', 'permanent') },
      { text: 'Vue unique (galerie)', onPress: () => void pickAndSendPhoto('library', 'once') },
      { text: 'Vue unique (caméra)', onPress: () => void pickAndSendPhoto('camera', 'once') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, [pickAndSendPhoto]);

  const startRecording = useCallback(async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setError('Permission micro refusée.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = rec;
      setRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de démarrer l'enregistrement");
    }
  }, []);

  const stopAndSendRecording = useCallback(async () => {
    const rec = recordingRef.current;
    if (!rec) return;
    setRecording(false);
    recordingRef.current = null;
    try {
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = rec.getURI();
      if (!uri) return;
      setSending(true);
      const uploadId = await uploadAudio(uri);
      await sendVoice(threadId, uploadId, randomWaveform());
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi du vocal");
    } finally {
      setSending(false);
    }
  }, [threadId, refresh]);

  // Most recent message received from the other person (for the read receipt).
  const latestIncoming = items.find((i) => String(i.user_id) !== selfId);

  const onMarkRead = useCallback(async () => {
    if (!latestIncoming) return;
    try {
      await markItemSeen(threadId, latestIncoming.item_id);
      Alert.alert('Vu envoyé', "L'accusé de lecture a été envoyé.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'accusé de lecture");
    }
  }, [threadId, latestIncoming]);

  const renderContent = useCallback(
    (item: DirectItem) => {
      switch (item.item_type) {
        case 'text':
          return <Text style={styles.bubbleText}>{item.text}</Text>;

        case 'media': {
          const url = item.media?.image_versions2?.candidates?.[0]?.url;
          return url ? (
            <Image source={{ uri: url }} style={styles.media} resizeMode="cover" />
          ) : (
            <Text style={styles.bubbleText}>🖼️ photo</Text>
          );
        }

        case 'visual_media':
        case 'raven_media': {
          const vm = item.visual_media;
          const url = vm?.media?.image_versions2?.candidates?.[0]?.url;
          const isRevealed = revealed[item.item_id];
          if (isRevealed && url) {
            return <Image source={{ uri: url }} style={styles.media} resizeMode="cover" />;
          }
          return (
            <TouchableOpacity
              onPress={() =>
                setRevealed((prev) => ({ ...prev, [item.item_id]: true }))
              }
            >
              <Text style={styles.bubbleText}>👁️ Photo vue unique</Text>
              <Text style={styles.hint}>
                {url ? 'Appuyez pour révéler (sans notifier)' : 'Contenu non disponible'}
              </Text>
            </TouchableOpacity>
          );
        }

        case 'voice_media':
          return <VoiceBubble url={item.voice_media?.media?.audio?.audio_src} />;

        default:
          return <Text style={styles.bubbleText}>{typeLabel(item)}</Text>;
      }
    },
    [revealed],
  );

  if (loading) return <Loading />;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Live banner: type of the last received item, without marking it seen. */}
        {latestIncoming ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText} numberOfLines={1}>
              Dernier reçu : {typeLabel(latestIncoming)}
            </Text>
            <TouchableOpacity onPress={onMarkRead}>
              <Text style={styles.bannerAction}>Marquer comme lu</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
                  {renderContent(item)}
                </View>
              </View>
            );
          }}
        />

        <View style={styles.composer}>
          <TouchableOpacity onPress={onAttach} disabled={sending} style={styles.iconBtn}>
            <Icon name="plus" size={26} color={colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          {draft.trim() ? (
            <TouchableOpacity onPress={onSendText} disabled={sending} style={styles.sendBtn}>
              <Text style={styles.sendText}>Envoyer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={recording ? stopAndSendRecording : startRecording}
              disabled={sending}
              style={styles.iconBtn}
            >
              <Icon
                name={recording ? 'stop' : 'mic'}
                size={24}
                color={recording ? colors.danger : colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {sending ? (
          <View style={styles.sendingRow}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.hint}> Envoi…</Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  error: { ...type.footnote, color: colors.danger, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bannerText: { ...type.footnote, flex: 1 },
  bannerAction: { ...type.footnote, color: colors.accent, fontWeight: '700' },
  list: { padding: spacing.md },
  bubbleRow: { marginVertical: 3, flexDirection: 'row' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
  },
  mine: { backgroundColor: colors.accent, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.surfaceHigh, borderBottomLeftRadius: 6 },
  bubbleText: { ...type.body, fontSize: 15, lineHeight: 20 },
  hint: { ...type.caption, marginTop: 2 },
  media: { width: 220, height: 220, borderRadius: radius.md, backgroundColor: colors.surface },
  voiceRow: { flexDirection: 'row', alignItems: 'center' },
  voicePlay: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    maxHeight: 120,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: colors.onAccent, fontWeight: '600', fontSize: 15 },
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
