import CandidSDK
import ExpoModulesCore
import UIKit

public class CandidReactNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CandidReactNative")

    Events("onCandidEvent")

    Function("configure") { [weak self] (configuration: ConfigurationRecord?) in
      Self.onMain {
        Candid.configure(configuration.makeConfiguration())

        Candid.eventHandler = { [weak self] name, properties in
          self?.sendEvent("onCandidEvent", [
            "name": name,
            "properties": properties ?? [:],
          ])
        }

        CandidOverlayPresenter.attachIfNeeded()
      }
    }

    Function("setUserId") { (userId: String?) in
      Self.onMain {
        Candid.setUserId(userId)
      }
    }

    Function("registerTrigger") { (trigger: String, oncePerUser: Bool?) in
      Self.onMain {
        Candid.register(trigger: trigger, oncePerUser: oncePerUser ?? true)
      }
    }

    Function("log") { (event: String, properties: [String: Any]?) in
      Self.onMain {
        Candid.log(event, properties: properties)
      }
    }

    Function("reset") {
      Self.onMain {
        Candid.reset()
      }
    }
  }

  /// The Candid public API is main-actor isolated; module functions are invoked on the JS
  /// thread, so hop to the main queue. None of the wrapped calls return a value, making
  /// fire-and-forget dispatch safe. `DispatchQueue.main.async` (unlike unstructured `Task`s)
  /// preserves call order.
  private static func onMain(_ work: @escaping @MainActor () -> Void) {
    if Thread.isMainThread {
      MainActor.assumeIsolated {
        work()
      }
    } else {
      DispatchQueue.main.async {
        MainActor.assumeIsolated {
          work()
        }
      }
    }
  }

}

// MARK: - Overlay hosting

/// Attaches the Candid overlay to the app's root view controller through the SDK's UIKit API.
/// `Candid.attachUIKitOverlay(to:)` (SDK 0.2.0+) hosts the overlay inside the host's own
/// window — so ReplayKit recordings capture the Candid UI — and only intercepts touches that
/// land on visible Candid UI; everything else passes through to the React Native content.
@MainActor
enum CandidOverlayPresenter {
  private static var attached = false

  static func attachIfNeeded() {
    guard !attached else { return }

    let windowScenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let window = windowScenes.flatMap(\.windows).first(where: \.isKeyWindow)
      ?? windowScenes.first?.windows.first
    guard let rootViewController = window?.rootViewController else { return }

    Candid.attachUIKitOverlay(to: rootViewController)
    attached = true
  }
}

// MARK: - Configuration records

struct ConfigurationRecord: Record {
  @Field var apiKey: String?
  @Field var recordingDuration: Double?
  @Field var stepTimings: StepTimingsRecord?
  @Field var appearance: AppearanceRecord?
}

struct StepTimingsRecord: Record {
  @Field var openQuestion: StepTimingRecord?
  @Field var action: StepTimingRecord?
}

struct StepTimingRecord: Record {
  @Field var canSkipAfter: Double?
  @Field var promptEvery: Double?
}

struct AppearanceRecord: Record {
  @Field var primaryColor: String?
  @Field var font: FontRecord?
  @Field var widgetPosition: String?
  @Field var widgetVerticalPadding: Double?
}

struct FontRecord: Record {
  @Field var systemDesign: String?
  @Field var customName: String?
}

extension Optional where Wrapped == ConfigurationRecord {
  func makeConfiguration() -> Candid.Configuration {
    guard let record = self else {
      return Candid.Configuration()
    }

    var configuration = Candid.Configuration(
      apiKey: record.apiKey,
      stepTimings: record.stepTimings.makeStepTimings(),
      appearance: record.appearance.makeAppearance()
    )
    if let recordingDuration = record.recordingDuration {
      configuration.recordingDuration = recordingDuration
    }
    return configuration
  }
}

extension Optional where Wrapped == StepTimingsRecord {
  /// Only the step types the JS side provided are inserted; the SDK falls back to its own
  /// default timing for missing keys.
  func makeStepTimings() -> [Candid.Configuration.StepType: Candid.Configuration.StepTiming] {
    guard let record = self else {
      return [:]
    }

    var stepTimings: [Candid.Configuration.StepType: Candid.Configuration.StepTiming] = [:]
    if let openQuestion = record.openQuestion {
      stepTimings[.openQuestion] = openQuestion.makeStepTiming(from: .openQuestionDefault)
    }
    if let action = record.action {
      stepTimings[.action] = action.makeStepTiming(from: .actionDefault)
    }
    return stepTimings
  }
}

extension StepTimingRecord {
  func makeStepTiming(from defaultTiming: Candid.Configuration.StepTiming) -> Candid.Configuration.StepTiming {
    var timing = defaultTiming
    if let canSkipAfter = canSkipAfter {
      timing.canSkipAfter = canSkipAfter
    }
    if let promptEvery = promptEvery {
      timing.promptEvery = promptEvery
    }
    return timing
  }
}

extension Optional where Wrapped == AppearanceRecord {
  func makeAppearance() -> Candid.Appearance {
    var appearance = Candid.Appearance()
    guard let record = self else {
      return appearance
    }
    if let primaryColor = record.primaryColor {
      appearance.primaryColor = primaryColor
    }
    if let font = record.font {
      if let customName = font.customName {
        appearance.font = .custom(name: customName)
      } else if let systemDesign = font.systemDesign {
        appearance.font = .system(Candid.SystemFontDesign(rawValue: systemDesign))
      }
    }
    if let widgetPosition = record.widgetPosition,
       let position = Candid.WidgetPosition(rawValue: widgetPosition) {
      appearance.widgetPosition = position
    }
    if let widgetVerticalPadding = record.widgetVerticalPadding {
      appearance.widgetVerticalPadding = widgetVerticalPadding
    }
    return appearance
  }
}
