import { CandidConfiguration, CandidEventPayload } from './CandidReactNative.types';
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

/** Clears the persisted per-user presentation history. */
export function reset(): void {
  CandidReactNativeModule.reset();
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
export { default as CandidReactNativeModule } from './CandidReactNativeModule';
