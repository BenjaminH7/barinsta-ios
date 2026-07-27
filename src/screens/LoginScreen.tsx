import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { LOGIN_URL, USER_AGENT } from '../api/constants';
import { extractSessionFromCookieJar } from '../api/cookies';
import { useAuth } from '../context/AuthContext';
import { Loading, Screen } from '../ui/Screen';
import { colors, spacing } from '../ui/theme';

/**
 * Login is a plain WebView pointed at Instagram's real login page. Once IG
 * redirects to a logged-in URL we read the (httpOnly) session cookies out of
 * the native cookie jar and hand them to AuthContext. This keeps 2FA and
 * challenge flows working, because the real IG page handles them.
 */
export function LoginScreen() {
  const { signIn } = useAuth();
  const [checking, setChecking] = useState(false);
  const handled = useRef(false);

  const tryCapture = useCallback(async () => {
    if (handled.current) return;
    const session = await extractSessionFromCookieJar();
    if (session) {
      handled.current = true;
      setChecking(true);
      await signIn(session);
    }
  }, [signIn]);

  const onNav = useCallback(
    (nav: WebViewNavigation) => {
      // After a successful login IG leaves /accounts/login and lands on the
      // feed ("/") or another authenticated route. Probe the cookie jar then.
      const url = nav.url;
      const loggedInHint =
        !url.includes('/accounts/login') &&
        !url.includes('/challenge') &&
        !url.includes('/two_factor') &&
        (url === 'https://www.instagram.com/' ||
          url.startsWith('https://www.instagram.com/?') ||
          url.includes('/accounts/onetap'));
      if (loggedInHint) void tryCapture();
    },
    [tryCapture],
  );

  if (checking) return <Loading label="Connexion…" />;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Connexion Instagram</Text>
        <Text style={styles.sub}>
          Connecte-toi via la page officielle. Rien n'est envoyé ailleurs — la
          session reste sur ton téléphone.
        </Text>
      </View>
      <WebView
        source={{ uri: LOGIN_URL }}
        userAgent={USER_AGENT}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        onNavigationStateChange={onNav}
        // Also probe after each page settles (covers the onetap screen).
        onLoadEnd={() => void tryCapture()}
        style={styles.web}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  web: { flex: 1, backgroundColor: colors.bg },
});
