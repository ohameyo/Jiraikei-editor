import SwiftUI

enum AppChrome {
    static let background = Color(red: 0.969, green: 0.945, blue: 0.965)
}

struct ContentView: View {
    @State private var isLoading = true
    @State private var loadError: String?
    @State private var reloadToken = UUID()

    var body: some View {
        ZStack {
            AppChrome.background
                .ignoresSafeArea()
            EditorWebView(
                url: AppEnvironment.activeEditorURL,
                reloadToken: reloadToken,
                isLoading: $isLoading,
                loadError: $loadError
            )

            if isLoading {
                statusPanel(title: "蕾蕾卡哇加载中", detail: "正在连接 App 专用 Lab...")
            }

            if let loadError {
                statusPanel(title: "页面加载失败", detail: loadError, showsRetry: true)
            }
        }
    }

    private func statusPanel(title: String, detail: String, showsRetry: Bool = false) -> some View {
        VStack(spacing: 12) {
            Text(title)
                .font(.headline)
            Text(detail)
                .font(.footnote)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
            if showsRetry {
                Button("重试") {
                    isLoading = true
                    loadError = nil
                    reloadToken = UUID()
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(22)
        .frame(maxWidth: 300)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .shadow(color: .black.opacity(0.08), radius: 24, x: 0, y: 10)
        .padding(24)
    }
}
