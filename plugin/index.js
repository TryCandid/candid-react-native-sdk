const { createRunOncePlugin, withInfoPlist } = require('expo/config-plugins');

const pkg = require('../package.json');

const DEFAULT_MICROPHONE_PERMISSION =
  'The microphone records your voice feedback during Candid user testing sessions.';

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

  return config;
};

module.exports = createRunOncePlugin(withCandid, pkg.name, pkg.version);
