---
name: hlia-rollen
description: "Vul de bijlage 'Rollen en thema's binnen IZT' van een HLIA-document aan via vraag/antwoord met de Business Analist: Epic-lead, Tech Lead en BA per Epic-module. Herbruikbaar over meerdere iteraties. Zie product/hlia/README.md voor de bestandsconventie."
---

Vul de bijlage **"Rollen en thema's binnen IZT"** van het HLIA-document aan
(de tabel met Epic-modules aan het eind van het document).

$ARGUMENTS

## Gebruik

```
/hlia-rollen <aanvraag-slug>
```

Zonder slug: vraag de BA voor welke aanvraag dit is.

## Stap 1 — meest recente versie ophalen

Zoals in `product/hlia/README.md`: net geüploade `.docx` gebruiken, anders het
bestaande werkbestand op `product/hlia/<slug>/HLIA.docx`, anders eerst om
upload vragen.

## Stap 2 — huidige stand tonen

De tabel heeft drie kolommen (Epic / Tech Lead Epic / Business Informatie
Analist) en één rij per Epic-module:

Anesthesia, Ambulatory, ASAP, Beacon, Bridges, Cadence, Carelink,
Care Everywhere, Data Courier, DBC, Grand Central, Haiku Canto,
Identity (en ROI), Inpatient, Kaleidoscope, Mychart, Optime, Orders,
Radiant, Research, Stork, Training, User & Security, Willow.

Toon eerst welke van deze modules relevant zijn voor de huidige aanvraag
(vaak niet allemaal) en welke rijen al ingevuld zijn.

## Stap 3 — vragen aan de Business Analist

Deze bijlage is een naslagtabel, niet aanvraag-specifieke inhoud — vraag
daarom eerst:

1. Welke Epic-module(s) zijn relevant voor deze aanvraag? (kan meerdere zijn)

Voor elke relevante, nog-lege of verouderde rij:

2. Wie is momenteel de Epic-lead voor deze module?
3. Wie is de Tech Lead voor deze module?
4. Wie is de Business Informatie Analist voor deze module?

Wijs de BA erop dat deze lijst snel verouderd kan raken door
personeelswisselingen — vraag expliciet of de bestaande namen (indien
ingevuld) nog kloppen, en corrigeer zo nodig in plaats van alleen aan te
vullen.

## Stap 4 — document bijwerken

1. `unzip -q product/hlia/<slug>/HLIA.docx -d unpacked/`
2. `find unpacked -type l -delete`
3. `python <pad-naar-docx-skill>/scripts/merge_runs.py unpacked/`
4. Pas `unpacked/word/document.xml` aan: vind de rij voor elke genoemde
   Epic-module (letterlijke tekst, bv. "Radiant") en vul/corrigeer de cellen
   voor Epic-lead, Tech Lead en BA.
5. `(cd unpacked && rm -f ../HLIA.docx && zip -Xr ../HLIA.docx .)`
6. `python <pad-naar-docx-skill>/scripts/office/validate.py HLIA.docx --auto-repair`
7. Terugzetten als `product/hlia/<slug>/HLIA.docx`.

## Stap 5 — afronden

- Regel toevoegen aan `product/hlia/<slug>/CHANGELOG.md`.
- Meld welke modules zijn bijgewerkt en welke nog open staan.
- Dit is doorgaans het laatste paragraaf-command in de reeks; stel voor om
  het hele document nog eens door te lopen op openstaande punten uit de
  eerdere commands (`/hlia-algemeen`, `/hlia-beschrijving`,
  `/hlia-aanleiding`, `/hlia-technisch`, `/hlia-advies`) voordat het document
  als definitief wordt beschouwd.
- Niet automatisch committen.

## Toekomstige uitbreiding

Geen Confluence-koppeling: de actuele rolverdeling per Epic-module moet de BA
nu zelf navragen. Een toekomstige koppeling zou deze tabel kunnen
synchroniseren met een teamoverzicht op Confluence in plaats van dat de BA
dit handmatig actueel houdt.
