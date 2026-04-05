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
