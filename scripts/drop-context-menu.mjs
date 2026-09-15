// Pake injects a right-click menu of its own ("Copy Address", "Open in Browser")
// that listens on document in the capture phase and stops the event for any
// link or image. Orbit draws its own context menus on exactly those rows, so
// they never saw a right-click. This removes Pake's listener before the build
// embeds event.js, leaving right-click to behave the way it does in a browser.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'node_modules/pake-cli/src-tauri/src/inject/event.js';
const START = '  // Handle right-click context menu\n';
const END = '  // Hide context menu when clicking elsewhere\n';

const source = readFileSync(FILE, 'utf8');
const start = source.indexOf(START);
const end = source.indexOf(END);

// Both markers must exist exactly once, in order: a Pake upgrade that moves them
// has to fail the build here, not ship the menu back silently.
const once = (marker) => source.indexOf(marker) === source.lastIndexOf(marker);
if (start < 0 || end < 0 || end < start || !once(START) || !once(END)) {
  console.error(`${FILE}: the right-click listener is not where pake 3.15.7 puts it — check the new event.js by hand`);
  process.exit(1);
}

const removed = source.slice(start, end);
if (!removed.includes('"contextmenu"')) {
  console.error(`${FILE}: the block between the markers is not the contextmenu listener`);
  process.exit(1);
}

writeFileSync(FILE, source.slice(0, start) + source.slice(end));
console.log(`removed pake's contextmenu listener (${removed.split('\n').length - 1} lines) from ${FILE}`);
