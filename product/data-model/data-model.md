# Data Model

## Entities 

### Problem
Een MKB-pijnpunt dat AIntern adresseert, met een bijbehorende AI-oplossing. Vormt de basis van de "Problemen & Oplossingen" sectie.

### Step
Eén stap in het "Hoe werkt het?"-proces. Heeft een vaste volgorde, een titel en een korte beschrijving van wat er in die stap gebeurt.

### Case
Een concreet klantresultaat dat aantoont wat AI-inzet oplevert. Bevat de sector, het oorspronkelijke pijnpunt, de AI-aanpak van AIntern en het meetbare resultaat.

### FAQ
Een vraag-antwoord paar dat bezwaren of onduidelijkheden wegneemt. Hoort bij een specifiek thema: no-cure-no-pay of AI voor het MKB in het algemeen.

### IntakeSubmission
Een ingestuurde intake-vragenlijst van een bezoeker. Opgeslagen in DynamoDB (`aintern-intake-submissions-{env}`).

| Veld                 | Type   | Beschrijving                        |
|----------------------|--------|-------------------------------------|
| `submissionId`       | String | Partition key (UUID)                |
| `email`              | String | E-mailadres van bezoeker (GSI PK)   |
| `submittedAt`        | String | ISO-8601 timestamp (GSI sort key)   |
| `companySize`        | String | xs / s / m / l                      |
| `processDescription` | String | Vrije tekst                         |
| `processDuration`    | String | xs / s / m / l                      |
| `triedBefore`        | String | yes / no / partial                  |
| `impact`             | String | Vrije tekst                         |

### ContactRequest
De gegevens die een bezoeker achterlaat bij het aanvragen van een gratis kennismaking. Wordt verwerkt als lead voor opvolging door AIntern.

## Relationships

- Case verwijst naar een Problem (de case lost een specifiek pijnpunt op)
- Step heeft een vaste volgorde binnen de "Hoe werkt het?"-flow
- FAQ behoort tot een thema: no-cure-no-pay of algemeen AI
- ContactRequest staat op zichzelf

---

## AInternLoop Entities

### Action
Een taak die geregistreerd wordt in AInternLoop en door een specifieke Agent afgehandeld moet worden. De centrale eenheid van werk in het systeem. Een Action heeft een type (bijv. `newsflow/content`), een urgentiescore en een status die de voortgang bijhoudt. Acties kunnen aangemaakt worden door Agents onderling, door LearningAgent, of door een Human via de admin.

### Issue
Een blokkade die een Agent rapporteert wanneer hij een Action niet zelfstandig kan afhandelen. Bevat een omschrijving van het probleem, de aanpak van IssueResolver en optioneel feedback van een Human. Een Issue houdt een Action on-hold totdat het opgelost is.

### Agent
Een geregistreerde AI-agent in het systeem, met zijn naam, het systeem waartoe hij behoort, en zijn algemene instructie. De instructie beschrijft hoe de Agent zijn taken uitvoert en wordt bijgehouden als versiehistorie. Alleen LearningAgent of een Human via de admin mogen de instructie aanpassen.

---

## NewsFlow Entities

### LandingPage
Een gepubliceerde SEO-landingspagina op `aintern.nl/nieuws/<slug>`, opgebouwd vanuit een lezersvraag die voortkomt uit actueel Nederlands nieuws. Bevat de URL, traffic-data en een log van alle SEO-optimalisatierondes die erop uitgevoerd zijn.

### OptimizationRound
Één SEO-optimalisatieronde op een bestaande LandingPage, uitgevoerd door SEOOptimizer. Bevat welke secties er gewijzigd zijn, wat de reden was, en wat het verkeerseffect was voor en na de wijziging. Opgeslagen als onderdeel van de LandingPage (geen aparte tabel).

---

## AInternLoop & NewsFlow Relationships

- Action is aangemaakt door een Agent, door LearningAgent, of door een Human via admin
- Action is bestemd voor één Agent (targetAgent)
- Action kan één Issue hebben (wanneer status `on_hold`)
- Issue behoort tot één Action
- Issue kan feedback ontvangen van een Human via admin
- Agent heeft een versiehistorie van zijn instructies
- LandingPage is gebouwd vanuit één Action (van type `newsflow/content`)
- LandingPage heeft meerdere OptimizationRounds (embedded log)
- SEOOptimizer kan een nieuwe Action aanmaken voor ContentBuilder (type `newsflow/additional-content`) wanneer een LandingPage aanvullende content nodig heeft
