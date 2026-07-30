/** Screen corner where the minimized microphone widget first appears. */
export type CandidWidgetPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

/** iOS system font designs supported by the SDK. */
export type CandidSystemFontDesign = 'default' | 'rounded' | 'serif' | 'monospaced';

/**
 * Font used by the Candid UI. Provide either a system font design or the PostScript
 * name of a custom font bundled in the host app. `customName` wins when both are set.
 */
export type CandidFont = {
  systemDesign?: CandidSystemFontDesign;
  customName?: string;
};

/** Timing of a single flow step. All values are in seconds. */
export type CandidStepTiming = {
  /** How long before the step can be skipped. */
  canSkipAfter?: number;
  /** How often the user is re-prompted. `0` disables re-prompting. */
  promptEvery?: number;
};

export type CandidStepTimings = {
  openQuestion?: CandidStepTiming;
  action?: CandidStepTiming;
};

export type CandidOptions = {
  /** Message shown on the completion screen. */
  rewardText?: string;
  /** Maximum recording duration in seconds. Defaults to 600. */
  recordingDuration?: number;
};

export type CandidAppearance = {
  /** Primary brand color as a hex string, e.g. `#35C884`. */
  primaryColor?: string;
  font?: CandidFont;
  /** Defaults to `bottomRight`. */
  widgetPosition?: CandidWidgetPosition;
  /**
   * Vertical padding in points between the widget and the safe-area edge of the chosen
   * corner. Only sets the initial position; the user can drag the widget afterwards.
   */
  widgetVerticalPadding?: number;
};

export type CandidConfiguration = {
  apiKey?: string;
  userId?: string;
  options?: CandidOptions;
  stepTimings?: CandidStepTimings;
  appearance?: CandidAppearance;
};

/** Internal SDK action forwarded through `addCandidEventListener`. */
export type CandidEventPayload = {
  name: string;
  properties?: Record<string, unknown>;
};

export type CandidReactNativeModuleEvents = {
  onCandidEvent: (event: CandidEventPayload) => void;
};
