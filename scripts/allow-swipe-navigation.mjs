// A two-finger swipe on a Mac trackpad steps back and forward in Safari, but
// WKWebView ships with that gesture off, and neither Pake nor Tauri turns it on:
// the swipe reaches Orbit as a sideways scroll and only drags the page. wry can
// set the flag, Tauri does not expose it, so this sets it on each window's
// WKWebView right after Pake's window.rs builds it — every window, since the
// "New Window" menu item builds through the same function.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'node_modules/pake-cli/src-tauri/src/app/window.rs';
const ANCHOR = '    let window = window_builder.build()?;\n';
const CALL = `
    #[cfg(target_os = "macos")]
    if let Err(error) = window.with_webview(|webview| unsafe {
        let webview = webview.inner() as *mut objc2::runtime::AnyObject;
        let _: () = objc2::msg_send![webview, setAllowsBackForwardNavigationGestures: true];
    }) {
        eprintln!("[Pake] Failed to allow swipe navigation: {error}");
    }
`;

const source = readFileSync(FILE, 'utf8');

// The anchor must exist exactly once: a Pake upgrade that reshapes the window
// build has to fail the build here, not ship the swipe off again silently.
if (source.indexOf(ANCHOR) < 0 || source.indexOf(ANCHOR) !== source.lastIndexOf(ANCHOR)) {
  console.error(`${FILE}: the window is not built where pake 3.15.7 builds it — check the new window.rs by hand`);
  process.exit(1);
}

if (source.includes('setAllowsBackForwardNavigationGestures')) {
  console.error(`${FILE}: already turns the swipe on — a newer pake may do this itself; drop this script`);
  process.exit(1);
}

writeFileSync(FILE, source.replace(ANCHOR, ANCHOR + CALL));
console.log(`turned on swipe navigation in ${FILE}`);
