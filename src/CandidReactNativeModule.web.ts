import { registerWebModule, NativeModule } from 'expo';

import {
  CandidConfiguration,
  CandidReactNativeModuleEvents,
  CandidUserProperties,
} from './CandidReactNative.types';

// The Candid SDK is not available on the web platform; all calls are no-ops.
class CandidReactNativeModule extends NativeModule<CandidReactNativeModuleEvents> {
  configure(_configuration: CandidConfiguration): void {}
  setUserId(_userId: string | null): void {}
  setUserProperties(_properties: CandidUserProperties): void {}
  registerTrigger(_trigger: string, _oncePerUser: boolean): void {}
  log(_event: string, _properties: Record<string, unknown> | null): void {}
  reset(): void {}
  logout(): void {}
}

export default registerWebModule(CandidReactNativeModule, 'CandidReactNativeModule');
