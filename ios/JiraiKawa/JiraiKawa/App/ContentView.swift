import SwiftUI

struct ContentView: View {
    var body: some View {
        ZStack {
            Color(red: 0.969, green: 0.945, blue: 0.965)
                .ignoresSafeArea()
            EditorWebView(url: AppEnvironment.activeEditorURL)
        }
    }
}
