import SwiftUI

enum AppChrome {
    static let topBarBackground = Color(red: 1.0, green: 0.973, blue: 0.988)
    static let pageBackground = Color(red: 0.969, green: 0.945, blue: 0.965)
}

struct ContentView: View {
    @State private var isLoading = true
    @State private var loadError: String?
    @State private var reloadToken = UUID()
    @State private var loadingBowFloats = false

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                VStack(spacing: 0) {
                    AppChrome.topBarBackground
                        .frame(height: proxy.safeAreaInsets.top)
                    Spacer(minLength: 0)
                    AppChrome.pageBackground
                        .frame(height: proxy.safeAreaInsets.bottom)
                }
                .ignoresSafeArea()

                EditorWebView(
                    url: AppEnvironment.activeEditorURL,
                    reloadToken: reloadToken,
                    isLoading: $isLoading,
                    loadError: $loadError
                )

                if isLoading {
                    loadingPanel
                }

                if let loadError {
                    statusPanel(title: "页面加载失败", detail: loadError, showsRetry: true)
                }
            }
        }
    }

    private var loadingPanel: some View {
        VStack(spacing: 8) {
            Image("LoadingBow")
                .resizable()
                .scaledToFit()
                .frame(width: 62, height: 54)
                .offset(y: loadingBowFloats ? -5 : 5)
                .shadow(color: .black.opacity(0.10), radius: 10, x: 0, y: 5)
                .onAppear {
                    loadingBowFloats = false
                    withAnimation(.easeInOut(duration: 1.3).repeatForever(autoreverses: true)) {
                        loadingBowFloats = true
                    }
                }

            Text("少女量产中...")
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(Color(red: 0.37, green: 0.31, blue: 0.36))
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(Color(red: 1.0, green: 0.973, blue: 0.988).opacity(0.92))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .shadow(color: .black.opacity(0.06), radius: 18, x: 0, y: 8)
        .padding(24)
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
