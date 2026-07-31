# candid-react-native

React Native wrapper for the [Candid iOS SDK](https://github.com/TryCandid/candid-ios-sdk) — in-app user testing and voice feedback flows.

The wrapper is built with the [Expo Modules API](https://docs.expo.dev/modules/overview/), which works in both Expo apps and bare React Native apps. The native Candid SDK is closed source and distributed as a binary XCFramework; this package downloads the exact, checksum-pinned release at `pod install` time.

## Requirements

- iOS 15.1 or later (the native Candid SDK's floor; your Expo SDK may impose a higher minimum of its own, e.g. 16.4 on Expo SDK 57, and the pod automatically matches it)
- A development build — the module contains native code, so it does not run in Expo Go
- Android and web are no-ops: every call is safe to make from shared code, but nothing happens

## Installation

### Expo apps

```sh
npx expo install candid-react-native
```

Add the config plugin to `app.json`, then create a development build:

```json
{
  "expo": {
    "plugins": ["candid-react-native"]
  }
}
```

The plugin ensures the iOS deployment target is at least 15.1 and adds `NSMicrophoneUsageDescription` to the Info.plist. Pass a custom permission message with:

```json
{
  "expo": {
    "plugins": [
      ["candid-react-native", { "microphonePermissionText": "We record your voice feedback." }]
    ]
  }
}
```

### Bare React Native apps

Install [Expo modules](https://docs.expo.dev/bare/installing-expo-modules/) first, then:

```sh
npm install candid-react-native
npx pod-install
```

Since config plugins do not apply to bare apps, configure the project manually:

- make sure the iOS deployment target is at least 15.1,
- add `NSMicrophoneUsageDescription` to your Info.plist.

## Usage

```tsx
import {
  addCandidEventListener,
  configure,
  log,
  registerTrigger,
  reset,
} from 'candid-react-native';

// Once, early in the app lifecycle. Attaches the Candid overlay to the app.
configure({
  apiKey: 'YOUR_API_KEY',
  userId: 'user-123',
  appearance: {
    primaryColor: '#35C884',
    font: { systemDesign: 'rounded' },
    widgetPosition: 'bottomRight',
  },
});

// Register that a trigger fired. The backend decides whether to present a study.
registerTrigger('home');

// Present the resolved study every time (e.g. debug menus, internal builds).
registerTrigger('home', { oncePerUser: false });

// Forward analytics events so Candid can match tasks.
log('add_to_playlist_save', { source: 'player' });

// Observe internal SDK actions and forward them to your own analytics.
const subscription = addCandidEventListener(({ name, properties }) => {
  console.log('Candid event', name, properties);
});

// Clear the persisted per-user presentation history.
reset();
```

See `src/CandidReactNative.types.ts` for the full `CandidConfiguration` shape (options, step timings, appearance).

Not yet exposed by the wrapper: completion gifts (`CompletionGift`) and custom font providers. Custom fonts are supported by name via `appearance.font.customName`.

## How the native SDK is delivered

`ios/CandidReactNative.podspec` pins a specific CandidSDK release and its SHA-256 checksum. During `pod install` it downloads `CandidSDK.xcframework.zip` from the [public GitHub release](https://github.com/TryCandid/candid-ios-sdk/releases), verifies the checksum, and unpacks it next to the podspec. Bumping the SDK version means updating `candid_sdk_version` and `candid_sdk_checksum` in the podspec.

## Example app

`example/` is a prebuilt Expo app wired to the local module:

```sh
cd example
npm install
npx pod-install ios
npx expo run:ios
```

Like the iOS SDK sample, the example offers Local / Staging / Prod environments. The SDK itself always targets the production Candid API; the switcher works through a debug-only `URLProtocol` in the example's `AppDelegate.swift` that rewrites Candid API requests to the base URL persisted by the JS side (via React Native's `Settings` API). The Local base URL is editable — when running on a physical device, replace `localhost` with your Mac's LAN IP.

## Development notes

- `npm run build` type-checks and builds the module to `build/`.
- The example app's iOS project is already configured (microphone permission), so the config plugin is intentionally not listed in `example/app.json`.
- The overlay is attached to the app's root view controller via `Candid.attachUIKitOverlay(to:)` (see `CandidOverlayPresenter` in `ios/CandidReactNativeModule.swift`). The SDK hosts it in the app's main window — so ReplayKit recordings capture the Candid UI — and only intercepts touches landing on visible Candid UI; everything else passes through to the React Native content.
