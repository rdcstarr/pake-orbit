# Orbit, as a desktop app

[Orbit](https://app.orbit.management) packaged with [Pake](https://github.com/tw93/Pake)
into a native window — the system webview, not a bundled browser, so the whole
thing is a few megabytes rather than a few hundred.

## Install

```bash
curl -fsSL https://get.rec.tools/orbit | bash
```

Linux and macOS. On Linux the script installs the `.deb` where `dpkg` exists and
falls back to the AppImage in `~/.local` where it does not. On Windows, download
the `.msi` from [the latest release](https://github.com/rdcstarr/pake-orbit/releases/latest).

The command is `pake-orbit` — Pake prefixes the Linux binary, and the AppImage
path is named to match so it is the same either way.

## Signing in

Email and password. The two-factor challenge that may follow lives on the same
host, so the whole exchange stays inside the window. Tick **Keep me signed in on
this device**: the window keeps its cookies across restarts, and that box is what
keeps the session itself alive between them.

The **Continue with Google** button is the unreliable path, as in every embedded
webview: Google refuses to authenticate outside a real browser.

## One host, deliberately

`safeDomain` lists `app.orbit.management` and nothing else. The login, the
two-factor challenge and every workspace page live there, while the marketing
site on `orbit.management` is exactly where a click should hand you to your
browser — which is what an unlisted host does.

`safeDomain` **replaces** the set of URLs that stay in the app rather than adding
to it, so leaving the app's own host out would send every internal link to the
browser. `scripts/check-config.mjs` reads the regex Pake compiled for the build
and fails the workflow if the home page, the login, the two-factor challenge or
search ever stop matching.

## Right-click

Pake injects a right-click menu of its own — *Copy Address*, *Open in Browser* —
that listens on the whole document before anything else and stops the event
whenever the pointer is over a link or an image. Orbit draws its own context
menus on exactly those rows, so inside the window they never opened.

`scripts/drop-context-menu.mjs` removes that listener from Pake's `event.js`
before the build embeds it, and the workflow runs it right after installing
`pake-cli`. Right-click then behaves as in a browser: Orbit's menus where Orbit
has them, the system menu everywhere else. The script checks that it removed
the contextmenu listener and nothing else, and fails the build if a Pake upgrade
has moved it — so the menu cannot come back silently.

## The window's buttons

`hideTitleBar` draws the page under the title bar, so the three buttons float
over Orbit's top-left corner. Orbit knows: it reads `window.pakeConfig` before
its first paint and lays its first row out around them — the workspace picker
after them in the rail, the page bar's toggle after them when the rail is
closed — and marks that row, the page bar and the sign-in background with
`data-tauri-drag-region`, so the window drags and double-click zooms from them,
as from any title bar.

Two things Pake does not do on its own, both patched into its sources before
the build, the way the right-click menu is:

`scripts/place-window-buttons.mjs` asks Tauri to place the buttons on Orbit's
44px row, centred at 22pt, where macOS would leave them centred at 14 in a
title bar nobody sees. Should a macOS release move them, the figure to adjust
is the `y` in that script: the circle's centre lands at `y + 2`.

`scripts/drop-drag-strip.mjs` stops Pake laying its invisible 20px drag strip
across the top of the page, where it sat over the upper half of every button in
Orbit's page bar, and grants the permission a double-click on Orbit's rows
needs to zoom the window.

## What builds, and where

| Platform | Format | Architecture |
| --- | --- | --- |
| Linux | `.deb`, `.AppImage` | x86_64 |
| macOS | `.dmg` | Apple Silicon |
| Windows | `.msi` | x64 |

Pushing a `v*` tag builds all three in GitHub Actions and publishes them to a
release. Every asset is renamed to a name that never changes, so
`releases/latest/download/orbit-macos-arm64.dmg` is a permanent URL — that is
what lets `install.sh` skip `api.github.com` entirely, and with it the 60
requests per hour that unauthenticated callers get.

`workflow_dispatch` runs the same build without publishing, for when the
workflow itself is what changed.

## The icon

`icons/orbit.png` is the application's own `public/favicon.svg`, placed on the
macOS icon grid: the 512 tile scaled to 824 points inside a 1024 canvas, so it
sits at the same size as its neighbours in the Dock instead of filling the slot
edge to edge.

## What this is not

Nothing here is signed or notarised: macOS needs the quarantine flag cleared
(the installer does it) and may still want a right-click → Open the first time,
and Windows shows a SmartScreen warning. There is no auto-update — reinstalling
with the same command is the update.
