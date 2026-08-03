# Changelog

## Unpublished

## 0.3.0 — 2026-08-03

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
