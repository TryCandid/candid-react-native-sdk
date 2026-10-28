#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.platform !== 'darwin') {
  console.error('example:ios requires macOS and Xcode.');
  process.exit(1);
}

const root = path.resolve(__dirname, '..', '..');
const example = path.join(root, 'example');
const ios = path.join(example, 'ios');
const env = {
  ...process.env,
  LANG: 'en_US.UTF-8',
  LC_ALL: 'en_US.UTF-8',
  NODE_BINARY: process.execPath,
};

function run(command, args, cwd, extraEnv = {}) {
  console.log(`\n> ${command} ${args.join(' ')} (${path.relative(root, cwd) || '.'})`);
  const result = spawnSync(command, args, { cwd, env: { ...env, ...extraEnv }, stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function refreshNodePath() {
  const file = path.join(ios, '.xcode.env.local');
  const contents = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const setting = `export NODE_BINARY='${process.execPath.replace(/'/g, "'\\''")}'`;
  const assignment = /^[\t ]*(?:export[\t ]+)?NODE_BINARY=.*$/gm;
  fs.writeFileSync(
    file,
    assignment.test(contents)
      ? contents.replace(assignment, () => setting)
      : `${contents}${contents && !contents.endsWith('\n') ? '\n' : ''}${setting}\n`
  );
}

run('npm', ['install'], root);
run('npm', ['run', 'build'], root, { EXPO_NONINTERACTIVE: '1' });
run('npm', ['install'], example);

if (!fs.existsSync(path.join(ios, 'Podfile'))) {
  run('npx', ['expo', 'prebuild', '--platform', 'ios', '--no-install'], example);
}

refreshNodePath();
run('npx', ['--yes', 'pod-install', 'ios'], example);
// CocoaPods can rewrite .xcode.env.local while installing React Native.
refreshNodePath();
const args = process.argv.slice(2);
if (!args.includes('--device')) args.unshift('--device');
run('npx', ['expo', 'run:ios', ...args], example);
