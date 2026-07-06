import SwiftUI

struct ContentView: View {
    var body: some View {
        EditorWebView(url: AppEnvironment.activeEditorURL)
    }
}
