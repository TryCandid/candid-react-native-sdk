require 'digest'
require 'fileutils'
require 'net/http'
require 'uri'

# The Candid iOS SDK is distributed as a binary XCFramework attached to releases of
# https://github.com/TryCandid/candid-ios-sdk (the same artifact the SPM binary target uses).
# The exact release is pinned here together with its SHA-256 checksum, downloaded once at
# `pod install` time and cached next to this podspec.
candid_sdk_version = '0.1.1'
candid_sdk_checksum = '46a70f7a0d2ee09213e40731b8bc30ae0c724b3297f25dc98bb4ff423c81352d'
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

Pod::Spec.new do |s|
  s.name           = 'CandidReactNative'
  s.version        = '0.1.0'
  s.summary        = 'React Native wrapper for the Candid iOS SDK'
  s.description    = 'Expo module exposing the Candid in-app user testing and voice feedback SDK to React Native apps.'
  s.author         = 'Candid'
  s.homepage       = 'https://github.com/TryCandid/candid-react-native'
  s.license        = { type: 'MIT' }
  s.platforms      = {
    :ios => '17.0'
  }
  s.source         = { git: 'https://github.com/TryCandid/candid-react-native.git' }
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
