// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The package root installs its own copies of react, react-native, expo and every devDependency
// (jest, pretty-format, ...). None of them are needed to bundle this app -- the package declares
// no runtime dependencies -- and letting them resolve produces duplicate modules in the bundle.
// Block the parent node_modules wholesale so everything resolves from ./node_modules instead.
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList ?? []),
  new RegExp(`^${escapeRegExp(path.resolve(__dirname, '..', 'node_modules') + path.sep)}`),
];

// The linked package at `..` lives outside this app's tree, so its imports (expo,
// react-native) have to fall back to this app's node_modules.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, './node_modules')];

config.resolver.extraNodeModules = {
  '@trycandid/react-native': '..',
};

config.watchFolders = [path.resolve(__dirname, '..')];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
