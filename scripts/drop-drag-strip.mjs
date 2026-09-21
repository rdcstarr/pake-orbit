// With the title bar hidden, Pake lays a fixed, invisible 20px strip across
// the top of every page to drag the window by — over Orbit's page bar, whose
// buttons lose their upper half to it. Orbit marks its own title-bar rows
// with data-tauri-drag-region, which Tauri reads in every window, so the strip
// has nothing left to do: this stops event.js creating it, and grants the
// window the permission a double-click on those rows needs to zoom, as on any
// title bar.
import { readFileSync, writeFileSync } from 'node:fs';

const EVENT = 'node_modules/pake-cli/src-tauri/src/inject/event.js';
const START = '  if (!document.getElementById("pake-top-dom") && hasImmersiveHeader()) {\n';
const END = '  const domEl = document.getElementById("pake-top-dom");\n';

const CAPABILITIES = 'node_modules/pake-cli/src-tauri/capabilities/default.json';
const AFTER = '    "core:window:allow-toggle-maximize",\n';
const GRANT = '    "core:window:allow-internal-toggle-maximize",\n';

const once = (source, marker) =>
  source.indexOf(marker) >= 0 && source.indexOf(marker) === source.lastIndexOf(marker);

const event = readFileSync(EVENT, 'utf8');
const start = event.indexOf(START);
const end = event.indexOf(END);

// Both markers must exist exactly once, in order: a Pake upgrade that moves
// them has to fail the build here, not lay the strip back silently.
if (!once(event, START) || !once(event, END) || end < start) {
  console.error(`${EVENT}: the drag strip is not created where pake 3.15.7 creates it — check the new event.js by hand`);
  process.exit(1);
}

const removed = event.slice(start, end);
if (!removed.includes('topDom.id = "pake-top-dom"') || removed.split('\n').length > 7) {
  console.error(`${EVENT}: the block between the markers is not the strip's creation`);
  process.exit(1);
}

const capabilities = readFileSync(CAPABILITIES, 'utf8');
if (!once(capabilities, AFTER) || capabilities.includes(GRANT)) {
  console.error(`${CAPABILITIES}: the window permissions are not where pake 3.15.7 lists them — check the file by hand`);
  process.exit(1);
}

writeFileSync(EVENT, event.slice(0, start) + event.slice(end));
writeFileSync(CAPABILITIES, capabilities.replace(AFTER, AFTER + GRANT));
console.log(`removed pake's drag strip (${removed.split('\n').length - 1} lines) from ${EVENT}; granted internal-toggle-maximize in ${CAPABILITIES}`);
