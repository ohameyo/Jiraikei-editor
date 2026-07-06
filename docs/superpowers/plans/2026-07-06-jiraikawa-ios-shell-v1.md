# 蕾蕾卡哇 iOS Shell V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first iOS shell App for 蕾蕾卡哇 that loads the existing editor, supports native photo import, native save to album, native share, and TestFlight submission.

**Architecture:** V1 is a hybrid App. The native iOS layer owns WKWebView, photo picker, album save, system share, permissions, and App Store packaging; the existing web editor owns editing UI, rendering, filters, stickers, text, frames, overlays, and export pixels. A small JavaScript bridge connects the web editor to native import, save, and share actions.

**Tech Stack:** Swift, SwiftUI, WKWebView, PHPicker, Photos, UIActivityViewController, existing JiraiKawa web editor, Cloudflare Pages App-specific Lab and production deployments.

---

## Scope Lock

V1 includes:

- App name: 蕾蕾卡哇
- Bundle ID: `com.jiraikawa.app`
- SKU: `jiraikawa-ios-v1`
- Developer type: individual Apple Developer account
- Minimum product loop: open App, load editor, import static image, edit with existing web features, save to album, open system share

V1 excludes:

- Lab 的“更多素材页”独立功能
- Live Photo import, preview, editing, and export
- User account, creator system, community, ecommerce, membership, push notification, Android, iPad-specific layout

## File Structure

Create these files when implementation starts:

- `ios/JiraiKawa/JiraiKawa.xcodeproj`: Xcode project. Xcode project is the Apple IDE project file that stores build settings and targets.
- `ios/JiraiKawa/JiraiKawa/App/JiraiKawaApp.swift`: SwiftUI App entry.
- `ios/JiraiKawa/JiraiKawa/App/ContentView.swift`: Hosts the web editor container.
- `ios/JiraiKawa/JiraiKawa/Web/EditorWebView.swift`: WKWebView wrapper and navigation policy.
- `ios/JiraiKawa/JiraiKawa/Bridge/EditorBridge.swift`: JavaScript bridge message handling.
- `ios/JiraiKawa/JiraiKawa/Photos/PhotoImportService.swift`: Native photo picker.
- `ios/JiraiKawa/JiraiKawa/Photos/PhotoExportService.swift`: Save to Photos and system share.
- `ios/JiraiKawa/JiraiKawa/Config/AppEnvironment.swift`: App-specific Lab and production URL selection.
- `ios/JiraiKawa/JiraiKawa/Resources/Info.plist`: App permissions and display metadata.
- `ios/JiraiKawa/README.md`: Local build, signing, and TestFlight notes.

Modify these existing web files only after the native shell loads successfully:

- `src/app.js`: Add App environment detection and JavaScript bridge calls for import, save, and share.
- `index.html`: Add any App-specific boot metadata only if needed.
- `tests/p38/iosBridge.test.mjs`: Add bridge behavior tests for the web side.

## Task 1: Create iOS Project Skeleton

**Files:**
- Create: `ios/JiraiKawa/JiraiKawa.xcodeproj`
- Create: `ios/JiraiKawa/JiraiKawa/App/JiraiKawaApp.swift`
- Create: `ios/JiraiKawa/JiraiKawa/App/ContentView.swift`
- Create: `ios/JiraiKawa/JiraiKawa/Config/AppEnvironment.swift`
- Create: `ios/JiraiKawa/JiraiKawa/Resources/Info.plist`
- Create: `ios/JiraiKawa/README.md`

- [ ] **Step 1: Create the Xcode project**

Use Xcode to create a new iOS App project:

```text
Product Name: JiraiKawa
Interface: SwiftUI
Language: Swift
Bundle Identifier: com.jiraikawa.app
Minimum iOS: 16.0
```

Expected: Xcode creates an iOS project under `ios/JiraiKawa`.

- [ ] **Step 2: Set the App entry**

Create `ios/JiraiKawa/JiraiKawa/App/JiraiKawaApp.swift`:

```swift
import SwiftUI

@main
struct JiraiKawaApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

Expected: the App target has a single SwiftUI entry point.

- [ ] **Step 3: Add the first content view**

Create `ios/JiraiKawa/JiraiKawa/App/ContentView.swift`:

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        Text("蕾蕾卡哇")
            .font(.title)
            .padding()
    }
}
```

Expected: simulator or device displays `蕾蕾卡哇`.

- [ ] **Step 4: Add environment URL config**

Create `ios/JiraiKawa/JiraiKawa/Config/AppEnvironment.swift`:

```swift
import Foundation

enum AppEnvironment {
    static let appLabEditorURL = URL(string: "https://jiraikawa-ios-lab.pages.dev")!
    static let productionEditorURL = URL(string: "https://jirai.pages.dev")!
    static let activeEditorURL = appLabEditorURL
}
```

Expected: V1 starts from the App-specific Lab while native shell behavior is being tested. Do not point the iOS shell at the shared `jirai-editor-ux-lab.pages.dev`, because that shared Lab may contain V5, material-page, or unrelated web experiments.

- [ ] **Step 5: Configure permissions**

Set `ios/JiraiKawa/JiraiKawa/Resources/Info.plist` entries:

```xml
<key>CFBundleDisplayName</key>
<string>蕾蕾卡哇</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>用于选择要编辑的照片。</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>用于保存编辑后的图片到相册。</string>
```

Expected: permission dialogs explain why the App needs photo access.

- [ ] **Step 6: Verify skeleton build**

Run in Xcode:

```text
Product > Build
```

Expected: build succeeds on simulator and the app launches to the placeholder text.

- [ ] **Step 7: Commit**

```bash
git add ios/JiraiKawa
git commit -m "feat: add jiraikawa ios app skeleton"
```

Expected: one commit contains only the iOS project skeleton.

## Task 2: Load App-Specific Lab Editor In WKWebView

**Files:**
- Create: `ios/JiraiKawa/JiraiKawa/Web/EditorWebView.swift`
- Modify: `ios/JiraiKawa/JiraiKawa/App/ContentView.swift`
- Modify: `ios/JiraiKawa/JiraiKawa/Config/AppEnvironment.swift`

- [ ] **Step 1: Create WKWebView wrapper**

Create `ios/JiraiKawa/JiraiKawa/Web/EditorWebView.swift`:

```swift
import SwiftUI
import WebKit

struct EditorWebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if webView.url == nil {
            webView.load(URLRequest(url: url))
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
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
    }
}
```

Expected: WKWebView loads only the editor domains and cancels unrelated navigation.

- [ ] **Step 2: Replace placeholder content**

Modify `ios/JiraiKawa/JiraiKawa/App/ContentView.swift`:

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        EditorWebView(url: AppEnvironment.activeEditorURL)
            .ignoresSafeArea()
    }
}
```

Expected: App opens directly into the App-specific Lab editor.

- [ ] **Step 3: Verify on simulator**

Run in Xcode:

```text
Product > Run
```

Expected: App-specific Lab editor loads and no browser chrome is visible.

- [ ] **Step 4: Verify on iPhone**

Run on a physical iPhone:

```text
Select connected iPhone > Product > Run
```

Expected: editor loads on device, scroll and tap interactions work, and external links do not leave the App.

- [ ] **Step 5: Commit**

```bash
git add ios/JiraiKawa
git commit -m "feat: load lab editor in ios webview"
```

Expected: one commit contains the WKWebView loading behavior.

## Task 3: Add Native Photo Import Bridge

**Files:**
- Create: `ios/JiraiKawa/JiraiKawa/Bridge/EditorBridge.swift`
- Create: `ios/JiraiKawa/JiraiKawa/Photos/PhotoImportService.swift`
- Modify: `ios/JiraiKawa/JiraiKawa/Web/EditorWebView.swift`
- Modify: `src/app.js`
- Create: `tests/p38/iosBridge.test.mjs`

- [ ] **Step 1: Add web-side bridge test**

Create `tests/p38/iosBridge.test.mjs`:

```javascript
import assert from 'node:assert/strict';
import test from 'node:test';

function hasNativeBridge(windowLike) {
  return Boolean(windowLike?.webkit?.messageHandlers?.jiraiNative);
}

function postNativeMessage(windowLike, message) {
  if (!hasNativeBridge(windowLike)) return false;
  windowLike.webkit.messageHandlers.jiraiNative.postMessage(message);
  return true;
}

test('detects iOS native bridge when message handler exists', () => {
  const posted = [];
  const windowLike = {
    webkit: {
      messageHandlers: {
        jiraiNative: {
          postMessage(message) {
            posted.push(message);
          }
        }
      }
    }
  };

  assert.equal(postNativeMessage(windowLike, { type: 'pickImage' }), true);
  assert.deepEqual(posted, [{ type: 'pickImage' }]);
});

test('returns false when native bridge is unavailable', () => {
  assert.equal(postNativeMessage({}, { type: 'pickImage' }), false);
});
```

Expected: tests define the minimum web bridge behavior before wiring production code.

- [ ] **Step 2: Run bridge test to verify baseline**

Run:

```bash
node --test tests/p38/iosBridge.test.mjs
```

Expected: PASS for the standalone bridge helper behavior.

- [ ] **Step 3: Add native bridge handler**

Create `ios/JiraiKawa/JiraiKawa/Bridge/EditorBridge.swift`:

```swift
import Foundation
import WebKit

final class EditorBridge: NSObject, WKScriptMessageHandler {
    var onPickImage: (() -> Void)?
    var onSaveImage: ((String) -> Void)?
    var onShareImage: ((String) -> Void)?

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "jiraiNative",
              let body = message.body as? [String: Any],
              let type = body["type"] as? String else {
            return
        }

        switch type {
        case "pickImage":
            onPickImage?()
        case "saveImage":
            if let dataURL = body["dataURL"] as? String {
                onSaveImage?(dataURL)
            }
        case "shareImage":
            if let dataURL = body["dataURL"] as? String {
                onShareImage?(dataURL)
            }
        default:
            return
        }
    }
}
```

Expected: native code can receive `pickImage`, `saveImage`, and `shareImage`.

- [ ] **Step 4: Add photo import service**

Create `ios/JiraiKawa/JiraiKawa/Photos/PhotoImportService.swift`:

```swift
import PhotosUI
import SwiftUI

struct PhotoImportService: UIViewControllerRepresentable {
    let onImageData: (Data, String) -> Void

    func makeUIViewController(context: Context) -> PHPickerViewController {
        var configuration = PHPickerConfiguration(photoLibrary: .shared())
        configuration.filter = .images
        configuration.selectionLimit = 1

        let picker = PHPickerViewController(configuration: configuration)
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onImageData: onImageData)
    }

    final class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let onImageData: (Data, String) -> Void

        init(onImageData: @escaping (Data, String) -> Void) {
            self.onImageData = onImageData
        }

        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            picker.dismiss(animated: true)
            guard let provider = results.first?.itemProvider,
                  provider.hasItemConformingToTypeIdentifier("public.image") else {
                return
            }

            provider.loadDataRepresentation(forTypeIdentifier: "public.image") { data, _ in
                guard let data else { return }
                DispatchQueue.main.async {
                    self.onImageData(data, "image/jpeg")
                }
            }
        }
    }
}
```

Expected: iOS picker returns image data to the native shell.

- [ ] **Step 5: Inject bridge into WKWebView**

Update `EditorWebView.makeUIView` to create a `WKUserContentController`, add the `EditorBridge`, and pass image data back with JavaScript:

```swift
let userContentController = WKUserContentController()
let bridge = EditorBridge()
userContentController.add(bridge, name: "jiraiNative")
configuration.userContentController = userContentController
```

When native image data is available, call:

```swift
let base64 = data.base64EncodedString()
let script = "window.dispatchEvent(new CustomEvent('jiraiNativeImagePicked', { detail: { dataURL: 'data:\(mimeType);base64,\(base64)' } }))"
webView.evaluateJavaScript(script)
```

Expected: selecting a photo dispatches `jiraiNativeImagePicked` inside the web editor.

- [ ] **Step 6: Wire web editor to native import**

Modify `src/app.js` so App environment import first tries:

```javascript
window.webkit.messageHandlers.jiraiNative.postMessage({ type: 'pickImage' });
```

Add event handling:

```javascript
window.addEventListener('jiraiNativeImagePicked', (event) => {
  const dataUrl = event.detail?.dataURL;
  if (!dataUrl) return;
  importImageFromDataUrl(dataUrl);
});
```

Use the existing image import function name from `src/app.js`; if it is not named `importImageFromDataUrl`, create a tiny adapter around the current import path.

Expected: iOS App import uses native picker while browser import behavior remains unchanged.

- [ ] **Step 7: Verify web syntax and bridge tests**

Run:

```bash
node --test tests/p38/iosBridge.test.mjs
node --check src/app.js
```

Expected: tests pass and syntax check succeeds.

- [ ] **Step 8: Verify on iPhone**

Run the App on a physical iPhone, tap import, select a static image, and confirm it appears in the editor.

Expected: native photo picker opens and the selected image enters the existing editor flow.

- [ ] **Step 9: Commit**

```bash
git add ios/JiraiKawa src/app.js tests/p38/iosBridge.test.mjs
git commit -m "feat: add ios native photo import"
```

Expected: one commit contains native import and web bridge integration.

## Task 4: Add Native Save And Share

**Files:**
- Create: `ios/JiraiKawa/JiraiKawa/Photos/PhotoExportService.swift`
- Modify: `ios/JiraiKawa/JiraiKawa/Bridge/EditorBridge.swift`
- Modify: `ios/JiraiKawa/JiraiKawa/Web/EditorWebView.swift`
- Modify: `src/app.js`
- Modify: `tests/p38/iosBridge.test.mjs`

- [ ] **Step 1: Extend bridge tests**

Add assertions in `tests/p38/iosBridge.test.mjs`:

```javascript
test('posts save and share image messages to native bridge', () => {
  const posted = [];
  const windowLike = {
    webkit: {
      messageHandlers: {
        jiraiNative: {
          postMessage(message) {
            posted.push(message);
          }
        }
      }
    }
  };

  postNativeMessage(windowLike, { type: 'saveImage', dataURL: 'data:image/png;base64,abc' });
  postNativeMessage(windowLike, { type: 'shareImage', dataURL: 'data:image/png;base64,abc' });

  assert.deepEqual(posted, [
    { type: 'saveImage', dataURL: 'data:image/png;base64,abc' },
    { type: 'shareImage', dataURL: 'data:image/png;base64,abc' }
  ]);
});
```

Expected: bridge tests cover export actions.

- [ ] **Step 2: Add photo export service**

Create `ios/JiraiKawa/JiraiKawa/Photos/PhotoExportService.swift`:

```swift
import Photos
import SwiftUI

enum PhotoExportService {
    static func image(from dataURL: String) -> UIImage? {
        guard let commaIndex = dataURL.firstIndex(of: ",") else { return nil }
        let base64 = String(dataURL[dataURL.index(after: commaIndex)...])
        guard let data = Data(base64Encoded: base64) else { return nil }
        return UIImage(data: data)
    }

    static func saveToAlbum(dataURL: String, completion: @escaping (Bool) -> Void) {
        guard let image = image(from: dataURL) else {
            completion(false)
            return
        }

        PHPhotoLibrary.shared().performChanges {
            PHAssetChangeRequest.creationRequestForAsset(from: image)
        } completionHandler: { success, _ in
            DispatchQueue.main.async {
                completion(success)
            }
        }
    }
}
```

Expected: native code can decode a PNG or JPEG data URL and save it to Photos.

- [ ] **Step 3: Present system share sheet**

Add a share presentation helper in the current root view controller:

```swift
let activityViewController = UIActivityViewController(activityItems: [image], applicationActivities: nil)
rootViewController.present(activityViewController, animated: true)
```

Expected: exported image opens in the iOS system share sheet.

- [ ] **Step 4: Wire web export buttons**

Modify `src/app.js` export completion so App environment can send:

```javascript
window.webkit.messageHandlers.jiraiNative.postMessage({
  type: 'saveImage',
  dataURL
});
```

and for sharing:

```javascript
window.webkit.messageHandlers.jiraiNative.postMessage({
  type: 'shareImage',
  dataURL
});
```

Expected: browser export remains unchanged, iOS App export can save or share natively.

- [ ] **Step 5: Verify**

Run:

```bash
node --test tests/p38/iosBridge.test.mjs
node --check src/app.js
```

Expected: tests pass and syntax check succeeds.

- [ ] **Step 6: Verify on iPhone**

Use a physical iPhone:

```text
Import image > edit > export > save to album
Import image > edit > export > share
```

Expected: edited static image appears in Photos and share sheet opens successfully.

- [ ] **Step 7: Commit**

```bash
git add ios/JiraiKawa src/app.js tests/p38/iosBridge.test.mjs
git commit -m "feat: add ios native save and share"
```

Expected: one commit contains native save and share behavior.

## Task 5: Add App Analytics Events

**Files:**
- Modify: `src/app.js`
- Modify: `functions/analytics.js`
- Modify: `tests/p37/analyticsVisitor.test.mjs`
- Modify: `tasks/analytics-tracking.md`

- [ ] **Step 1: Extend analytics event list**

Add App events:

```text
app_open
image_import
image_export
save_to_album
share_open
```

Expected: V1 tracks only core usage events.

- [ ] **Step 2: Preserve anonymous visitor ID**

Ensure iOS App still uses the existing anonymous visitor ID key:

```text
jirai_editor_visitor_id_v1
```

Expected: DAU remains comparable between web and App where the same web storage is available.

- [ ] **Step 3: Add query documentation**

Update `tasks/analytics-tracking.md` with:

```sql
SELECT
  toDate(timestamp) AS day,
  index1 AS event,
  SUM(_sample_interval) AS events,
  COUNT(DISTINCT blob18) AS users
FROM jirai_editor_events
WHERE index1 IN ('app_open', 'image_import', 'image_export', 'save_to_album', 'share_open')
GROUP BY day, event
ORDER BY day DESC, event ASC
```

Expected: App launch and export funnel can be queried in Cloudflare Analytics Engine.

- [ ] **Step 4: Run checks**

Run:

```bash
node --test tests/p37/analyticsVisitor.test.mjs
node --check src/app.js
node --check functions/analytics.js
```

Expected: analytics tests pass and syntax checks succeed.

- [ ] **Step 5: Commit**

```bash
git add src/app.js functions/analytics.js tests/p37/analyticsVisitor.test.mjs tasks/analytics-tracking.md
git commit -m "feat: track ios app core events"
```

Expected: one commit contains analytics changes only.

## Task 6: Prepare TestFlight Build

**Files:**
- Modify: `ios/JiraiKawa/README.md`
- Modify: `docs/app-store/jiraikawa-ios-v1-app-store-draft.md`

- [ ] **Step 1: Switch active URL for release candidate**

Before TestFlight, decide whether the build loads App-specific Lab or production:

```swift
static let activeEditorURL = appLabEditorURL
```

Expected: internal TestFlight can use App-specific Lab until the native bridge is stable.

- [ ] **Step 2: Archive in Xcode**

Run:

```text
Product > Archive
Distribute App > App Store Connect > Upload
```

Expected: Xcode uploads the build to App Store Connect.

- [ ] **Step 3: Add build notes**

Update `ios/JiraiKawa/README.md` with:

```markdown
## TestFlight V1 Notes

- Bundle ID: `com.jiraikawa.app`
- SKU: `jiraikawa-ios-v1`
- Current editor URL: App-specific Lab
- Required device checks: launch, import, edit, save, share
- Excluded: Live Photo, Lab more-materials page, community, account, paid features
```

Expected: the TestFlight build state is clear.

- [ ] **Step 4: Commit**

```bash
git add ios/JiraiKawa/README.md docs/app-store/jiraikawa-ios-v1-app-store-draft.md
git commit -m "docs: prepare jiraikawa testflight notes"
```

Expected: TestFlight notes are committed separately from code changes.

## Task 7: App Store Submission Package

**Files:**
- Modify: `docs/app-store/jiraikawa-ios-v1-app-store-draft.md`
- Create: `docs/app-store/jiraikawa-ios-v1-submission-checklist.md`

- [ ] **Step 1: Create submission checklist**

Create `docs/app-store/jiraikawa-ios-v1-submission-checklist.md`:

```markdown
# 蕾蕾卡哇 iOS V1 Submission Checklist

- [ ] App name: 蕾蕾卡哇
- [ ] Bundle ID: `com.jiraikawa.app`
- [ ] SKU: `jiraikawa-ios-v1`
- [ ] Category: Photo & Video
- [ ] Subtitle: 日系量产型图片编辑器
- [ ] App icon uploaded
- [ ] iPhone screenshots uploaded
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] App privacy questionnaire completed
- [ ] Review Notes include import, edit, save, and share path
- [ ] TestFlight build selected
- [ ] No Live Photo claims in metadata
- [ ] No Lab more-materials page claims in metadata
```

Expected: the App Store submission process has a final checklist.

- [ ] **Step 2: Verify metadata does not claim excluded features**

Run:

```bash
rg -n "Live Photo|更多素材|社区|会员|商城|创作者" docs/app-store
```

Expected: matches only appear in exclusion or warning sections.

- [ ] **Step 3: Commit**

```bash
git add docs/app-store/jiraikawa-ios-v1-app-store-draft.md docs/app-store/jiraikawa-ios-v1-submission-checklist.md
git commit -m "docs: add jiraikawa app store submission checklist"
```

Expected: App Store submission docs are committed.

## Verification Before First Submission

Run these checks before submitting V1:

```bash
git status --short
node --test tests/p37/analyticsVisitor.test.mjs tests/p38/iosBridge.test.mjs
node --check src/app.js
node --check functions/analytics.js
```

Manual device checks:

- Launch App on iPhone.
- Load editor without browser chrome.
- Import one static photo from Photos.
- Apply one filter and one sticker.
- Export edited image.
- Save edited image to Photos.
- Open system share sheet.
- Relaunch App and confirm the editor still loads.

## Handoff Notes

Start only after Apple Developer account activation is complete and Xcode signing can use the personal developer team.

Use App-specific Lab URL for early native development. The App-specific Lab should be a copy of the current production editor plus App-only adaptation work, not the shared web Lab. Switch to production or an App-specific production URL only after Meyo confirms the App-specific Lab behavior on phone.
