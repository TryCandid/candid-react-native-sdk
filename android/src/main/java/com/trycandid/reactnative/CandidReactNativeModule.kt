package com.trycandid.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// The Candid SDK is iOS-only for now. This stub keeps the JS API safe to call from
// shared code on Android: every function resolves as a no-op.
class CandidReactNativeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CandidReactNative")

    Events("onCandidEvent")

    Function("configure") { _: Map<String, Any?>? ->
    }

    Function("setUserId") { _: String? ->
    }

    Function("registerTrigger") { _: String, _: Boolean? ->
    }

    Function("log") { _: String, _: Map<String, Any?>? ->
    }

    Function("reset") {
    }
  }
}
