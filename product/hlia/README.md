# HLIA-invulcommands

Deze map bevat de werkbestanden voor het invullen van het **High-Level Impact
Analyse (HLIA)** Word-template, en documenteert de conventie die de zes
`/hlia-*` slash-commands in `.claude/commands/` gebruiken.

## Wat is de HLIA?

Een Word-template waarmee een IT-verandervraag (Epic/EPD-gerelateerd) wordt
beoordeeld op scope, impact, techniek, compliance en capaciteit, tot een
go/no-go besluit. Het document bestaat uit zes paragrafen:

1. **Algemene informatie aanvraag** — Ultimo/Jira-links, status, data, leads, PO
2. **Beschrijving** — HLIA-vraag, scope, categorie/programma, informatietafel
3. **Aanleiding** — ~16 open vragen over impact, stakeholders, oplossing, kosten, risico's
4. **Technisch ontwerp & compliance** — TO/NO/TA/DPIA/BIA/PRI
5. **Advies** — sizing, capaciteit, ureninschatting, go/no-go van PO/Techlead/beheer
6. **Bijlage: rollen en thema's** — Epic-lead/Tech Lead/BA per Epic-module

Voor elke paragraaf bestaat een eigen command: `/hlia-algemeen`,
`/hlia-beschrijving`, `/hlia-aanleiding`, `/hlia-technisch`, `/hlia-advies`,
`/hlia-rollen`.

## Werkbestand-conventie

Elke aanvraag krijgt een eigen map, geïdentificeerd met een kebab-case slug
(bijv. de titel van de aanvraag):

```
product/hlia/<aanvraag-slug>/
  HLIA.docx        # meest recente versie — wordt overschreven per iteratie
  CHANGELOG.md      # log per iteratie: datum, paragraaf, command, samenvatting
```

Git is de versiegeschiedenis: elke keer dat een command het document bijwerkt,
overschrijft het `HLIA.docx` op dezelfde plek. Wie de tussentijdse versies wil
terugzien gebruikt `git log -p -- product/hlia/<slug>/HLIA.docx`. Commit pas
wanneer de BA of gebruiker daar expliciet om vraagt — de commands committen
niet automatisch.

## Hoe een command met "de meest recente versie" omgaat

Elk `/hlia-*` command begint met dezelfde stap:

- Is er in dit gesprek net een `.docx` geüpload? → dat is de meest recente
  versie. Kopieer 'm naar `product/hlia/<slug>/HLIA.docx` (nieuwe aanvraag:
  map aanmaken; bestaande aanvraag: overschrijven) en meld dit expliciet.
- Geen nieuwe upload, maar het bestand bestaat al op die plek? → gebruik die
  versie, en meld welke datum/iteratie dat is (uit CHANGELOG.md), met het
  verzoek om een nieuwere versie te uploaden als de BA die heeft.
- Geen upload én geen bestaand bestand? → vraag de BA om de meest recente
  versie (of het lege HLIA-template) te uploaden voordat het command verder gaat.

Na het verwerken van de antwoorden schrijft het command de bijgewerkte
`HLIA.docx` terug op dezelfde plek en voegt een regel toe aan
`CHANGELOG.md`.

## Iteratief gebruik

Elk command is idempotent te gebruiken: het laat eerst zien wat er al is
ingevuld voor die paragraaf, vraagt alleen door op nog lege/placeholder-velden
("Kies een item.", "[korte motivatie]", "[Go/no go]", lege cellen), en laat de
BA expliciet aangeven welk veld hij/zij wil herzien. Zo kun je hetzelfde
command meerdere keren draaien totdat de paragraaf klopt, en pas daarna naar
het volgende paragraaf-command gaan.

## Technische update-methode

De commands bewerken het document met de bestaande `docx`-skill-conventie:
unzip → `merge_runs.py` → tekst/content-control aanpassen in
`word/document.xml` → rezip → `scripts/office/validate.py --auto-repair`.
Dropdownvelden in het template zijn Word content controls (`w:sdt`); deze
worden herkend via hun `w:tag`-waarde (`Status`, `Categorie`, `Programma`,
`Tafel`, `Ja/NEE`, `Go/NOGO`) en de bijbehorende `w:listItem`-opties.

## Toekomstige uitbreiding: Jira & Confluence

Vooralsnog zijn er **geen koppelingen** met Jira of Confluence. Links,
status, en toelichtingen worden door de BA zelf aangeleverd tijdens de
vraag/antwoord-flow. Zodra een Jira/Confluence-integratie beschikbaar komt,
kunnen met name deze commands daarvan profiteren:

- `/hlia-algemeen` — Jira-issue-status, -link en betrokken leads automatisch ophalen i.p.v. handmatig te vragen
- `/hlia-technisch` — bestaande TO/NO/TA/DPIA/BIA/PRI-documenten op Confluence herkennen en linken i.p.v. los na te vragen
- `/hlia-advies` — sizing/capaciteit-schattingen vergelijken met vergelijkbare afgeronde Jira-epics

Dit is bewust nog niet gebouwd; de commands stellen de vragen nu gewoon
rechtstreeks aan de BA.
