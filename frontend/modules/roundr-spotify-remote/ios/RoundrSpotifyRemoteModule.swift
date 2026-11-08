import ExpoModulesCore
import UIKit

#if canImport(SpotifyiOS)
import SpotifyiOS
#endif

// Experimental prototype, not cleared for public distribution. The Spotify SDK
// is only linked in builds made with ROUNDR_SPOTIFY_EXPERIMENT=1; otherwise
// every call reports that the module is disabled.
public class RoundrSpotifyRemoteModule: Module {
  #if canImport(SpotifyiOS)
  private lazy var bridge = SpotifyBridge { [weak self] in
    self?.sendEvent("onSpotifyChange", [:])
  }
  #endif

  public func definition() -> ModuleDefinition {
    Name("RoundrSpotifyRemote")

    Events("onSpotifyChange")

    Function("isEnabled") { () -> Bool in
      #if canImport(SpotifyiOS)
      return SpotifyBridge.configuration != nil
      #else
      return false
      #endif
    }

    AsyncFunction("getSnapshot") { () -> [String: Any] in
      #if canImport(SpotifyiOS)
      return self.bridge.snapshot()
      #else
      return [:]
      #endif
    }.runOnQueue(.main)

    AsyncFunction("command") { (name: String, promise: Promise) in
      #if canImport(SpotifyiOS)
      self.bridge.send(name) { message in
        if let message {
          promise.reject("ERR_SPOTIFY_COMMAND", message)
        } else {
          promise.resolve()
        }
      }
      #else
      promise.reject("ERR_SPOTIFY_DISABLED", "The Spotify experiment is not enabled.")
      #endif
    }.runOnQueue(.main)

    AsyncFunction("authorize") { (promise: Promise) in
      #if canImport(SpotifyiOS)
      self.bridge.authorize { opened in
        if opened {
          promise.resolve()
        } else {
          promise.reject("ERR_SPOTIFY_NOT_OPENED", "The Spotify app could not be opened.")
        }
      }
      #else
      promise.reject("ERR_SPOTIFY_DISABLED", "The Spotify experiment is not enabled.")
      #endif
    }.runOnQueue(.main)

    AsyncFunction("handleAuthUrl") { (url: String) -> Bool in
      #if canImport(SpotifyiOS)
      return self.bridge.handleAuthUrl(url)
      #else
      return false
      #endif
    }.runOnQueue(.main)

    AsyncFunction("reconnect") {
      #if canImport(SpotifyiOS)
      self.bridge.reconnect()
      #endif
    }.runOnQueue(.main)

    AsyncFunction("disconnect") {
      #if canImport(SpotifyiOS)
      self.bridge.disconnect()
      #endif
    }.runOnQueue(.main)
  }
}

#if canImport(SpotifyiOS)
private final class SpotifyBridge: NSObject, SPTAppRemoteDelegate, SPTAppRemotePlayerStateDelegate {
  static var configuration: SPTConfiguration? {
    guard
      let clientID = Bundle.main.object(forInfoDictionaryKey: "RoundrSpotifyClientID") as? String,
      !clientID.isEmpty,
      let redirect = Bundle.main.object(forInfoDictionaryKey: "RoundrSpotifyRedirectURL") as? String,
      let url = URL(string: redirect)
    else { return nil }
    return SPTConfiguration(clientID: clientID, redirectURL: url)
  }

  private let onChange: () -> Void
  private lazy var remote: SPTAppRemote? = {
    guard let configuration = Self.configuration else { return nil }
    let remote = SPTAppRemote(configuration: configuration, logLevel: .none)
    remote.delegate = self
    return remote
  }()
  // Kept in memory only: a new launch asks Spotify for a new authorization.
  private var token: String?
  private var connection = "disconnected"
  private var intentionalDisconnect = false
  private var playerState: SPTAppRemotePlayerState?
  private var artwork: (key: String, uri: String)?

  init(onChange: @escaping () -> Void) {
    self.onChange = onChange
  }

  func snapshot() -> [String: Any] {
    var result: [String: Any] = [
      "authorization": token == nil ? "notDetermined" : "granted",
      "connection": connection,
      "playback": "unknown",
      "canToggle": false,
      "canPrevious": false,
      "canNext": false,
    ]
    guard connection == "connected", let state = playerState else { return result }
    result["playback"] = state.isPaused ? "paused" : "playing"
    var track: [String: Any] = ["title": state.track.name, "artist": state.track.artist.name]
    if let artwork, artwork.key == state.track.imageIdentifier { track["artworkUri"] = artwork.uri }
    result["track"] = track
    result["canToggle"] = true
    // Spotify declares what the account and the content allow.
    result["canPrevious"] = state.playbackRestrictions.canSkipPrevious
    result["canNext"] = state.playbackRestrictions.canSkipNext
    return result
  }

  func send(_ name: String, done: @escaping (String?) -> Void) {
    guard let player = remote?.playerAPI, remote?.isConnected == true else {
      done("Spotify is not connected.")
      return
    }
    let callback: SPTAppRemoteCallback = { _, error in done(error?.localizedDescription) }
    switch name {
    case "play": player.resume(callback)
    case "pause": player.pause(callback)
    case "next": player.skip(toNext: callback)
    case "previous": player.skip(toPrevious: callback)
    default: done("Unknown command.")
    }
  }

  /// Switches to the Spotify app. Only called after the user taps the button.
  func authorize(opened: @escaping (Bool) -> Void) {
    guard let remote else {
      opened(false)
      return
    }
    connection = "connecting"
    onChange()
    remote.authorizeAndPlayURI("") { [weak self] success in
      if !success {
        self?.connection = "disconnected"
        self?.onChange()
      }
      opened(success)
    }
  }

  func handleAuthUrl(_ value: String) -> Bool {
    guard let remote, let url = URL(string: value),
      let parameters = remote.authorizationParameters(from: url)
    else { return false }
    guard let accessToken = parameters[SPTAppRemoteAccessTokenKey] else {
      token = nil
      connection = "disconnected"
      onChange()
      return false
    }
    token = accessToken
    remote.connectionParameters.accessToken = accessToken
    reconnect()
    return true
  }

  /// Attaches with the existing authorization, without opening Spotify.
  func reconnect() {
    guard let remote, token != nil, !remote.isConnected else { return }
    intentionalDisconnect = false
    connection = "connecting"
    onChange()
    remote.connect()
  }

  func disconnect() {
    guard let remote, remote.isConnected else {
      if connection == "connecting" { connection = "disconnected" }
      return
    }
    intentionalDisconnect = true
    remote.disconnect()
  }

  func appRemoteDidEstablishConnection(_ appRemote: SPTAppRemote) {
    connection = "connected"
    appRemote.playerAPI?.delegate = self
    appRemote.playerAPI?.subscribe(toPlayerState: { [weak self] _, error in
      if error != nil { self?.onChange() }
    })
    appRemote.playerAPI?.getPlayerState { [weak self] result, _ in
      if let state = result as? SPTAppRemotePlayerState { self?.update(state) }
    }
    onChange()
  }

  func appRemote(_ appRemote: SPTAppRemote, didFailConnectionAttemptWithError error: Error?) {
    playerState = nil
    connection = token == nil ? "disconnected" : "lost"
    onChange()
  }

  func appRemote(_ appRemote: SPTAppRemote, didDisconnectWithError error: Error?) {
    playerState = nil
    connection = intentionalDisconnect ? "disconnected" : "lost"
    intentionalDisconnect = false
    onChange()
  }

  func playerStateDidChange(_ playerState: SPTAppRemotePlayerState) {
    update(playerState)
  }

  private func update(_ state: SPTAppRemotePlayerState) {
    playerState = state
    onChange()
    let key = state.track.imageIdentifier
    guard artwork?.key != key else { return }
    remote?.imageAPI?.fetchImage(
      forItem: state.track, with: CGSize(width: 168, height: 168)
    ) { [weak self] result, _ in
      guard let data = (result as? UIImage)?.jpegData(compressionQuality: 0.8) else { return }
      self?.artwork = (key, "data:image/jpeg;base64,\(data.base64EncodedString())")
      self?.onChange()
    }
  }
}
#endif
