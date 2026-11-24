import ExpoModulesCore

public class CandidExampleEnvironmentModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CandidExampleEnvironment")

    Function("setEnvironmentVariable") { (name: String, value: String?) in
      if let value {
        setenv(name, value, 1)
      } else {
        unsetenv(name)
      }
    }
  }
}
