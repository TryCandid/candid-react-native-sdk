# Changelog

## Unpublished

## 0.2.0 — 2026-07-31

### 🎉 New features

- Initial wrapper around the Candid iOS SDK (v0.2.0): `configure`, `registerTrigger`, `log`, `reset`, and `addCandidEventListener`.
- Expo config plugin that adds the microphone usage description.
- Android and web are safe no-ops.

### 🐛 Bug fixes

- The overlay is attached via `Candid.attachUIKitOverlay(to:)` (SDK 0.2.0+), which hosts it in the app's main window — so the Candid UI stays visible in ReplayKit recordings — and passes every touch outside visible Candid UI through to the React Native content.

### 💡 Others

- The example app mirrors the iOS sample's Local / Staging / Prod environment switcher (debug-only `URLProtocol` rewrite in the example, editable Local base URL) and persists connection settings across launches.
