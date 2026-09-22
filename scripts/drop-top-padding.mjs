// With the title bar hidden on macOS, Pake appends a second stylesheet of its
// own: the top paddings it was written to give the sites it ships support for,
// and the drag strip's cursor. Two of those selectors are plain Tailwind class
// combinations rather than a site's own names, so they land on Orbit too —
// `.flex.w-full.h-full.overflow-hidden` is the root of every cmdk popover (the
// record picker, the country field, the command palette) and pads 20px in above
// its search box, and `.text-sidebar-foreground .bg-sidebar` pads the sidebar's
// column by 30. Orbit's own rows make room for the window's buttons and the
// strip is gone (drop-drag-strip.mjs), so the sheet has nothing left to do here:
// this stops style.js appending it.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'node_modules/pake-cli/src-tauri/src/inject/style.js';
const START = '  // Top spacing adapts to head-hiding scenarios\n  const topPaddingCSS = `\n';
const END = '    document.head.appendChild(topPaddingStyleElement);\n  }\n';

const source = readFileSync(FILE, 'utf8');
const start = source.indexOf(START);
const end = source.indexOf(END);

const once = (marker) =>
  source.indexOf(marker) >= 0 && source.indexOf(marker) === source.lastIndexOf(marker);

// Both markers must exist exactly once, in order: a Pake upgrade that moves them
// has to fail the build here, not append the sheet back silently.
if (!once(START) || !once(END) || end < start) {
  console.error(`${FILE}: the top-padding sheet is not where pake 3.15.7 builds it — check the new style.js by hand`);
  process.exit(1);
}

const removed = source.slice(start, end + END.length);
if (!removed.includes('.flex.w-full.h-full.overflow-hidden') || !removed.includes('hasImmersiveHeader')) {
  console.error(`${FILE}: the block between the markers is not the top-padding sheet`);
  process.exit(1);
}

const patched = source.slice(0, start) + source.slice(end + END.length);

// The sheet of site fixes above it stays; only this one is built from the
// paddings, so nothing outside the removed block may still reach for it.
if (patched.includes('topPaddingCSS') || patched.includes('topPaddingStyleElement')) {
  console.error(`${FILE}: something outside the removed block still reads the top-padding sheet`);
  process.exit(1);
}

writeFileSync(FILE, patched);
console.log(`removed pake's top-padding stylesheet (${removed.split('\n').length - 1} lines) from ${FILE}`);
