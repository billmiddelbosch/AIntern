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

### ContactRequest
De gegevens die een bezoeker achterlaat bij het aanvragen van een gratis kennismaking. Wordt verwerkt als lead voor opvolging door AIntern.

## Relationships

- Case verwijst naar een Problem (de case lost een specifiek pijnpunt op)
- Step heeft een vaste volgorde binnen de "Hoe werkt het?"-flow
- FAQ behoort tot een thema: no-cure-no-pay of algemeen AI
- ContactRequest staat op zichzelf
