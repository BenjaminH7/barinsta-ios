# Barinsta Lite (iOS / React Native)

Client Instagram **non officiel** et minimaliste, inspiré de l'app Android open-source
[barinsta](https://github.com/Android-Builds/barinsta). Il ne fait **que trois choses** :

1. **Messages** — boîte de réception, ouverture d'une conversation, envoi de texte.
2. **Demandes de message** — accepter / refuser les demandes (pending inbox).
3. **Stories** — voir les stories des gens que tu suis.
4. **Demandes d'abonnement** — accepter / refuser (approve / ignore).

Il **n'affiche volontairement pas** : le nombre d'abonnés/abonnements, ni les
publications (feed) des utilisateurs. Ces champs ne sont même pas modélisés
dans le code (voir `src/types/instagram.ts`).

---

## ⚠️ À lire avant tout

- **API privée.** Comme barinsta, l'app utilise l'API mobile interne d'Instagram
  (`i.instagram.com/api/v1/...`), **pas** l'API Graph officielle. C'est **contraire
  aux CGU d'Instagram** et peut entraîner une **limitation ou un bannissement** du
  compte. À utiliser à tes risques, sur ton propre compte.
- **App Store.** Apple **refusera** cette app sur le store. Tu ne peux la faire tourner
  que via un **build de développement / sideload** (compte développeur perso, ou EAS
  Build + installation sur ton appareil).
- **Endpoints non garantis.** Instagram change ses endpoints régulièrement ; certaines
  requêtes peuvent cesser de fonctionner et demander des ajustements.

---

## Architecture

```
App.tsx                      Providers + navigation
src/
  api/
    constants.ts             URL de base, X-IG-App-ID, User-Agent
    session.ts               Session en mémoire + expo-secure-store, UUID device
    cookies.ts               Lecture des cookies (dont httpOnly) après login WebView
    client.ts                fetch() avec cookies + headers ; GET / POST form
    directMessages.ts        inbox, pending_inbox, thread, send, approve/decline
    stories.ts               reels_tray, reels_media
    friendships.ts           pending, approve, ignore (demandes d'abonnement)
  context/AuthContext.tsx    signIn / signOut / restauration de session
  navigation/                stack + bottom tabs
  screens/                   Login (WebView), Inbox, Thread, MessageRequests,
                             Stories, StoryViewer, FollowRequests
  types/instagram.ts         Types réponses (SANS abonnés/posts, volontairement)
  ui/                        thème, Avatar, Screen/Loading/Empty
```

### Authentification (login WebView)

`LoginScreen` ouvre la **vraie page de login** `instagram.com` dans une WebView.
Une fois connecté (le 2FA/les challenges sont gérés par la page IG elle-même), on lit
les cookies — dont `sessionid` qui est **httpOnly** — via le module natif
`@react-native-cookies/cookies`, puis on les stocke dans le trousseau sécurisé
(`expo-secure-store`). Toutes les requêtes API réutilisent ensuite ces cookies +
`X-IG-App-ID` + un User-Agent iPhone. Aucune donnée ne quitte l'appareil.

---

## Prérequis

- Node.js 18+
- `npm install`
- Un iPhone pour tester (ou un Mac + simulateur iOS)

> **Important — Expo Go ne suffit pas.** La lecture des cookies httpOnly
> (`@react-native-cookies/cookies`) est un module natif absent d'Expo Go. Il faut un
> **development build**. Bonne nouvelle : tu peux le générer **depuis Windows** avec
> le cloud **EAS Build** (pas besoin de Mac).

## Installation

```bash
npm install
npm run typecheck   # vérifie le TypeScript
```

## Lancer sur iPhone depuis Windows (EAS Build)

```bash
npm install -g eas-cli
eas login                       # crée un compte Expo si besoin
eas build:configure
eas build --profile development --platform ios
```

- EAS te guide pour la signature iOS (il te faut un **compte développeur Apple** ;
  99 $/an pour un vrai provisioning, ou un compte gratuit pour un profil ad-hoc court).
- À la fin, installe le build sur ton iPhone, puis :

```bash
npm start          # démarre Metro en mode dev-client
```

et scanne le QR code avec l'app installée.

## Lancer sur simulateur (si tu passes sur un Mac)

```bash
npm run ios
```

---

## Ce qui reste à faire (idées)

- Pagination (curseurs `cursor` / `next_max_id`) déjà câblée côté API, à brancher dans l'UI.
- Marquer les messages/stories comme vus (`items/{id}/seen/`, `media/seen/`).
- Envoi de médias / réactions.
- Rafraîchissement automatique / badge de non-lus.

## Crédits

Endpoints et approche d'auth dérivés du projet open-source **barinsta**
(GPL-3.0). Ce dépôt est fourni à titre éducatif.
