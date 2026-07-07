import Foundation

enum AppEnvironment {
    static let appLabEditorURL = URL(string: "https://jiraikawa-ios-lab.pages.dev")!
    static let productionEditorURL = URL(string: "https://jirai.pages.dev")!
    static let bundledEditorURL = Bundle.main.url(forResource: "index", withExtension: "html")
    static let activeEditorURL = bundledEditorURL ?? appLabEditorURL
}
