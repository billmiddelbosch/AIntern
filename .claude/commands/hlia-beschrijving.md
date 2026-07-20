---
name: hlia-beschrijving
description: "Vul de paragraaf 'Beschrijving' van een HLIA-document aan via vraag/antwoord met de Business Analist: HLIA-vraag, scope, categorie, programma en informatietafel. Herbruikbaar over meerdere iteraties. Zie product/hlia/README.md voor de bestandsconventie."
---

Vul de paragraaf **"Beschrijving"** van het HLIA-document aan.

$ARGUMENTS

## Gebruik

```
/hlia-beschrijving <aanvraag-slug>
```

Zonder slug: vraag de BA voor welke aanvraag (slug of titel) dit is.

## Stap 1 — meest recente versie ophalen

Zelfde procedure als in `product/hlia/README.md`:
1. Net geüpload in dit gesprek? → gebruik dat bestand, zet neer op
   `product/hlia/<slug>/HLIA.docx`.
2. Al een werkbestand aanwezig? → gebruik dat, meld de laatste wijzigingsdatum
   uit `CHANGELOG.md`, vraag of er een nieuwere versie is.
3. Niets aanwezig? → vraag eerst om upload van het HLIA-template.

## Stap 2 — huidige stand tonen

Toon wat er al staat voor deze velden (tabel "Beschrijving", direct onder
"Algemene informatie aanvraag"):

| Veld | Bijzonderheid |
|---|---|
| Welke vraag wil je met de HLIA beantwoorden? | vrije tekst |
| Zijn er dingen die expliciet binnen of buiten scope vallen? | vrije tekst |
| Categorie | dropdown (content control, tag `Categorie`) |
| Programma | dropdown (content control, tag `Programma`) |
| Informatietafel | dropdown (content control, tag `Tafel`) |

Dropdown-opties zoals aangetroffen in het template (controleer bij het
inlezen of dit nog klopt, het template kan wijzigen):
- **Categorie**: Must have / SG breed programma / Overige lijn / Passende zorg /
  Passend personeel / Passende bedrijfsvoering / Passende vastgoedkeuzes /
  Niet van toepassing
- **Programma**: EPD / Data / Medische ondersteuning / Bedrijfsvoering /
  IZT projecten / Passende zorg / Passend personeel / Passende bedrijfsvoering /
  Passende vastgoedkeuzes / Niet van toepassing
- **Informatietafel**: EPD / Data / Medische ondersteuning / Bedrijfsvoering /
  IZT projecten / Niet van toepassing

## Stap 3 — vragen aan de Business Analist

Stel alleen de vragen voor nog lege of te herziene velden:

1. Welke vraag wil je met deze HLIA beantwoorden? (één scherpe kernvraag)
2. Zijn er dingen die expliciet **wel** of **niet** in scope vallen?
3. Welke categorie is van toepassing? (kies uit de lijst hierboven, of vraag
   de BA welke waarde het dichtst in de buurt komt als de lijst is gewijzigd)
4. Welk programma hoort hierbij?
5. Welke informatietafel hoort hierbij (of "Niet van toepassing")?

Wacht op de antwoorden voordat je verdergaat.

## Stap 4 — document bijwerken

1. `unzip -q product/hlia/<slug>/HLIA.docx -d unpacked/`
2. `find unpacked -type l -delete`
3. `python <pad-naar-docx-skill>/scripts/merge_runs.py unpacked/`
4. Pas `unpacked/word/document.xml` aan:
   - Vrije tekstvelden (HLIA-vraag, scope): tekst invullen in de lege `<w:t>`
     na het betreffende label.
   - Dropdowns: zoek de content control op `w:tag` (`Categorie`, `Programma`,
     `Tafel`) en vervang de zichtbare tekst in `<w:sdtContent>` door de
     gekozen `w:listItem`-waarde.
5. `(cd unpacked && rm -f ../HLIA.docx && zip -Xr ../HLIA.docx .)`
6. `python <pad-naar-docx-skill>/scripts/office/validate.py HLIA.docx --auto-repair`
7. Terugzetten als `product/hlia/<slug>/HLIA.docx`.

## Stap 5 — afronden

- Regel toevoegen aan `product/hlia/<slug>/CHANGELOG.md`.
- Meld welke velden zijn ingevuld/nog open staan; command kan opnieuw gedraaid
  worden om te verfijnen.
- Stel voor om verder te gaan met `/hlia-aanleiding`.
- Niet automatisch committen.

## Toekomstige uitbreiding

Geen koppeling met Confluence: als de scope-afbakening al ergens is
gedocumenteerd (bijv. in een projectplan), moet de BA dit nu zelf samenvatten.
Een toekomstige Confluence-koppeling zou relevante paginas kunnen voorstellen
op basis van de HLIA-vraag.
