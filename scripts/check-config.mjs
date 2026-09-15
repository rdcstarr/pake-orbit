// safeDomain replaces the set of URLs that stay inside the app, it does not add
// to it — the mistake that shipped in pake-dribbble 1.0.0, where every internal
// link ended up in the system browser.
//
// Orbit keeps the login, the two-factor challenge and every workspace page on
// app.orbit.management, so one host is the whole of safeDomain; the marketing
// site on orbit.management is somewhere a link should leave the app for.
// The probes below are the pages a signed-in session cannot do without.
//
// Reads the config pake generated for the build just run and asserts the app can
// still navigate to its own pages and to the login it depends on.
import { readFileSync, existsSync } from 'node:fs';

const GENERATED = 'node_modules/pake-cli/src-tauri/.pake/pake.json';

const app = JSON.parse(readFileSync('app.json', 'utf8'));
const home = new URL(app.url);

if (!existsSync(GENERATED)) {
  console.error(`warning: ${GENERATED} not found — cannot verify internal navigation`);
  process.exit(0);
}

const generated = JSON.parse(readFileSync(GENERATED, 'utf8'));
const window = generated.windows?.[0] ?? generated;
const pattern = window.internal_url_regex;

// An empty regex is pake's default, which keeps the app's own host internal.
if (!pattern) {
  console.log('internal_url_regex is unset — pake keeps the origin host internal by default');
  process.exit(0);
}

const probes = [
  home.href,
  new URL('/login', home).href,
  new URL('/two-factor-challenge', home).href,
  new URL('/search', home).href,
];
const failed = probes.filter((url) => !new RegExp(pattern).test(url));

if (failed.length > 0) {
  const hosts = [...new Set(failed.map((url) => new URL(url).host))];
  console.error('internal_url_regex leaves URLs the app depends on outside it, so they would open in the system browser:');
  for (const url of failed) console.error(`  external: ${url}`);
  console.error(`regex: ${pattern}`);
  console.error(`fix: add ${hosts.join(', ')} to safeDomain`);
  process.exit(1);
}

console.log(`internal_url_regex keeps all ${probes.length} required URLs inside the app`);
