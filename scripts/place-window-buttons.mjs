// With the title bar hidden, macOS keeps the window's three buttons where a
// 28pt title bar would have them, centred at 14pt. Orbit draws the row they
// share — the workspace picker beside them, the page bar to the right — 44px
// tall and centred at 22, so the buttons have to come down to meet it. Tauri
// can place them (traffic_light_position); Pake never asks it to. This adds
// the call to Pake's window.rs before the build compiles it.
//
// The figures: tao makes the title bar container `button frame + y` tall and
// leaves each button's frame where it was, 6pt up from the bottom. The frame
// is 16pt with the 12pt circle centred in it, so the circle's centre lands at
// y + 2 — 20 puts it on the row's axis at 22. x is the frame's left edge, and
// 12 is where macOS has it anyway.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'node_modules/pake-cli/src-tauri/src/app/window.rs';
const ANCHOR = '        window_builder = window_builder.title_bar_style(title_bar_style);\n';
const CALL = '        window_builder = window_builder.traffic_light_position(tauri::LogicalPosition::new(12.0, 20.0));\n';

const source = readFileSync(FILE, 'utf8');

// The anchor must exist exactly once: a Pake upgrade that reshapes the macOS
// block has to fail the build here, not ship the buttons back up silently.
if (source.indexOf(ANCHOR) < 0 || source.indexOf(ANCHOR) !== source.lastIndexOf(ANCHOR)) {
  console.error(`${FILE}: the title bar style is not set where pake 3.15.7 sets it — check the new window.rs by hand`);
  process.exit(1);
}

if (source.includes('traffic_light_position')) {
  console.error(`${FILE}: already places the buttons — a newer pake may do this itself; check the value and drop this script`);
  process.exit(1);
}

writeFileSync(FILE, source.replace(ANCHOR, ANCHOR + CALL));
console.log(`placed the window's buttons on Orbit's row in ${FILE}`);
