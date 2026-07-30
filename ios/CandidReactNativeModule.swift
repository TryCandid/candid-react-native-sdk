import CandidSDK
import ExpoModulesCore
import SwiftUI
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

/// Hosts the Candid overlay inside the app's main window instead of the pinned SDK release's
/// `Candid.attachOverlay(to:)` (renamed `attachUIKitOverlay(to:)` upstream).
///
/// Two constraints shape this setup:
/// - The SDK's ReplayKit capture records the app's main window, so the overlay must live in
///   that window (a separate overlay `UIWindow` is invisible in recordings).
/// - A plain `UIHostingController` view attached over the React Native root view swallows
///   every touch (`_UIHostingView` participates in UIKit hit testing even when its SwiftUI
///   content disables hit testing), which froze taps and scrolling in the host app.
///
/// The overlay is therefore wrapped in a passthrough container in the app window that only
/// keeps touches landing on actual Candid UI and lets everything else fall through to the
/// React Native content below.
@MainActor
enum CandidOverlayPresenter {
  private static weak var container: PassthroughOverlayContainerView?

  static func attachIfNeeded() {
    guard container == nil else { return }

    let windowScenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let window = windowScenes.flatMap(\.windows).first(where: \.isKeyWindow)
      ?? windowScenes.first?.windows.first
    guard let rootViewController = window?.rootViewController else { return }

    let hostingController = UIHostingController(rootView: CandidOverlayRootView())
    hostingController.view.backgroundColor = .clear
    hostingController.view.translatesAutoresizingMaskIntoConstraints = false

    let container = PassthroughOverlayContainerView(hostingView: hostingController.view)
    container.translatesAutoresizingMaskIntoConstraints = false

    rootViewController.addChild(hostingController)
    container.addSubview(hostingController.view)
    rootViewController.view.addSubview(container)
    hostingController.didMove(toParent: rootViewController)

    NSLayoutConstraint.activate([
      container.topAnchor.constraint(equalTo: rootViewController.view.topAnchor),
      container.bottomAnchor.constraint(equalTo: rootViewController.view.bottomAnchor),
      container.leadingAnchor.constraint(equalTo: rootViewController.view.leadingAnchor),
      container.trailingAnchor.constraint(equalTo: rootViewController.view.trailingAnchor),
      hostingController.view.topAnchor.constraint(equalTo: container.topAnchor),
      hostingController.view.bottomAnchor.constraint(equalTo: container.bottomAnchor),
      hostingController.view.leadingAnchor.constraint(equalTo: container.leadingAnchor),
      hostingController.view.trailingAnchor.constraint(equalTo: container.trailingAnchor),
    ])

    self.container = container
  }
}

private struct CandidOverlayRootView: View {
  var body: some View {
    Color.clear
      .ignoresSafeArea()
      .candidOverlay()
  }
}

/// A view that only handles touches landing on visible Candid UI and lets every other touch
/// fall through to the sibling React Native view below. `_UIHostingView` returns itself from
/// `hitTest` for its entire bounds, so view identity alone cannot distinguish the transparent
/// background from actual overlay content; visible content is detected from the hosting
/// view's layer tree instead.
private final class PassthroughOverlayContainerView: UIView {
  private let hostingView: UIView

  init(hostingView: UIView) {
    self.hostingView = hostingView
    super.init(frame: .zero)
    backgroundColor = .clear
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) is not supported")
  }

  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    guard let hitView = super.hitTest(point, with: event) else { return nil }
    if hitView !== self, hitView !== hostingView {
      // A concrete UIKit subview of the SwiftUI content (text fields, sheets, ...).
      return hitView
    }
    return Self.hasVisibleContent(in: hostingView.layer, at: point) ? hitView : nil
  }

  /// Whether any visible rendered layer under `layer` contains `point` (expressed in the
  /// coordinate space of `layer`'s superlayer, matching `CALayer.hitTest`). The idle overlay
  /// renders nothing, so its layer tree has no visible content and all touches fall through;
  /// the bubble captures only its own region, and a presented modal captures everything.
  private static func hasVisibleContent(in layer: CALayer, at point: CGPoint) -> Bool {
    if layer.isHidden || layer.opacity < 0.01 {
      return false
    }
    let localPoint = layer.convert(point, from: layer.superlayer)
    guard layer.masksToBounds == false || layer.bounds.contains(localPoint) else {
      return false
    }

    if layer.bounds.contains(localPoint), rendersContent(layer) {
      return true
    }
    return (layer.sublayers ?? []).contains { hasVisibleContent(in: $0, at: localPoint) }
  }

  private static func rendersContent(_ layer: CALayer) -> Bool {
    if layer.contents != nil {
      return true
    }
    if let backgroundColor = layer.backgroundColor, backgroundColor.alpha > 0.01 {
      return true
    }
    if let borderColor = layer.borderColor, borderColor.alpha > 0.01, layer.borderWidth > 0 {
      return true
    }
    // Text, shapes, and gradients draw through dedicated layer classes without `contents`.
    return layer is CATextLayer || layer is CAShapeLayer || layer is CAGradientLayer
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
