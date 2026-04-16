---
name: weekly-report
description: |
  Generates the AIntern weekly internal report (O-01) for the CEO.
  Trigger when user says: genereer weekrapport, weekly report aanmaken,
  maak rapport voor week [N], or run O-01. Reads outreach-log.csv,
  product/backlog.md, agent memory, Kennisbank published folder and
  LinkedIn post history from backlog, then writes a filled .md to the
  Obsidian vault at AIntern Meeting Minutes/weekrapport-{YYYY-WNN}.md.
---

# Skill: weekly-report (O-01 v1 -- manual trigger)

## Doel
Genereer een wekelijks intern Markdown-rapport voor de CEO op basis van
live data uit de lokale bronnen. Geen handmatige invoer nodig -- alleen het
ISO-weeknummer is vereist als parameter (default = huidige ISO-week).

## Gebruik
Run via slash command: /weekly-report
With week argument: /weekly-report W16 or /weekly-report 2026-W16

---

## Uitvoer-pad (altijd)
C:/Users/bmidd/OneDrive/Documents/Obsidian Vault/Bill/Aintern Meeting Minutes/weekrapport-{YYYY-WNN}.md

Bestandsnaam-formaat: weekrapport-2026-W16.md (ISO jaar + weeknummer).

---

## Stappen

### Stap 1 -- Lead Pipeline (product/marketing/leads/outreach-log.csv)
- Lees het CSV-bestand en tel rijen per status-kolom waarde
- Delta deze week = rijen waarbij connection_sent_at of dm_sent_at valt in de doelweek (ISO)
- Conversieratio = responded / dm_sent x 100
- Alert als geen nieuwe outreach deze week en er open leads zijn

### Stap 2 -- Backlog Status (product/backlog.md)
- Shipped deze week = B-items met done en datum in de doelweek (Success Metric kolom)
- In progress = items met expliciete in-progress indicator
- Tel alle items: done (strikethrough), todo/open, gecancelled
- Highlight geblokkeerde items

### Stap 3 -- Blockers (agent memory + backlog)
- Scan C:/Users/bmidd/.claude/projects/C--Users-bmidd-AIntern/memory/*.md
  op de woorden: blocker, blocked, risico, escalatie, uitgeput
- Scan product/backlog.md op geblokkeerd
- Per gevonden blocker: schrijf 1 samenvattende zin + bronbestand

### Stap 4 -- Kennisbank
- Tel .md-bestanden in product/kennisbank/published/ (lokale kopieeen)
- Tel B-items in backlog met Kennisbank artikel done in Q2 voor totaal
- Alert als artikels/week < 2 (CPO weekly KPI target is 2/week)

### Stap 5 -- LinkedIn
- Tel B-items met LinkedIn post done in doelweek voor wekelijkse count
- Q2-totaal = alle LinkedIn posts done met datum >= 2026-04-01
- Connecties = outreach-log.csv rijen met connection_sent_at in doelweek
- Alert als posts < 3 deze week (OKR 2.1 cadans)

### Stap 6 -- KPI Actueel
- Vergelijk gevonden waarden met targets uit memory project_okrs_q2_2026.md
- Probeer A-14 API: GET /admin/kpi/actuals?week={isoWeek} -- bij 401 actuals afleiden
- Status per KPI: on track / achter / gemist

### Stap 7 -- OKR Voortgang
- Schrijf Q2 OKR tabel met percentage t.o.v. target op basis van stap 1-6

### Stap 8 -- Rapport schrijven
- Vul template placeholders in op basis van stap 1-7
- Schrijf naar Obsidian vault pad (zie boven)
- Bevestig met: Weekrapport {YYYY-WNN} geschreven naar [volledig pad]

---

## Beperkingen v1
- KPI actuals via A-14 API vereist JWT -- bij 401 worden actuals afgeleid uit backlog/log
- LinkedIn post count gebaseerd op backlog (geen directe LinkedIn API koppeling)
- Google Analytics data niet beschikbaar in skill context
- Geen auto-send van e-mail -- draft only als --email flag meegegeven

## v2 (gepland)
- Scheduled trigger: maandag 07:00 CET via CronCreate
- Gmail draft aanmaken via --email flag
- S3 Kennisbank article count via A-13 endpoint
