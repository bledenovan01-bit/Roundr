# Experimental. Without ROUNDR_SPOTIFY_EXPERIMENT=1 the Spotify SDK is not
# linked at all and the module only reports that it is disabled.
vendored_sdk = File.join(__dir__, 'vendor', 'SpotifyiOS.xcframework')

Pod::Spec.new do |s|
  s.name           = 'RoundrSpotifyRemote'
  s.version        = '0.1.0'
  s.summary        = 'Experimental Spotify App Remote bridge for Roundr.'
  s.description    = 'Local Expo module, disabled unless the build enables the Spotify experiment.'
  s.license        = 'UNLICENSED'
  s.author         = 'Roundr'
  s.homepage       = 'https://github.com/bledenovan01-bit/Roundr'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/bledenovan01-bit/Roundr.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '*.swift'
  if ENV['ROUNDR_SPOTIFY_EXPERIMENT'] == '1' && File.exist?(vendored_sdk)
    s.vendored_frameworks = 'vendor/SpotifyiOS.xcframework'
  end
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
