import { requireOptionalNativeModule } from 'expo';

const CandidExampleEnvironment = requireOptionalNativeModule<{
  setEnvironmentVariable(name: string, value: string | null): void;
}>('CandidExampleEnvironment');

/** Sets (or, with `null`, unsets) a process environment variable. A no-op off iOS. */
export function setEnvironmentVariable(name: string, value: string | null): void {
  CandidExampleEnvironment?.setEnvironmentVariable(name, value);
}
