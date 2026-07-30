import { registerWebModule, NativeModule } from 'expo';

import { CandidConfiguration, CandidReactNativeModuleEvents } from './CandidReactNative.types';

// The Candid SDK is not available on the web platform; all calls are no-ops.
class CandidReactNativeModule extends NativeModule<CandidReactNativeModuleEvents> {
  configure(_configuration: CandidConfiguration): void {}
  registerTrigger(_trigger: string, _oncePerUser: boolean): void {}
  log(_event: string, _properties: Record<string, unknown> | null): void {}
  reset(): void {}
}

export default registerWebModule(CandidReactNativeModule, 'CandidReactNativeModule');
