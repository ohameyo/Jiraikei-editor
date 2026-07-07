# JiraiKawa iOS

This is the V1 iOS shell for 蕾蕾卡哇.

## Scope

- Display name: 蕾蕾卡哇
- Bundle ID: `com.jiraikawa.app`
- Initial editor source: bundled local `index.html`
- Fallback editor URL: `https://jiraikawa-ios-lab.pages.dev`
- V1 excludes Live Photo, the shared web Lab material page, account features, paid features, and community features.

## Bundled Web

The app copies the production web editor files into the iOS bundle at build time:

- `index.html`
- `styles.css`
- `src/`
- `assets/`

This keeps the editor usable without downloading the main UI and material assets from the App-specific Lab on every launch. The App-specific Lab URL remains as a fallback when the bundled `index.html` is missing during development.

## Local Build

Open `JiraiKawa.xcodeproj` in Xcode, select the `JiraiKawa` target, and set the signing team to `MENGYAO WANG (Personal Team)`.

Then run on a simulator or connected iPhone.
