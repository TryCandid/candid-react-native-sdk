# Changelog

## Unpublished

## 0.2.0-beta.0 — 2026-08-03

### 💡 Others

- First npm release, published as `@trycandid/react-native` under the `beta` dist tag. The package was named `candid-react-native` while unpublished; that name was never released, so there is nothing to migrate from.

## 0.2.0 — 2026-07-31

### 🎉 New features

- Initial wrapper around the Candid iOS SDK (v0.2.0): `configure`, `registerTrigger`, `log`, `reset`, and `addCandidEventListener`.
- Expo config plugin that ensures the iOS deployment target is at least 15.1 (the native SDK's floor) and adds the microphone usage description. The pod's platform automatically matches the host app's `expo-modules-core` floor when it is higher (e.g. 16.4 on Expo SDK 57).
- The podspec downloads the checksum-pinned CandidSDK XCFramework from the public GitHub release at `pod install` time.
- Android and web are safe no-ops.

### 🐛 Bug fixes

- The overlay is attached via `Candid.attachUIKitOverlay(to:)` (SDK 0.2.0+), which hosts it in the app's main window — so the Candid UI stays visible in ReplayKit recordings — and passes every touch outside visible Candid UI through to the React Native content.

### 💡 Others

- The example app mirrors the iOS sample's Local / Staging / Prod environment switcher (debug-only `URLProtocol` rewrite in the example, editable Local base URL) and persists connection settings across launches.
