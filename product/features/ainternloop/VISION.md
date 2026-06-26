# AInternLoop — Vision
**Herbruikbaar agent-orkestratie- en escalatiesysteem**

**Tags:** infra, orkestratie, agents, leerbaar systeem  
**Priority:** P1  
**Effort:** XL  
**Owner:** CTO (architectuur + implementatie), CEO (governance)  
**Status:** Vision fase — spec volgt  
**Date:** 2026-06-24

---

## Probleemstelling

AIntern bouwt steeds meer agents die autonoom taken uitvoeren. Zonder gedeeld fundament ontstaan drie structurele problemen:

1. **Agents werken als eilanden.** Elke agent heeft eigen statuslogica, eigen error-handling en eigen manier van samenwerken. Dat leidt tot dubbel werk, inconsistenties en moeilijk onderhoud.
2. **Issues verdwijnen in een zwart gat.** Wanneer een agent ergens op vastloopt, is er geen systematisch mechanisme om dat te registreren, op te lossen of te escaleren naar een mens. Acties blijven steken zonder zichtbaarheid.
3. **Agent-instructies zijn statisch en verspreid.** Instructies worden per agent lokaal opgeslagen en leren niet van eerdere fouten of opgeloste issues. Er is geen centrale plek waar het systeem beter van wordt.

---

## Visie

> **AInternLoop is het gedeelde fundament voor alle AIntern-agents: een centraal systeem voor actie-orkestratie, issue-escalatie en leerbaar instructiebeheer — zodat elk nieuw agent-systeem hierop kan bouwen zonder eigen infrastructuur te moeten ontwerpen.**

Het systeem werkt op basis van een gedeelde `actions`-tabel. Agents registreren wat ze doen, signaleren wat ze niet kunnen oplossen, en ontvangen instructies van het systeem — of van een mens. Eén gespecialiseerde agent (LearningAgent) analyseert afgehandelde issues en scherpt de algemene agent-instructies aan. Zo leert het systeem structureel bij.

---

## Kernprincipes

- **Acties zijn de eenheid van werk.** Elke taak — van welk agent-systeem dan ook — wordt als actie geregistreerd, gevolgd en afgesloten.
- **Issues blokkeren, maar verdwijnen niet.** Een actie die vastloopt gaat on-hold met een koppeling naar een issue-entry. Het systeem lost op wat het kan; de rest escaleert naar de mens.
- **Alleen LearningAgent en human mogen agent-instructies aanpassen.** Geen andere agent heeft schrijftoegang tot de `agents`-tabel. Dit borgt de kwaliteit en traceerbaarheid van instructies.
- **Het systeem is agent-agnostisch.** AInternLoop weet niet wat NewsFlow, een toekomstig financieel systeem of een HR-agent doet — het biedt alleen het raamwerk.

---

## Tabellen (DynamoDB)

| Tabel | Inhoud |
|---|---|
| `actions` | actietype, status (type-afhankelijk), bron-agent, doel-agent, supplementaire instructie per actie, issue-referentie (indien on-hold), tijdstempels |
| `issues` | omschrijving, oorzaak, oplossingsaanpak, human-feedback, koppeling naar actie, status |
| `agents` | agent-naam, algemene instructie (versioned), laatste wijziging, gewijzigd door (LearningAgent of human) |

**Status-basispatroon:** `open → in_progress → done | on_hold`  
Exacte statuswaarden per actietype worden bepaald in de spec-fase.

---

## Agents

### IssueResolver
- **Frequentie:** elke 30 minuten
- **Taak:** analyseert open issues in de `issues`-tabel, probeert automatisch op te lossen (bijv. via herformulering van instructie, retry-logica, of aanwijzingen aan de geblokeerde agent), en escaleert naar `aintern/admin/AInternLoop` indien human input vereist
- **Output:** instructies naar geblokeerde agent op basis van human feedback + actietabel; status-updates in issues + actions

### LearningAgent
- **Trigger:** na elke batch van afgehandelde issues of op dagelijkse schedule
- **Taak:** analyseert afgehandelde issues en actie-specifieke instructies, bepaalt welke algemene agent-instructies structureel verbeterd moeten worden, werkt de `agents`-tabel bij
- **Governance:** enige agent met schrijfrecht op `agents`-tabel naast human via admin
- **Output:** verbeterde agent-instructies in `agents`-tabel, log van wijzigingen

---

## Admin (`aintern/admin/AInternLoop`)

Een intern beheerscherm met twee panelen:

**Issues-paneel:**
- Lijst van alle open issues met status, gekoppelde actie en agent
- Human kan per issue feedback geven, die IssueResolver meeneemt in de volgende run
- Human kan een issue handmatig afsluiten of herclassificeren

**Agents-paneel:**
- Lijst van alle geregistreerde agents met naam, huidige instructie en versiehistorie
- Human kan instructies direct bewerken (met dezelfde rechten als LearningAgent)
- Wijzigingen worden opgeslagen met timestamp en auteur (`human` of `LearningAgent`)

---

## Wat buiten scope valt

- Scheduling en timing van agents — dat is verantwoordelijkheid van elk agent-systeem zelf (bijv. EventBridge in NewsFlow)
- De inhoud van acties — AInternLoop kent geen domeinlogica, alleen orkestratie
- Authenticatie van het admin-scherm — valt onder bestaande admin-auth infra
- Real-time notificaties naar human (bijv. push/email bij nieuw issue) — fase 2

---

## Relatie met andere onderdelen

| Onderdeel | Relatie |
|---|---|
| NewsFlow | Eerste systeem dat op AInternLoop draait; definieert actietype `newsflow/content` |
| Admin Dashboard | AInternLoop-admin is een nieuwe tab in het bestaande `/admin`-gedeelte |
| Toekomstige agent-systemen | Kunnen onboarden door eigen actietypes te registreren in de `actions`-tabel |

---

## Risico's en mitigaties

| Risico | Kans | Mitigatie |
|---|---|---|
| LearningAgent past instructies te agressief aan | Middel | Versiehistorie in `agents`-tabel; human kan altijd terugdraaien |
| IssueResolver loopt zelf vast | Laag | IssueResolver logt eigen fouten als issues, maar met een `meta`-flag zodat er geen circulaire afhankelijkheid ontstaat |
| Actions-tabel groeit onbeheersbaar | Middel | TTL op afgehandelde acties (configeerbaar per actietype); archivering naar S3 voor lange termijn |
| Human reageert niet op escalatie | Middel | Actie blijft on-hold; IssueResolver herinnert elke 24u via admin-scherm |
