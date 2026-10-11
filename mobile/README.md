# RandevuGo Mobile

Expo + React Native + TypeScript management app for RandevuGo business owners (Android & iOS).
It is independent of the Next.js web app at the repo root: its own `package.json`, `tsconfig.json` and `node_modules`.

## Start

```bash
cd mobile
npm install        # first time only
npx expo start     # scan the QR code with Expo Go (same Wi-Fi as this computer)
```

Use `npx expo start --tunnel` if the phone cannot reach the computer on the local network.

## Checks

```bash
npm run typecheck
```

## Structure

- `src/app/` – Expo Router routes (`(auth)/login`, `(tabs)/…`)
- `src/components/` – shared UI
- `src/theme/` – colors (mirrors the web `.dark` tokens), spacing, typography
