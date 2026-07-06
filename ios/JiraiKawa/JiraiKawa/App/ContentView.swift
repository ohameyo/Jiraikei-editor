import SwiftUI

enum AppChrome {
    static let background = Color(red: 0.969, green: 0.945, blue: 0.965)
}

struct ContentView: View {
    var body: some View {
        ZStack {
            AppChrome.background
                .ignoresSafeArea()
            EditorWebView(url: AppEnvironment.activeEditorURL)
        }
    }
}
