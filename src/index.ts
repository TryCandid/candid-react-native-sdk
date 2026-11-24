import {
  CandidConfiguration,
  CandidEventPayload,
  CandidUserProperties,
} from './CandidReactNative.types';
import CandidReactNativeModule from './CandidReactNativeModule';

/** Structural match for expo's `EventSubscription`. */
export type CandidEventSubscription = {
  remove: () => void;
};

/**
 * Configures the Candid SDK and attaches its overlay to the app.
 * Call once, early in the app lifecycle. iOS only; a no-op elsewhere.
 */
export function configure(configuration: CandidConfiguration = {}): void {
  CandidReactNativeModule.configure(configuration);
}

/**
 * Sets the user id attached to study resolution and uploads, or clears it with `null`.
 * Can be called before or after `configure`, e.g. once the user logs in. Without a user id,
 * requests are sent anonymously and once-per-user presentation is tracked locally per install.
 */
export function setUserId(userId: string | null): void {
  CandidReactNativeModule.setUserId(userId);
}

/**
 * Merges audience attributes into the current user's profile, used to check study audience
 * conditions. Supports strings, booleans, finite numbers and `null`; other values are ignored.
 * Profiles persist on the device, one per user id plus one for anonymous users, and are never
 * sent to Candid. Can be called before or after `configure`; does not present studies.
 */
export function setUserProperties(properties: CandidUserProperties): void {
  CandidReactNativeModule.setUserProperties(properties);
}

/**
 * Registers that `trigger` fired, resolves the study the backend selects for it (for the
 * configured user), and presents that study when one is selected. No UI is shown when the
 * user is sampled out or no study matches the trigger.
 *
 * By default each study is presented at most once per configured user; pass
 * `oncePerUser: false` to always present the resolved study (e.g. debug menus).
 */
export function registerTrigger(trigger: string, options?: { oncePerUser?: boolean }): void {
  CandidReactNativeModule.registerTrigger(trigger, options?.oncePerUser ?? true);
}

/** Forwards an analytics event to the Candid SDK for task matching. */
export function log(event: string, properties?: Record<string, unknown>): void {
  CandidReactNativeModule.log(event, properties ?? null);
}

/**
 * Closes the current study and clears every user's presentation history and user properties.
 * The configured user id is kept.
 */
export function reset(): void {
  CandidReactNativeModule.reset();
}

/**
 * Call when the user logs out. Closes the current study, clears the user id, and erases
 * anonymous user properties and presentation history. Identified users keep their profiles
 * and history for when they log back in.
 */
export function logout(): void {
  CandidReactNativeModule.logout();
}

/**
 * Subscribes to internal SDK actions (flow screen interactions) so the host app can
 * forward them to its own analytics. The SDK does not send analytics itself.
 */
export function addCandidEventListener(
  listener: (event: CandidEventPayload) => void
): CandidEventSubscription {
  return CandidReactNativeModule.addListener('onCandidEvent', listener);
}

export * from './CandidReactNative.types';
export { default as CandidRedactedView, CandidRedactedViewProps } from './CandidRedactedView';
export { default as CandidReactNativeModule } from './CandidReactNativeModule';
