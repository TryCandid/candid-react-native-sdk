# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Initial wrapper around the Candid iOS SDK (v0.1.1): `configure`, `registerTrigger`, `log`, `reset`, and `addCandidEventListener`.
- Expo config plugin that raises the iOS deployment target to 17.0 and adds the microphone usage description.
- The podspec downloads the checksum-pinned CandidSDK XCFramework from the public GitHub release at `pod install` time.
- Android and web are safe no-ops.

### 🐛 Bug fixes

- Host the Candid overlay in a passthrough container in the app's main window instead of `Candid.attachOverlay(to:)`, whose hosting view swallowed every touch in the host app (taps and scrolling were dead). The container stays in the main window — not a separate overlay `UIWindow` — so the Candid UI remains visible in ReplayKit recordings.

### 💡 Others

- The example app mirrors the iOS sample's Local / Staging / Prod environment switcher (debug-only `URLProtocol` rewrite in the example, editable Local base URL) and persists connection settings across launches.
