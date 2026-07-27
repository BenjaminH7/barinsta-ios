import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { LOGIN_URL, WEB_USER_AGENT } from '../api/constants';
import { extractSessionFromCookieJar } from '../api/cookies';
import { useAuth } from '../context/AuthContext';
import { Loading, Screen } from '../ui/Screen';
import { colors, spacing, type } from '../ui/theme';

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
    // WKWebView writes Set-Cookie asynchronously, so `sessionid` may not be in
    // the jar the instant a navigation settles. Retry a few times before
    // giving up (another nav/load event will also re-trigger this).
    for (let attempt = 0; attempt < 5 && !handled.current; attempt++) {
      const session = await extractSessionFromCookieJar();
      if (session) {
        handled.current = true;
        setChecking(true);
        await signIn(session);
        return;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  }, [signIn]);

  const onNav = useCallback(
    (nav: WebViewNavigation) => {
      // After a successful login IG leaves /accounts/login and lands on the
      // feed, the onetap screen, or another authenticated route. Probe the
      // cookie jar on any page that isn't an auth/challenge page — capture only
      // succeeds once sessionid + ds_user_id are present, so eager probing is
      // safe and far more reliable than matching an exact redirect URL.
      const url = nav.url;
      const onAuthPage =
        url.includes('/accounts/login') ||
        url.includes('/challenge') ||
        url.includes('/two_factor');
      if (!onAuthPage) void tryCapture();
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
        userAgent={WEB_USER_AGENT}
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
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  title: { ...type.title },
  sub: { ...type.footnote, marginTop: spacing.sm, lineHeight: 18 },
  web: { flex: 1, backgroundColor: colors.bg },
});
