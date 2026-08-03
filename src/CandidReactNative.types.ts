/** Screen corner where the minimized microphone widget first appears. */
export type CandidWidgetPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

/** iOS system font designs supported by the SDK. */
export type CandidSystemFontDesign = 'default' | 'rounded' | 'serif' | 'monospaced';

/**
 * Font used by the Candid UI. Set exactly one of the two: a system font design, or the
 * PostScript name of a custom font bundled in the host app.
 */
export type CandidFont =
  | { systemDesign: CandidSystemFontDesign; customName?: never }
  | { customName: string; systemDesign?: never };

/** Timing of a single flow step. All values are in seconds. */
export type CandidStepTiming = {
  /** How long before the step can be skipped. */
  canSkipAfter?: number;
  /** How often the user is re-prompted. `0` disables re-prompting. */
  promptEvery?: number;
};

/** Flow step types that can be timed individually. */
export type CandidStepType = 'openQuestion' | 'action';

/**
 * Timing overrides per step type. Step types without an entry use their default timing:
 * `canSkipAfter: 1`, `promptEvery: 15` for open questions, `canSkipAfter: 30`,
 * `promptEvery: 0` for actions.
 */
export type CandidStepTimings = Partial<Record<CandidStepType, CandidStepTiming>>;

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
  /** Maximum recording duration in seconds. Defaults to 600. */
  recordingDuration?: number;
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
