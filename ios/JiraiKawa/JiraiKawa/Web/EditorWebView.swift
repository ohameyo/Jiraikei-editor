import SwiftUI
import WebKit

struct EditorWebView: UIViewRepresentable {
    let url: URL
    let reloadToken: UUID
    @Binding var isLoading: Bool
    @Binding var loadError: String?

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        context.coordinator.reloadToken = reloadToken
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.969, green: 0.945, blue: 0.965, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if webView.url == nil || context.coordinator.reloadToken != reloadToken {
            context.coordinator.reloadToken = reloadToken
            DispatchQueue.main.async {
                isLoading = true
                loadError = nil
            }
            webView.load(URLRequest(url: url))
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(isLoading: $isLoading, loadError: $loadError)
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        var reloadToken: UUID?
        private var isLoading: Binding<Bool>
        private var loadError: Binding<String?>

        init(isLoading: Binding<Bool>, loadError: Binding<String?>) {
            self.isLoading = isLoading
            self.loadError = loadError
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let host = navigationAction.request.url?.host else {
                decisionHandler(.cancel)
                return
            }

            let allowedHosts = [
                "jiraikawa-ios-lab.pages.dev",
                "jirai.pages.dev",
                "jiraikawa.com"
            ]

            decisionHandler(allowedHosts.contains(host) ? .allow : .cancel)
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            isLoading.wrappedValue = true
            loadError.wrappedValue = nil
        }

        func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
            isLoading.wrappedValue = false
            loadError.wrappedValue = nil
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            isLoading.wrappedValue = false
            loadError.wrappedValue = nil
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            show(error)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            show(error)
        }

        private func show(_ error: Error) {
            isLoading.wrappedValue = false
            loadError.wrappedValue = error.localizedDescription
        }
    }
}
