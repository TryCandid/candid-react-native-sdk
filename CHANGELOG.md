# Changelog

## Unpublished

### 💥 Breaking changes

- Updated to Candid iOS SDK 0.3.0 and its new configuration format.
- Removed `userId` from `configure`; set it with the new `setUserId(userId)` at any time, before or after `configure`. Pass `null` to clear it.
- Flattened `configure`: `options.recordingDuration` is now `recordingDuration` at the top level. The `options` object and its `rewardText` field are gone.
- `appearance.font` now requires exactly one of `systemDesign` or `customName`.

## 0.2.0 — 2026-07-31

### 🎉 New features

- Initial wrapper around the Candid iOS SDK (v0.2.0): `configure`, `registerTrigger`, `log`, `reset`, and `addCandidEventListener`.
- Expo config plugin that adds the microphone usage description.
- Android and web are safe no-ops.

### 🐛 Bug fixes

- The overlay is attached via `Candid.attachUIKitOverlay(to:)` (SDK 0.2.0+), which hosts it in the app's main window — so the Candid UI stays visible in ReplayKit recordings — and passes every touch outside visible Candid UI through to the React Native content.

### 💡 Others

- The example app mirrors the iOS sample's Local / Staging / Prod environment switcher (debug-only `URLProtocol` rewrite in the example, editable Local base URL) and persists connection settings across launches.
