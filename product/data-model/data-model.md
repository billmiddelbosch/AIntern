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

### AiGeneratedItem
Een door Claude AI gegenereerd Vue 3 SFC-bestand (component of template), inclusief de originele instructie en de GitHub-commitreferentie. Opgeslagen in DynamoDB (`aintern-admin` single-table).

| Veld | Type | Beschrijving |
|---|---|---|
| `id` | String | UUID (part of SK) |
| `type` | String | `component` of `template` |
| `name` | String | PascalCase bestandsnaam zonder extensie |
| `instruction` | String | Originele natural language prompt |
| `code` | String | Gegenereerde `.vue` SFC broncode |
| `filePath` | String | Pad in de repo (bijv. `src/components/ai-generated/PricingCard.vue`) |
| `githubCommitSha` | String | Commit SHA van de GitHub API-response |
| `createdAt` | String | ISO-8601 timestamp |
| `createdBy` | String | Admin user-ID uit de JWT-token |

DynamoDB: PK = `AI_STUDIO#{type}`, SK = `ITEM#{createdAt}#{id}`

### KennisbankTemplateConfig
Configuratierecord dat bepaalt welk Vue-template op kennisbank-artikelpagina's gebruikt wordt. Eén record in DynamoDB — geen deploy nodig bij wisselen.

| Veld | Type | Beschrijving |
|---|---|---|
| `activeTemplateName` | String | PascalCase naam van het actieve Vue-template (bijv. `KennisbankArtikelView`) |
| `updatedAt` | String | ISO-8601 timestamp van laatste wijziging |

DynamoDB: PK = `CONFIG#kennisbank-template`, SK = `LATEST`

## Relationships

- Case verwijst naar een Problem (de case lost een specifiek pijnpunt op)
- Step heeft een vaste volgorde binnen de "Hoe werkt het?"-flow
- FAQ behoort tot een thema: no-cure-no-pay of algemeen AI
- ContactRequest staat op zichzelf
