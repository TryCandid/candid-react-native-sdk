#!/usr/bin/env node
// Syncs the pinned Candid iOS SDK release in ios/candid-sdk.json, which the podspec reads to
// download and verify CandidSDK.xcframework.zip at `pod install` time.
//
//   node internal/module_scripts/sync-ios-sdk.js              # pin the latest release
//   node internal/module_scripts/sync-ios-sdk.js 0.4.0        # pin a specific release
//   node internal/module_scripts/sync-ios-sdk.js --check      # verify the committed pin, no writes
//
// --checksum <hex> asserts the resolved release matches a checksum computed elsewhere (the iOS
// release workflow passes the value it just built), turning a mismatch into a failure rather
// than a silent overwrite.
//
// The checksum comes from the CandidSDK.xcframework.zip.checksum release asset when present and
// otherwise from hashing the zip, because releases up to v0.3.0 predate that asset.
//
// ios/candid-sdk.json is the only file this writes. The changelog and the npm version are edited
// by hand when a release is actually cut.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const REPO = 'TryCandid/candid-ios-sdk';
const ZIP_ASSET = 'CandidSDK.xcframework.zip';
const CHECKSUM_ASSET = `${ZIP_ASSET}.checksum`;

const ROOT = path.join(__dirname, '..', '..');
const PIN_PATH = path.join(ROOT, 'ios', 'candid-sdk.json');

function die(message) {
  console.error(`sync-ios-sdk: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = { check: false, version: null, expectedChecksum: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') {
      options.check = true;
    } else if (arg === '--checksum') {
      options.expectedChecksum = argv[++i];
    } else if (arg.startsWith('--checksum=')) {
      options.expectedChecksum = arg.slice('--checksum='.length);
    } else if (arg.startsWith('-')) {
      die(`unknown option ${arg}`);
    } else if (options.version === null) {
      options.version = arg.replace(/^v/, '');
    } else {
      die(`unexpected argument ${arg}`);
    }
  }
  return options;
}

function readPin() {
  if (!fs.existsSync(PIN_PATH)) die(`${path.relative(ROOT, PIN_PATH)} is missing`);
  const pin = JSON.parse(fs.readFileSync(PIN_PATH, 'utf8'));
  if (!pin.version || !pin.checksum) die('the pin must have both a version and a checksum');
  return pin;
}

// The GitHub API allows 60 unauthenticated requests per hour per IP, which shared CI runners
// can exhaust. Use a token when one is available; the repo is public, so none is required.
function githubHeaders() {
  const headers = { Accept: 'application/vnd.github+json' };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchRelease(version) {
  const url = version
    ? `https://api.github.com/repos/${REPO}/releases/tags/v${version}`
    : `https://api.github.com/repos/${REPO}/releases/latest`;
  const response = await fetch(url, { headers: githubHeaders() });
  if (response.status === 404) {
    die(version ? `${REPO} has no release tagged v${version}` : `${REPO} has no published release`);
  }
  if (!response.ok) {
    die(`GitHub API ${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

function assetUrl(release, name) {
  const asset = (release.assets || []).find((candidate) => candidate.name === name);
  return asset ? asset.browser_download_url : null;
}

async function download(url, what) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    die(`failed to download ${what}: ${response.status} ${response.statusText}`);
  }
  return response;
}

async function resolveChecksum(release) {
  const checksumUrl = assetUrl(release, CHECKSUM_ASSET);
  if (checksumUrl) {
    const response = await download(checksumUrl, CHECKSUM_ASSET);
    const checksum = (await response.text()).trim();
    if (!/^[0-9a-f]{64}$/.test(checksum)) {
      die(`${CHECKSUM_ASSET} in ${release.tag_name} is not a SHA-256 digest: ${checksum}`);
    }
    return { checksum, source: CHECKSUM_ASSET };
  }

  const zipUrl = assetUrl(release, ZIP_ASSET);
  if (!zipUrl) die(`${release.tag_name} has no ${ZIP_ASSET} asset`);
  console.log(`  ${release.tag_name} predates ${CHECKSUM_ASSET}, hashing ${ZIP_ASSET} instead`);
  const response = await download(zipUrl, ZIP_ASSET);
  const hash = crypto.createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
  return { checksum: hash, source: `sha256(${ZIP_ASSET})` };
}

function writePin(version, checksum) {
  fs.writeFileSync(PIN_PATH, `${JSON.stringify({ version, checksum }, null, 2)}\n`);
}

function emitGitHubOutput(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, lines.join(''));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.check) {
    if (options.version) die('--check verifies the committed pin and takes no version argument');
    const pin = readPin();
    console.log(`Checking the pinned Candid iOS SDK ${pin.version}`);
    const release = await fetchRelease(pin.version);
    const { checksum, source } = await resolveChecksum(release);
    if (checksum !== pin.checksum) {
      die(
        `checksum mismatch for v${pin.version}\n` +
          `  pinned in ios/candid-sdk.json: ${pin.checksum}\n` +
          `  from ${source}: ${checksum}\n` +
          'The release asset changed, or the pin was edited by hand.'
      );
    }
    console.log(`  ok, ${checksum} matches ${source}`);
    return;
  }

  const pin = fs.existsSync(PIN_PATH) ? readPin() : null;
  const release = await fetchRelease(options.version);
  const version = release.tag_name.replace(/^v/, '');
  console.log(`Resolving Candid iOS SDK ${release.tag_name}`);

  const { checksum, source } = await resolveChecksum(release);
  if (options.expectedChecksum && options.expectedChecksum !== checksum) {
    die(
      `the --checksum argument does not match ${release.tag_name}\n` +
        `  passed in:      ${options.expectedChecksum}\n` +
        `  from ${source}: ${checksum}`
    );
  }

  const changed = !pin || pin.version !== version || pin.checksum !== checksum;
  if (changed) {
    writePin(version, checksum);
    console.log(`  wrote ios/candid-sdk.json (${version}, ${checksum})`);
  } else {
    console.log(`  already pinned to ${version}, nothing to do`);
  }

  emitGitHubOutput({ version, checksum, changed: String(changed) });
}

main().catch((error) => die(error.stack || String(error)));
