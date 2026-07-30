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

        if let rootViewController = Self.hostRootViewController() {
          Candid.attachOverlay(to: rootViewController)
        }
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

  @MainActor
  private static func hostRootViewController() -> UIViewController? {
    let windowScenes = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
    let window = windowScenes
      .flatMap(\.windows)
      .first(where: \.isKeyWindow) ?? windowScenes.first?.windows.first
    var rootViewController = window?.rootViewController
    while let presented = rootViewController?.presentedViewController {
      rootViewController = presented
    }
    return rootViewController
  }
}

// MARK: - Configuration records

struct ConfigurationRecord: Record {
  @Field var apiKey: String?
  @Field var userId: String?
  @Field var options: OptionsRecord?
  @Field var stepTimings: StepTimingsRecord?
  @Field var appearance: AppearanceRecord?
}

struct OptionsRecord: Record {
  @Field var rewardText: String?
  @Field var recordingDuration: Double?
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

    return Candid.Configuration(
      apiKey: record.apiKey,
      userId: record.userId,
      options: record.options.makeOptions(),
      stepTimings: record.stepTimings.makeStepTimings(),
      appearance: record.appearance.makeAppearance()
    )
  }
}

extension Optional where Wrapped == OptionsRecord {
  func makeOptions() -> Candid.Options {
    var options = Candid.Options()
    guard let record = self else {
      return options
    }
    if let rewardText = record.rewardText {
      options.rewardText = rewardText
    }
    if let recordingDuration = record.recordingDuration {
      options.recordingDuration = recordingDuration
    }
    return options
  }
}

extension Optional where Wrapped == StepTimingsRecord {
  func makeStepTimings() -> Candid.Configuration.StepTimings {
    var stepTimings = Candid.Configuration.StepTimings()
    guard let record = self else {
      return stepTimings
    }
    stepTimings.openQuestion = record.openQuestion.makeStepTiming(from: stepTimings.openQuestion)
    stepTimings.action = record.action.makeStepTiming(from: stepTimings.action)
    return stepTimings
  }
}

extension Optional where Wrapped == StepTimingRecord {
  func makeStepTiming(from defaultTiming: Candid.Configuration.StepTiming) -> Candid.Configuration.StepTiming {
    var timing = defaultTiming
    guard let record = self else {
      return timing
    }
    if let canSkipAfter = record.canSkipAfter {
      timing.canSkipAfter = canSkipAfter
    }
    if let promptEvery = record.promptEvery {
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
    if let widgetPosition = record.widgetPosition {
      appearance.widgetPosition = Candid.WidgetPosition(rawValue: widgetPosition)
    }
    if let widgetVerticalPadding = record.widgetVerticalPadding {
      appearance.widgetVerticalPadding = widgetVerticalPadding
    }
    return appearance
  }
}
