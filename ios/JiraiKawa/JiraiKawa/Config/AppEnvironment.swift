import Foundation

enum AppEnvironment {
    static let appLabEditorURL = URL(string: "https://jiraikawa-ios-lab.pages.dev")!
    static let productionEditorURL = URL(string: "https://jirai.pages.dev")!
    static let activeEditorURL = appLabEditorURL
}
