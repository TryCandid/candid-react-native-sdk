const { createRunOncePlugin, withInfoPlist, withPodfileProperties } = require('expo/config-plugins');

const pkg = require('../package.json');

// The native Candid iOS SDK requires iOS 15.1. The host app's Expo SDK may impose a
// higher floor of its own (e.g. 16.4 on Expo SDK 57), which Expo's tooling already
// enforces; this plugin only guarantees the Candid minimum.
const MIN_IOS_DEPLOYMENT_TARGET = '15.1';

const DEFAULT_MICROPHONE_PERMISSION =
  'The microphone records your voice feedback during Candid user testing sessions.';

function isLowerThan(version, minimum) {
  const parse = (value) => String(value).split('.').map((part) => parseInt(part, 10) || 0);
  const a = parse(version);
  const b = parse(minimum);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) {
      return diff < 0;
    }
  }
  return false;
}

/**
 * @param {import('expo/config').ExpoConfig} config
 * @param {{ microphonePermissionText?: string } | undefined} props
 */
const withCandid = (config, props = {}) => {
  config = withInfoPlist(config, (config) => {
    config.modResults.NSMicrophoneUsageDescription =
      props.microphonePermissionText ??
      config.modResults.NSMicrophoneUsageDescription ??
      DEFAULT_MICROPHONE_PERMISSION;
    return config;
  });

  config = withPodfileProperties(config, (config) => {
    const current = config.modResults['ios.deploymentTarget'];
    if (!current || isLowerThan(current, MIN_IOS_DEPLOYMENT_TARGET)) {
      config.modResults['ios.deploymentTarget'] = MIN_IOS_DEPLOYMENT_TARGET;
    }
    return config;
  });

  return config;
};

module.exports = createRunOncePlugin(withCandid, pkg.name, pkg.version);
