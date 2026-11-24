Pod::Spec.new do |s|
  s.name           = 'CandidExampleEnvironment'
  s.version        = '1.0.0'
  s.summary        = 'Sets process environment variables for the Candid example app'
  s.author         = 'Candid'
  s.homepage       = 'https://github.com/TryCandid/candid-react-native-sdk'
  s.license        = { type: 'MIT' }
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '*.swift'
end
