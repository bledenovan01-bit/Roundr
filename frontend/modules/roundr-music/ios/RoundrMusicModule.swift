import AVFoundation
import ExpoModulesCore
import MediaPlayer
import UIKit

// Commands the Apple Music app through the public system music player.
// It never touches the audio session, so Roundr's sound effects are unaffected.
public class RoundrMusicModule: Module {
  private var observers: [NSObjectProtocol] = []
  private var artwork: (key: String, uri: String?)?

  public func definition() -> ModuleDefinition {
    Name("RoundrMusic")

    Events("onAppleMusicChange")

    OnStartObserving("onAppleMusicChange") {
      DispatchQueue.main.async { self.startObserving() }
    }

    OnStopObserving("onAppleMusicChange") {
      DispatchQueue.main.async { self.stopObserving() }
    }

    // iOS reports that another app is playing, never which one.
    Function("isOtherAudioPlaying") { () -> Bool in
      AVAudioSession.sharedInstance().isOtherAudioPlaying
    }

    AsyncFunction("requestAuthorization") { (promise: Promise) in
      MPMediaLibrary.requestAuthorization { status in
        promise.resolve(Self.authorizationName(status))
      }
    }

    AsyncFunction("getSnapshot") { () -> [String: Any] in
      self.snapshot()
    }.runOnQueue(.main)

    AsyncFunction("command") { (name: String) in
      try self.perform(name)
    }.runOnQueue(.main)
  }

  private var authorized: Bool {
    MPMediaLibrary.authorizationStatus() == .authorized
  }

  private func startObserving() {
    guard observers.isEmpty, authorized else { return }
    let player = MPMusicPlayerController.systemMusicPlayer
    player.beginGeneratingPlaybackNotifications()
    let center = NotificationCenter.default
    for name in [
      Notification.Name.MPMusicPlayerControllerPlaybackStateDidChange,
      Notification.Name.MPMusicPlayerControllerNowPlayingItemDidChange,
    ] {
      observers.append(
        center.addObserver(forName: name, object: player, queue: .main) { [weak self] _ in
          self?.sendEvent("onAppleMusicChange", [:])
        })
    }
  }

  private func stopObserving() {
    guard !observers.isEmpty else { return }
    observers.forEach(NotificationCenter.default.removeObserver)
    observers = []
    MPMusicPlayerController.systemMusicPlayer.endGeneratingPlaybackNotifications()
  }

  private func snapshot() -> [String: Any] {
    var result: [String: Any] = [
      "authorization": Self.authorizationName(MPMediaLibrary.authorizationStatus()),
      "connection": "disconnected",
      "playback": "unknown",
      "canToggle": false,
      "canPrevious": false,
      "canNext": false,
    ]
    guard authorized else { return result }
    // Authorization can be granted after the card started listening.
    startObserving()
    let player = MPMusicPlayerController.systemMusicPlayer
    result["connection"] = "connected"
    result["playback"] = Self.playbackName(player.playbackState)
    guard let item = player.nowPlayingItem else { return result }
    var track: [String: Any] = [:]
    if let title = item.title { track["title"] = title }
    if let artist = item.artist { track["artist"] = artist }
    if let uri = artworkUri(for: item) { track["artworkUri"] = uri }
    result["track"] = track
    result["canToggle"] = true
    result["canPrevious"] = true
    result["canNext"] = true
    return result
  }

  private func perform(_ name: String) throws {
    guard authorized else {
      throw Exception(name: "ERR_MUSIC_ACCESS", description: "Music access is not granted.")
    }
    let player = MPMusicPlayerController.systemMusicPlayer
    guard player.nowPlayingItem != nil else {
      throw Exception(name: "ERR_MUSIC_NO_TRACK", description: "Nothing is loaded in the Music app.")
    }
    switch name {
    case "play": player.play()
    case "pause": player.pause()
    case "next": player.skipToNextItem()
    case "previous": player.skipToPreviousItem()
    default:
      throw Exception(name: "ERR_MUSIC_COMMAND", description: "Unknown command.")
    }
  }

  private func artworkUri(for item: MPMediaItem) -> String? {
    let key = "\(item.persistentID)|\(item.title ?? "")|\(item.artist ?? "")"
    if let artwork, artwork.key == key { return artwork.uri }
    var uri: String?
    let size = CGSize(width: 168, height: 168)
    if let data = item.artwork?.image(at: size)?.jpegData(compressionQuality: 0.8) {
      uri = "data:image/jpeg;base64,\(data.base64EncodedString())"
    }
    artwork = (key, uri)
    return uri
  }

  private static func authorizationName(_ status: MPMediaLibraryAuthorizationStatus) -> String {
    switch status {
    case .authorized: return "granted"
    case .denied: return "denied"
    case .restricted: return "restricted"
    case .notDetermined: return "notDetermined"
    @unknown default: return "notDetermined"
    }
  }

  private static func playbackName(_ state: MPMusicPlaybackState) -> String {
    switch state {
    case .playing, .seekingForward, .seekingBackward: return "playing"
    case .paused, .interrupted: return "paused"
    case .stopped: return "stopped"
    @unknown default: return "unknown"
    }
  }
}
