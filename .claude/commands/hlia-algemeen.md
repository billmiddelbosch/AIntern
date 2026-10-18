---
name: hlia-algemeen
description: "Vul de paragraaf 'Algemene informatie aanvraag' van een HLIA-document aan via vraag/antwoord met de Business Analist: Ultimo/Jira-links, status, data, betrokken leads en Product Owner. Herbruikbaar over meerdere iteraties. Zie product/hlia/README.md voor de bestandsconventie."
---

Vul de paragraaf **"Algemene informatie aanvraag"** van het HLIA-document aan.

$ARGUMENTS

## Gebruik

```
/hlia-algemeen <aanvraag-slug>
```

Zonder slug: vraag de BA naar de titel van de aanvraag en leid er een
kebab-case slug van af (bijv. "Nieuwe koppeling Radiant" → `nieuwe-koppeling-radiant`).

## Stap 1 — meest recente versie ophalen

Volg de conventie uit `product/hlia/README.md`:
1. Net een `.docx` geüpload in dit gesprek? → dat is de meest recente versie.
   Zet 'm neer op `product/hlia/<slug>/HLIA.docx` (map aanmaken indien nieuw).
2. Geen upload, maar bestand bestaat al? → gebruik die versie, meld de laatste
   wijzigingsdatum uit `product/hlia/<slug>/CHANGELOG.md`, en vraag of er een
   nieuwere versie is om te uploaden.
3. Geen upload en geen bestaand bestand? → vraag de BA eerst om het
   (lege) HLIA-template te uploaden voordat je verdergaat.

## Stap 2 — huidige stand tonen

Unzip het werkbestand en lees `word/document.xml` (gebruik `merge_runs.py`
uit de `docx`-skill om runs samen te voegen voor leesbare tekst). Laat de BA
kort zien wat er in deze paragraaf al is ingevuld en wat nog leeg is, voor
deze velden (tabel bovenaan het document, direct onder de titel):

| Veld | Huidige waarde tonen |
|---|---|
| Link naar Ultimo | ja/leeg |
| Link naar Jira | ja/leeg |
| Status (dropdown: Nog te starten / Loopt / Afgerond) | ja/leeg |
| Startdatum HLIA | ja/leeg |
| (Verwachte) einddatum | ja/leeg |
| Betrokken leads | ja/leeg |
| Product Owner | ja/leeg |

## Stap 3 — vragen aan de Business Analist

Stel **alleen** de vragen voor velden die nog leeg zijn, of die de BA expliciet
wil herzien:

1. Wat is de link naar het Ultimo-ticket van deze aanvraag?
2. Wat is de link naar de bijbehorende Jira-issue?
3. Wat is de huidige status: Nog te starten, Loopt, of Afgerond?
4. Wat is de startdatum van deze HLIA?
5. Wat is de (verwachte) einddatum?
6. Wie zijn de betrokken leads (naam + rol)?
7. Wie is de Product Owner van deze aanvraag?

Wacht op de antwoorden van de BA voordat je verdergaat. Als de BA een vraag
overslaat, laat het veld leeg en meld dit expliciet als open punt aan het eind.

## Stap 4 — document bijwerken

1. `unzip -q product/hlia/<slug>/HLIA.docx -d unpacked/` (tijdelijke werkmap)
2. `find unpacked -type l -delete`
3. `python <pad-naar-docx-skill>/scripts/merge_runs.py unpacked/`
4. Pas `unpacked/word/document.xml` aan:
   - Vrije tekstvelden: vervang de lege `<w:t>` na het label (bijv. na
     "Link naar Ultimo") door de tekst van de BA.
   - Status-dropdown: content control met `<w:tag w:val="Status"/>` — vervang
     de zichtbare tekst in `<w:sdtContent>` door de gekozen waarde
     (`Nog te starten` / `Loopt` / `Afgerond`).
5. `(cd unpacked && rm -f ../HLIA.docx && zip -Xr ../HLIA.docx .)`
6. `python <pad-naar-docx-skill>/scripts/office/validate.py HLIA.docx --auto-repair`
7. Verplaats het resultaat terug naar `product/hlia/<slug>/HLIA.docx`.

## Stap 5 — afronden

- Voeg een regel toe aan `product/hlia/<slug>/CHANGELOG.md`:
  `- <datum> — /hlia-algemeen — <korte samenvatting van wat is ingevuld>`
- Meld aan de BA: welke velden zijn ingevuld, welke nog open staan, en dat dit
  command opnieuw gedraaid kan worden om openstaande of te herziene velden
  verder aan te vullen.
- Stel voor om verder te gaan met `/hlia-beschrijving`.
- Commit de wijziging **niet** automatisch — alleen als de BA of gebruiker
  daar expliciet om vraagt.

## Toekomstige uitbreiding

Vooralsnog geen Jira-koppeling: de BA levert link en status handmatig aan.
Zodra een Jira-integratie beschikbaar is, kan dit command de issue-status,
-link en toegewezen leads automatisch ophalen in plaats van ernaar te vragen.
