require 'digest'
require 'fileutils'
require 'net/http'
require 'uri'

# The Candid iOS SDK is distributed as a binary XCFramework attached to releases of
# https://github.com/TryCandid/candid-ios-sdk (the same artifact the SPM binary target uses).
# The exact release is pinned here together with its SHA-256 checksum, downloaded once at
# `pod install` time and cached next to this podspec.
candid_sdk_version = '0.2.0'
candid_sdk_checksum = '08ab1587a96600714816791d269b1203cbfc041ed34a24414517dc942f9a76ce'
candid_sdk_url = "https://github.com/TryCandid/candid-ios-sdk/releases/download/v#{candid_sdk_version}/CandidSDK.xcframework.zip"

frameworks_dir = File.join(__dir__, 'Frameworks')
xcframework_dir = File.join(frameworks_dir, 'CandidSDK.xcframework')
version_marker = File.join(frameworks_dir, ".candid-sdk-#{candid_sdk_version}")

download_with_redirects = lambda do |url, limit = 5|
  raise 'Too many redirects while downloading CandidSDK.xcframework' if limit.zero?

  uri = URI(url)
  response = Net::HTTP.get_response(uri)
  case response
  when Net::HTTPSuccess then response.body
  when Net::HTTPRedirection then download_with_redirects.call(response['location'], limit - 1)
  else
    raise "Failed to download CandidSDK.xcframework from #{url}: #{response.code} #{response.message}"
  end
end

unless File.exist?(version_marker) && File.directory?(xcframework_dir)
  Pod::UI.puts "Downloading CandidSDK.xcframework v#{candid_sdk_version}" if defined?(Pod::UI)

  data = download_with_redirects.call(candid_sdk_url)
  actual_checksum = Digest::SHA256.hexdigest(data)
  unless actual_checksum == candid_sdk_checksum
    raise "CandidSDK.xcframework checksum mismatch: expected #{candid_sdk_checksum}, got #{actual_checksum}"
  end

  FileUtils.rm_rf(frameworks_dir)
  FileUtils.mkdir_p(frameworks_dir)
  zip_path = File.join(frameworks_dir, 'CandidSDK.xcframework.zip')
  File.binwrite(zip_path, data)
  unless system('unzip', '-q', zip_path, '-d', frameworks_dir)
    raise 'Failed to extract CandidSDK.xcframework.zip'
  end
  FileUtils.rm_f(zip_path)
  raise 'CandidSDK.xcframework missing after extraction' unless File.directory?(xcframework_dir)

  FileUtils.touch(version_marker)
end

# The native Candid SDK supports iOS 15.1, which is the wrapper's own floor. CocoaPods
# refuses to resolve a dependency edge when the dependent pod declares a lower deployment
# target than the dependency, and ExpoModulesCore's floor varies per Expo SDK (15.1 on
# older SDKs, 16.4 on SDK 57). Mirror the host app's installed expo-modules-core floor
# when it is higher than ours, so the wrapper installs across Expo SDK versions.
candid_min_ios = '15.1'
begin
  search_root = defined?(Pod::Config) ? Pod::Config.instance.installation_root.to_s : __dir__
  current = search_root
  5.times do
    emc_podspec = File.join(current, 'node_modules', 'expo-modules-core', 'ExpoModulesCore.podspec')
    if File.exist?(emc_podspec)
      if (match = File.read(emc_podspec).match(/:ios\s*=>\s*'([\d.]+)'/))
        emc_min_ios = match[1]
        candid_min_ios = emc_min_ios if Gem::Version.new(emc_min_ios) > Gem::Version.new(candid_min_ios)
      end
      break
    end
    parent = File.dirname(current)
    break if parent == current
    current = parent
  end
rescue StandardError
  # Fall back to the SDK floor; CocoaPods will surface any real incompatibility.
end

Pod::Spec.new do |s|
  s.name           = 'CandidReactNative'
  s.version        = '0.1.0'
  s.summary        = 'React Native wrapper for the Candid iOS SDK'
  s.description    = 'Expo module exposing the Candid in-app user testing and voice feedback SDK to React Native apps.'
  s.author         = 'Candid'
  s.homepage       = 'https://github.com/TryCandid/candid-react-native-sdk'
  s.license        = { type: 'MIT' }
  s.platforms      = {
    :ios => candid_min_ios
  }
  s.source         = { git: 'https://github.com/TryCandid/candid-react-native-sdk.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  # Module sources live at the podspec root; do not glob recursively, the downloaded
  # Frameworks/CandidSDK.xcframework contents must not be treated as sources.
  s.source_files = "*.{h,m,mm,swift,hpp,cpp}"
  s.vendored_frameworks = 'Frameworks/CandidSDK.xcframework'
end
