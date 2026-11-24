import { NativeModule, requireNativeModule } from 'expo';

import {
  CandidConfiguration,
  CandidReactNativeModuleEvents,
  CandidUserProperties,
} from './CandidReactNative.types';

declare class CandidReactNativeModule extends NativeModule<CandidReactNativeModuleEvents> {
  configure(configuration: CandidConfiguration): void;
  setUserId(userId: string | null): void;
  setUserProperties(properties: CandidUserProperties): void;
  registerTrigger(trigger: string, oncePerUser: boolean): void;
  log(event: string, properties: Record<string, unknown> | null): void;
  reset(): void;
  logout(): void;
}

export default requireNativeModule<CandidReactNativeModule>('CandidReactNative');
