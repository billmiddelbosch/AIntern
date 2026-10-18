---
name: hlia-technisch
description: "Vul de technisch/compliance-paragraaf van een HLIA-document aan via vraag/antwoord met de Business Analist: TO, NO, TA, DPIA, BIA en PRI (nodig ja/nee + toelichting). Herbruikbaar over meerdere iteraties. Zie product/hlia/README.md voor de bestandsconventie."
---

Vul de paragraaf **"Technisch ontwerp & compliance"** van het HLIA-document
aan (het blok met TO / NO / TA / DPIA / BIA / PRI, direct na "Aanleiding").

$ARGUMENTS

## Gebruik

```
/hlia-technisch <aanvraag-slug>
```

Zonder slug: vraag de BA voor welke aanvraag dit is.

## Stap 1 — meest recente versie ophalen

Zoals in `product/hlia/README.md`: net geüploade `.docx` gebruiken, anders het
bestaande werkbestand op `product/hlia/<slug>/HLIA.docx`, anders eerst om
upload vragen.

## Stap 2 — huidige stand tonen

Zes rijen, elk met dropdown "Ja/Nee" (content control, tag `Ja/NEE`, opties
`JA`/`NEE`) en een vrij tekstveld "Toelichting":

| Onderdeel | Betekenis |
|---|---|
| Technisch ontwerp (TO) | is een TO nodig? |
| Netwerk ontwerp (NO) | is een NO nodig? |
| Technische architectuurplaat (TA) | is een TA nodig? |
| DPIA (data privacy informatie analyse) | is een DPIA nodig? |
| BIA (business informatie analyse) | is een BIA nodig? |
| PRI (Prospectieve Risico-Inventarisatie) | is een PRI nodig? |

Toon per rij of "Ja/Nee" en "Toelichting" al zijn ingevuld.

## Stap 3 — vragen aan de Business Analist

Deze paragraaf vult de BA meestal niet volledig zelfstandig in — wijs hier
expliciet op en vraag de BA of de inschatting al is afgestemd met de
architect (TO/NO/TA) en de privacybeschikbare functionaris (DPIA). Stel per
nog-open rij:

1. Is een {TO/NO/TA/DPIA/BIA/PRI} nodig voor deze aanvraag? (Ja/Nee)
2. Zo ja: geef een korte toelichting (wat wordt erin uitgewerkt, en door wie).
   Zo nee: geef aan waarom niet (bv. "valt al onder bestaande architectuur").

Sla nooit een "Ja" over zonder toelichting — vraag door als die ontbreekt.
Wacht op de antwoorden voordat je verdergaat.

## Stap 4 — document bijwerken

1. `unzip -q product/hlia/<slug>/HLIA.docx -d unpacked/`
2. `find unpacked -type l -delete`
3. `python <pad-naar-docx-skill>/scripts/merge_runs.py unpacked/`
4. Pas `unpacked/word/document.xml` aan: voor elke rij het juiste
   `<w:sdt>`-blok vinden op basis van de voorafgaande labeltekst (bv.
   "Technisch ontwerp (TO)") en de bijbehorende content control met
   `w:tag w:val="Ja/NEE"`; vervang de zichtbare tekst in `<w:sdtContent>` door
   `JA` of `NEE`, en vul de aparte "Toelichting"-cel met de vrije tekst.
5. `(cd unpacked && rm -f ../HLIA.docx && zip -Xr ../HLIA.docx .)`
6. `python <pad-naar-docx-skill>/scripts/office/validate.py HLIA.docx --auto-repair`
7. Terugzetten als `product/hlia/<slug>/HLIA.docx`.

## Stap 5 — afronden

- Regel toevoegen aan `product/hlia/<slug>/CHANGELOG.md`.
- Meld welke van de zes onderdelen nog open staan of nog afstemming met
  architect/privacy nodig hebben.
- Stel voor om verder te gaan met `/hlia-advies`.
- Niet automatisch committen.

## Toekomstige uitbreiding

Geen Confluence-koppeling: bestaande TO/NO/TA/DPIA-documenten moet de BA nu
zelf opzoeken en linken in de toelichting. Een toekomstige koppeling zou
kunnen zoeken naar bestaande documenten op Confluence voor dezelfde
epic/module en die voorstellen in plaats van de BA blanco te laten beginnen.
