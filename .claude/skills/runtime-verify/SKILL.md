---
name: runtime-verify
description: >
  Runtime and render smoke harness for all environments — web (Next.js),
  mobile-web (RNW/Expo web), mobile native bundle, iOS simulator, and Android
  device/emulator. Detect-and-run: executes every tier available in the current
  context, skips unavailable ones with an explicit logged reason, and reports a
  per-environment PASS / FAIL / SKIPPED verdict. Run AFTER validate-all; this
  skill covers only the runtime smokes that pnpm validate deliberately excludes.
---

# runtime-verify — Runtime & Render Smoke Harness

> **SCOPE GUARD — read this first.**
> This skill does NOT re-run `pnpm validate`. Run `validate-all` first and
> confirm it is green. `runtime-verify` covers ONLY the runtime and render
> smokes that `pnpm validate` deliberately excludes: production builds, bundle
> exports, headless render probes, responsive Playwright checks, and on-device
> native renders.

---

## When to run

- Before any release cut or release candidate tag.
- After changes to native dependencies (`package.json` / `expo-modules`,
  NativeWind preset, Metro resolver config, `metro.config.js`).
- After changes to the Next.js build pipeline, Tailwind config, or
  `next.config.ts`.
- After the React / React-Native version is bumped.
- After any Expo SDK upgrade.
- When `validate-all` is green but the product is not rendering correctly.
- Whenever the user asks "does this render?", "is the build healthy?", or
  "run all smokes".

---

## Headless vs. on-device caveat

| Tier | What it proves | What it does NOT prove |
|------|----------------|------------------------|
| 1 — Web headless | Next.js build succeeds; HTTP 200; marker present in HTML | Real browser paint, CSS rendering, JS hydration errors |
| 2 — Mobile-web headless | Expo web export succeeds; Playwright layout check at 4 viewports | Native gesture, font, and scroll fidelity |
| 3 — Native bundle | iOS + Android bundles exported; Hermes `.hbc` / `.bundle` file present | Actual app launch, native bridge calls |
| 4 — iOS simulator | App launches in Simulator; non-blank screenshot captured | Physical device GPU, camera, Bluetooth |
| 5 — Android device | App launches on USB-debug device/emulator; screencap non-blank | Physical device peripherals, production signing |

**Device verification (tiers 4–5) is mandatory before a release.** It is also
required after native-dependency changes, after Metro/resolver changes, and
after React / renderer version bumps — headless smokes cannot catch those
failure classes.

---

## Environment detection and tier availability

Before running any tier, determine availability. A tier is SKIPPED (not
FAILED) when its prerequisite is absent; log the reason explicitly.

```bash
# Tier 1 — Web: always available in CI and locally
# (Next.js build is a prerequisite of smoke:web)

# Tier 2 — Mobile-web: always available in CI and locally
# (expo export --platform web; no native toolchain needed)

# Tier 3 — Native bundle: always available in CI and locally
# (expo export --platform ios --platform android; no Xcode or adb needed)

# Tier 4 — iOS Simulator: local only; requires Xcode + simctl
xcrun simctl list devices 2>/dev/null | grep -q "Booted\|Shutdown" \
  && echo "AVAILABLE" || echo "SKIPPED: Xcode / simctl not found"

# Tier 5 — Android device/emulator: local only; requires adb + authorized device
adb devices 2>/dev/null | grep -E "device$" \
  && echo "AVAILABLE" || echo "SKIPPED: no authorized adb device or emulator"
```

---

## Tier 1 — Web (Next.js)

Runs in CI and locally. Never skip unless the Next.js build itself fails
(which is a BLOCKER, not a skip).

```bash
pnpm smoke:web
```

This expands to:

```bash
pnpm --filter @app/web build && node scripts/smoke-web-render.mjs
```

`scripts/smoke-web-render.mjs` starts `next start`, polls
`http://localhost:3000` for HTTP 200, then confirms the `aurora` marker is
present in the HTML body. The process exits non-zero on failure.

Then run the responsive Playwright suite:

```bash
pnpm exec playwright test \
  --project=mobile-390 \
  --project=tablet-768 \
  --project=desktop-1280 \
  --project=desktop-1920
```

These projects run `e2e/responsive.e2e.ts` and verify no horizontal overflow
and that all interactive controls are within viewport at four breakpoints.

**Tier 1 PASS**: `smoke:web` exits 0 AND all four responsive projects pass.

---

## Tier 2 — Mobile-web / React Native Web

Runs in CI and locally.

```bash
pnpm smoke:mobile-web
```

This expands to:

```bash
pnpm --filter @app/mobile export:web && \
pnpm exec playwright test \
  --project=mobile-web-390 \
  --project=mobile-web-768 \
  --project=mobile-web-1280 \
  --project=mobile-web-1920
```

`export:web` runs `expo export --platform web --output-dir dist-web`.
The Playwright mobile-web projects serve `apps/mobile/dist-web` on port 3001
and run `e2e/mobile-web.e2e.ts`.

**Tier 2 PASS**: export exits 0 AND all four mobile-web Playwright projects pass.

---

## Tier 3 — Mobile native bundle

Runs in CI and locally.

```bash
pnpm smoke:mobile
```

This expands to:

```bash
pnpm --filter @app/mobile smoke:export
```

Which in turn runs:

```bash
pnpm --filter @app/mobile export:ci && node scripts/assert-expo-export.mjs
```

`export:ci` runs `expo export --platform ios --platform android --output-dir dist`.
`scripts/assert-expo-export.mjs` scans `apps/mobile/dist/_expo/static/js/{ios,android}/`
for `.hbc` or `.bundle` files and exits non-zero if either platform has no
bundle (Hermes compilation failure or missing output).

**Tier 3 PASS**: both iOS and Android bundles present in `dist/`.

---

## Tier 4 — iOS Simulator (local only)

Skip with logged reason if `xcrun simctl` is unavailable.

```bash
# 1. Pick or boot a simulator
SIM_UDID=$(xcrun simctl list devices available -j \
  | python3 -c "
import sys, json
devs = json.load(sys.stdin)['devices']
for runtime, list_ in devs.items():
  for d in list_:
    if d.get('isAvailable') and 'iPhone' in d.get('name',''):
      print(d['udid']); exit()
")
xcrun simctl boot "$SIM_UDID" 2>/dev/null || true  # idempotent if already booted

# 2. Launch the app
pnpm --filter @app/mobile exec expo run:ios

# 3. Capture a screenshot and confirm it is non-blank
xcrun simctl io booted screenshot /tmp/ios-smoke.png
# Verify the file is non-zero bytes and not a blank/solid-color image:
python3 -c "
import sys
size = __import__('os').path.getsize('/tmp/ios-smoke.png')
if size < 5000:
  print('FAIL: screenshot suspiciously small, likely blank'); sys.exit(1)
print('PASS: screenshot captured', size, 'bytes')
"
```

**Tier 4 PASS**: `expo run:ios` exits 0 AND screenshot file is non-blank.

---

## Tier 5 — Android device / emulator (local only)

Skip with logged reason if no authorized `adb` device is found.

Set required environment variables before running:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

Detect an authorized device:

```bash
AUTHORIZED=$(adb devices | grep -E "device$" | grep -v "List of" | head -1 | awk '{print $1}')
if [ -z "$AUTHORIZED" ]; then
  echo "SKIPPED: no authorized adb device or emulator (enable USB debugging on device)"
  exit 0
fi
```

Launch and capture:

```bash
# Launch — do NOT pass --device with a raw serial; let Expo auto-select
pnpm --filter @app/mobile exec expo run:android

# Capture a screencap from the booted device
adb exec-out screencap -p > /tmp/android-smoke.png

# Confirm non-blank
python3 -c "
import sys
size = __import__('os').path.getsize('/tmp/android-smoke.png')
if size < 5000:
  print('FAIL: screenshot suspiciously small, likely blank'); sys.exit(1)
print('PASS: screenshot captured', size, 'bytes')
"
```

**Tier 5 PASS**: `expo run:android` exits 0 AND screencap is non-blank.

---

## On-failure: diagnose → fix → re-verify loop

When any tier fails, apply this loop before marking the tier as BLOCKER:

### Step 1 — Diagnose

Capture the full stderr and stdout from the failing command. Look for these
known failure signatures:

| Symptom | Root cause |
|---------|-----------|
| `Cannot resolve 'nativewind/preset'` | Missing NativeWind preset in Tailwind config |
| `Metro: Unable to resolve module` | pnpm isolated linker — `node_modules` not hoisted; check `metro.config.js` `resolver.nodeModulesPaths` |
| `Peer dependency conflict` on React or React-Native | Mismatched peer deps after version bump |
| `Warning: An update to X inside a test was not wrapped in act(...)` | react/renderer version mismatch — RN and React versions out of sync |
| `max-w-*` or `text-*` Tailwind class not applied | Tailwind 4 token collision — class name exists in Tailwind 4 core and was renamed; check migration guide |
| `.hbc` not found in `dist/` | Hermes compilation silently failed; check `expo export` output for JS errors |
| `HTTP 200 not received` from `smoke-web-render.mjs` | `next build` succeeded but `next start` crashing at runtime — check `.next/server/` error logs |

### Step 2 — Fix

Apply the targeted fix for the diagnosed root cause. Do NOT modify unrelated
code. Follow `docs/code-standards.md` for any code edits.

### Step 3 — Re-verify

Re-run ONLY the affected tier's smoke command (not the full harness). If it
passes, mark that tier PASS. If it fails again, escalate to the user with
full diagnostic output — do not loop more than twice.

---

## Verdict format

After all tiers complete, produce this report:

```
## Runtime Verify Report

| Tier | Environment          | Result   | Notes |
|------|----------------------|----------|-------|
| 1    | Web (Next.js)        | PASS/FAIL/SKIPPED | |
| 1    | Web responsive (4 viewports) | PASS/FAIL/SKIPPED | |
| 2    | Mobile-web (RNW)     | PASS/FAIL/SKIPPED | |
| 2    | Mobile-web Playwright (4 viewports) | PASS/FAIL/SKIPPED | |
| 3    | Mobile native bundle | PASS/FAIL/SKIPPED | |
| 4    | iOS Simulator        | PASS/FAIL/SKIPPED | Reason if skipped |
| 5    | Android device       | PASS/FAIL/SKIPPED | Reason if skipped |

### BLOCKERs — must fix before release
{List every FAIL with tier, command, and first error line}
(none if clean)

### SKIPs
{List every SKIPPED tier with reason}
(none if all ran)

---

## Overall verdict: DONE | NOT-DONE

DONE only when:
  - Tiers 1, 2, and 3 all PASS
  - Tiers 4 and 5: PASS or SKIPPED with a logged reason

NOT-DONE if:
  - Any of tiers 1, 2, or 3 FAIL
  - Any tier FAIL after the diagnose→fix→re-verify loop
```

---

## Key files

- `scripts/smoke-web-render.mjs` — Next.js HTTP 200 + marker probe
- `scripts/assert-expo-export.mjs` — Hermes `.hbc` / `.bundle` presence check
- `e2e/responsive.e2e.ts` — viewport overflow checks (390/768/1280/1920)
- `e2e/mobile-web.e2e.ts` — RNW layout checks at 4 viewports
- `playwright.config.ts` — project definitions for all viewport suites
- `.github/workflows/ci.yml` — advisory CI jobs: `web-render`, `mobile-export`, `responsive`, `mobile-web`
- `apps/mobile/package.json` — `export:ci`, `export:web`, `smoke:export` scripts
- `docs/e2e.md` — e2e harness documentation
- `docs/responsive.md` — responsive layout documentation
