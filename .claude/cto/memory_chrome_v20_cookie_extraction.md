---
name: Chrome v20 App-Bound Encryption blocks li_at extraction
description: Chrome 127+ uses app-bound encryption (v20) for cookies — automated li_at extraction via Playwright persistent context no longer works
type: project
---

Chrome 127+ introduced "Application-Bound Encryption" for cookies (prefix `v20`). This replaces the previous DPAPI-only approach (prefix `v10`/`v11`) and requires the `IElevationService` COM interface running as SYSTEM to decrypt. As a result:

- `chromium.launchPersistentContext()` fails with exitCode 21 (Chrome crashes immediately in headless mode with the user profile)
- PowerShell DPAPI decryption extracts a 32-byte AES key, but the v20 cookie blob cannot be decrypted with it
- Removing Chrome lock files (`Default/Lock`, `lockfile`) does not resolve the issue

**Current status:** LI_AT must be refreshed manually by Bill via Chrome DevTools.

**Manual refresh procedure:**
1. Open https://www.linkedin.com in Chrome (ensure logged in)
2. F12 → Application → Cookies → `.linkedin.com` → copy value of `li_at`
3. Paste at: https://console.apify.com/storage/key-value-stores/frvdAm3q02CcWs52Z (key: `LI_AT`)

**Why:** Automated daily outreach depends entirely on a valid li_at. Without it, Steps 4 and 5 of the morning briefing are skipped.

**How to apply:** At the start of each morning briefing, if Apify returns "Failed to authorize with linkedin", immediately flag this as a manual action for Bill rather than spending time on automated extraction attempts. The v20 format is a deliberate security hardening measure — bypass attempts will continue to fail.
