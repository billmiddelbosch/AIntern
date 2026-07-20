---
name: hlia-aanleiding
description: "Vul de paragraaf 'Aanleiding' van een HLIA-document aan via vraag/antwoord met de Business Analist: impact, urgentie, stakeholders, gewenste situatie, oplossingsrichting, kosten en risico's. Herbruikbaar over meerdere iteraties. Zie product/hlia/README.md voor de bestandsconventie."
---

Vul de paragraaf **"Aanleiding"** van het HLIA-document aan — de kernsectie
met open vragen over de achtergrond van de aanvraag.

$ARGUMENTS

## Gebruik

```
/hlia-aanleiding <aanvraag-slug>
```

Zonder slug: vraag de BA voor welke aanvraag dit is.

## Stap 1 — meest recente versie ophalen

Zoals in `product/hlia/README.md` beschreven: gebruik een net geüploade
`.docx` als die er is, anders het bestaande werkbestand op
`product/hlia/<slug>/HLIA.docx`, anders eerst om upload vragen.

## Stap 2 — huidige stand tonen

Laat per vraag zien of er al tekst staat, of dat deze nog open staat. De
"Aanleiding"-paragraaf is een lijst van open vragen (geen dropdowns):

1. Wat is de impact (op functies/afdelingen)?
2. Hoe vaak komt het voor?
3. Wat is de urgentie van de aanvraag?
4. Wat zijn de functionele eisen voor een oplossing?
5. Wie zijn de stakeholders (zorgverleners, eindgebruikers, systeemeigenaren,
   functioneel beheer, intern/extern)?
6. Welke taken/rol hebben zij hierin?
7. Wat is de gewenste situatie?
8. Welke mogelijke oplossingen zijn er?
9. Is er een leveranciersselectie nodig?
10. Wat is de gewenste (technische) oplossing? Beschrijf de oplossing.
11. Betreft het een nieuwe (web)applicatie? (zo ja: is een (web)applicatiescan
    nodig, en zijn er aandachtspunten?)
12. Past het binnen de wettelijke kaders?
13. Welke kosten brengt het met zich mee (eenmalig en structureel)?
14. Moeten er koppelingen worden afgenomen?
15. Is er een afhankelijkheid van andere projecten binnen of buiten IZT?
16. Zijn er landelijk of regionaal andere standaardoplossingen beschikbaar?
17. Welke risico's zijn er bij niet-oplossen?

## Stap 3 — vragen aan de Business Analist

Loop de bovenstaande lijst door en stel **alleen** de vragen die nog leeg
zijn of die de BA wil herzien. Wijs de BA er bij vraag 4 en 7 expliciet op
dat het template adviseert om het proces/de gewenste situatie **visueel** te
maken (bv. een Visio- of stroomdiagram) — vraag of er al zo'n diagram bestaat
en, zo ja, waar het te vinden is (bestandsnaam/pad om te vermelden in de
toelichting; een diagram zelf wordt niet in het document ingevoegd door dit
command). Bij vraag 5/6: vraag om concrete namen/rollen, niet alleen
categorieën. Bij vraag 13: vraag expliciet naar het onderscheid eenmalig vs.
structureel.

Wacht op de antwoorden voordat je verdergaat. Laat de BA per vraag ook
"n.v.t." kunnen aangeven in plaats van tekst.

## Stap 4 — document bijwerken

1. `unzip -q product/hlia/<slug>/HLIA.docx -d unpacked/`
2. `find unpacked -type l -delete`
3. `python <pad-naar-docx-skill>/scripts/merge_runs.py unpacked/`
4. Pas `unpacked/word/document.xml` aan: vind elke vraagregel in de
   "Aanleiding"-paragraaf op zijn letterlijke teksten (zie lijst hierboven) en
   voeg het antwoord toe direct na de vraag (of in de daarvoor bedoelde lege
   run/cel, afhankelijk van hoe het huidige template die vraag structureert).
5. `(cd unpacked && rm -f ../HLIA.docx && zip -Xr ../HLIA.docx .)`
6. `python <pad-naar-docx-skill>/scripts/office/validate.py HLIA.docx --auto-repair`
7. Terugzetten als `product/hlia/<slug>/HLIA.docx`.

## Stap 5 — afronden

- Regel toevoegen aan `product/hlia/<slug>/CHANGELOG.md` met welke vragen deze
  iteratie zijn beantwoord.
- Meld welke van de 17 vragen nog open staan.
- Stel voor om verder te gaan met `/hlia-technisch`, of dit command opnieuw te
  draaien zodra de BA meer antwoorden heeft (bv. na overleg met stakeholders).
- Niet automatisch committen.

## Toekomstige uitbreiding

Geen Jira/Confluence-koppeling: gerelateerde meldingen, eerdere impact-analyses
of bestaande procesdiagrammen moet de BA nu zelf opzoeken en samenvatten. Een
toekomstige koppeling zou gelinkte Jira-issues en Confluence-paginas kunnen
voorstellen als mogelijk relevante context bij vraag 15/16.
