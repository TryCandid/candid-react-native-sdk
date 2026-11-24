import { View, ViewProps } from 'react-native';

import { CandidRedactionKind } from './CandidReactNative.types';

export type CandidRedactedViewProps = ViewProps & {
  /** Defaults to `true`. Unredacting does not override a redacted ancestor. */
  redacted?: boolean;
  kind?: CandidRedactionKind;
};

// Recordings only exist on iOS (see `CandidRedactedView.ios.tsx`); elsewhere this is a plain view.
export default function CandidRedactedView({ redacted, kind, ...props }: CandidRedactedViewProps) {
  return <View {...props} />;
}
