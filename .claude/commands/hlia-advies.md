---
name: hlia-advies
description: "Vul de paragraaf 'Advies' van een HLIA-document aan via vraag/antwoord met de Business Analist: sizing, capaciteit, ureninschatting en go/no-go van Product Owner, Techlead en beheer. Herbruikbaar over meerdere iteraties. Zie product/hlia/README.md voor de bestandsconventie."
---

Vul de paragraaf **"Advies"** van het HLIA-document aan (sizing, capaciteit en
de go/no-go-besluiten).

$ARGUMENTS

## Gebruik

```
/hlia-advies <aanvraag-slug>
```

Zonder slug: vraag de BA voor welke aanvraag dit is.

## Belangrijk: dit is geen paragraaf die de BA alleen invult

Deze paragraaf bevat besluiten van meerdere rollen (Product Owner/Teamleider/
Projectleider, Techlead, Verantwoordelijke beheer, Hoofd Zorgadministratie).
De BA vult dit command in als **doorgeefluik**: de vragen hieronder gaan over
wat de BA heeft opgehaald bij die rollen, niet over de eigen mening van de BA.
Vraag expliciet of de betreffende motivatie/beslissing al is afgestemd voordat
je een "Go" of "No go" vastlegt.

## Stap 1 — meest recente versie ophalen

Zoals in `product/hlia/README.md`: net geüploade `.docx` gebruiken, anders het
bestaande werkbestand op `product/hlia/<slug>/HLIA.docx`, anders eerst om
upload vragen.

## Stap 2 — huidige stand tonen

| Onderdeel | Bijzonderheid |
|---|---|
| Product Owner / Teamleider / Projectleider — advies | vrije tekst |
| Techlead — advies | vrije tekst |
| Wenselijk om aanvraag te splitsen? (+ expertises/teams/ureninschatting) | dropdown Ja/Nee + vrije tekst |
| Externe kennis nodig? (+ toelichting) | dropdown Ja/Nee + vrije tekst |
| Impact op beheer: nieuwe SLA/DAP nodig? | vrije tekst |
| Impact op beheer: afgestemd met architect, valt binnen architectuurprincipes? | vrije tekst |
| Categorie (sizing: XS / M / XL) | tabelkeuze |
| Aantal weken tot MVP (1-4 / 8-12 / …) | tabelkeuze |
| Capaciteit (<50 / 250-500 / >2000) | tabelkeuze |
| Product Owner: motivatie + Go/No go | dropdown Go/NOGO + vrije tekst |
| Verantwoordelijke beheer: motivatie | vrije tekst |
| In geval van impact op bedrijfsvoering SG: motivatie + Go/No go | dropdown Go/NOGO + vrije tekst |
| Hoofd Zorgadministratie: Go/No go | dropdown Go/NOGO |

Toon welke van deze al zijn ingevuld.

## Stap 3 — vragen aan de Business Analist

Stel alleen de vragen voor nog-open onderdelen:

1. Wat is het advies van de Product Owner/Teamleider/Projectleider?
2. Wat is het advies van de Techlead?
3. Is het wenselijk om de aanvraag te splitsen? Zo ja: waarom, en moet het in
   fases of parallel? Welke expertises/teams zijn nodig, incl. ureninschatting?
4. Is externe kennis nodig? Zo ja: waarom en welke kennis? Zo nee: korte
   toelichting waarom niet.
5. Is een nieuwe SLA/DAP nodig?
6. Is de oplossing afgestemd met de architect, en valt het binnen de
   architectuurprincipes? Zo nee: waarom niet?
7. Welke categorie-sizing heeft de Techlead gegeven: XS, M of XL?
8. Hoeveel weken zijn nodig tot MVP?
9. Wat is de verwachte capaciteit (aantal gebruikers): <50, 250-500, of >2000?
10. Wat is de motivatie en het Go/No go van de Product Owner?
11. Wat is de motivatie van de verantwoordelijke beheer?
12. Bij impact op bedrijfsvoering SG: wat is de motivatie en het Go/No go?
13. Wat is het Go/No go van het Hoofd Zorgadministratie?

Wacht op de antwoorden. Als een besluit nog niet is genomen (bv. Techlead
heeft nog niet gereageerd), laat het veld leeg en meld dit als openstaand
actiepunt in plaats van een aanname in te vullen.

## Stap 4 — document bijwerken

1. `unzip -q product/hlia/<slug>/HLIA.docx -d unpacked/`
2. `find unpacked -type l -delete`
3. `python <pad-naar-docx-skill>/scripts/merge_runs.py unpacked/`
4. Pas `unpacked/word/document.xml` aan:
   - Vrije tekstvelden en placeholders (`[korte motivatie]`) vervangen door de
     aangeleverde tekst.
   - Ja/Nee-dropdowns (`w:tag w:val="Ja/NEE"`) en Go/NoGo-dropdowns
     (`w:tag w:val="Go/NOGO"`) invullen door de zichtbare tekst in
     `<w:sdtContent>` te vervangen door de gekozen waarde.
   - Sizingtabel (Categorie/weken/capaciteit): markeer of vul de gekozen
     kolomwaarde volgens hoe die rij in het huidige document is opgebouwd.
5. `(cd unpacked && rm -f ../HLIA.docx && zip -Xr ../HLIA.docx .)`
6. `python <pad-naar-docx-skill>/scripts/office/validate.py HLIA.docx --auto-repair`
7. Terugzetten als `product/hlia/<slug>/HLIA.docx`.

## Stap 5 — afronden

- Regel toevoegen aan `product/hlia/<slug>/CHANGELOG.md`.
- Meld duidelijk welke go/no-go-besluiten nog ontbreken en van wie de BA die
  nog moet ophalen.
- Stel voor om verder te gaan met `/hlia-rollen`, of dit command later
  opnieuw te draaien zodra de ontbrekende besluiten binnen zijn.
- Niet automatisch committen.

## Toekomstige uitbreiding

Geen Jira-koppeling: vergelijkbare, eerder afgeronde epics/aanvragen (voor
sizing-referentie) moet de BA nu zelf opzoeken. Een toekomstige koppeling zou
vergelijkbare Jira-epics met hun daadwerkelijke doorlooptijd kunnen tonen als
referentie bij de sizing-vraag.
