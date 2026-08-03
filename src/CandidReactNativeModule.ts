import { NativeModule, requireNativeModule } from 'expo';

import { CandidConfiguration, CandidReactNativeModuleEvents } from './CandidReactNative.types';

declare class CandidReactNativeModule extends NativeModule<CandidReactNativeModuleEvents> {
  configure(configuration: CandidConfiguration): void;
  setUserId(userId: string | null): void;
  registerTrigger(trigger: string, oncePerUser: boolean): void;
  log(event: string, properties: Record<string, unknown> | null): void;
  reset(): void;
}

export default requireNativeModule<CandidReactNativeModule>('CandidReactNative');
