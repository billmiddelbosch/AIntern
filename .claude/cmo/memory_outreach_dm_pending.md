---
name: 3 connections pending DM follow-up
description: Bram Hofman, Jan Bulthuis, Bob van Boekel have connection_sent status — DMs not yet sent due to LI_AT expiry
type: project
---

As of 2026-04-10, three leads in `outreach-log.csv` have status `connection_sent` but no DM has been sent. DM follow-up was blocked by the expired LI_AT cookie.

| Name | LinkedIn | Sent |
|---|---|---|
| Bram Hofman | linkedin.com/in/bram-hofman-b0376a87/ | 2026-04-08 |
| Jan Bulthuis | linkedin.com/in/jan-bulthuis-6b84541/ | 2026-04-09 |
| Bob van Boekel | linkedin.com/in/bob-van-boekel-a0a32b227/ | 2026-04-09 |

DM message (approved, <200 chars): `Hoelang duurt het bij jullie om één product op te voeren in Lightspeed?`

**Why:** These leads have had connection requests pending 1–2 days. The sooner they accept and receive a DM, the higher the response rate. Delay reduces effectiveness.

**How to apply:** As soon as LI_AT is refreshed and Apify credits are topped up, the next morning briefing run should prioritise checking these 3 connections for acceptance and sending the DM immediately.
