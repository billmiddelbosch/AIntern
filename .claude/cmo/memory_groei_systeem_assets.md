---
name: Groei Systeem — Content Inspiratie
description: Hoe de CMO-agent Groei Systeem assets (opportunities, LinkedIn drafts) ophaalt als inspiratiebron bij het maken van content
type: reference
---

Bij elke LinkedIn company post en kennisbank-artikel de actuele Groei Systeem assets ophalen via AWS CLI. Dit is een aanvullende bron naast de Obsidian vault — de agent beslist zelf hoe hij de data verwerkt.

## Ophalen top-3 opportunities (pain + persona + rootCause)

```bash
aws dynamodb query \
  --table-name aintern-admin \
  --index-name GSI1 \
  --key-condition-expression "GSI1pk = :pk" \
  --expression-attribute-values '{":pk":{"S":"PRIORITY#high"}}' \
  --scan-index-forward false \
  --limit 3 \
  --region eu-west-2 \
  --query 'Items[*].{pain:pain.S,persona:persona.S,opportunity:opportunity.S,rootCause:rootCause.S}'
```

## Ophalen gegenereerde LinkedIn drafts

```bash
aws dynamodb query \
  --table-name aintern-admin \
  --index-name GSI1 \
  --key-condition-expression "GSI1pk = :pk" \
  --filter-expression "#s = :draft" \
  --expression-attribute-names '{"#s":"status"}' \
  --expression-attribute-values '{":pk":{"S":"CHANNEL#linkedin_company"},":draft":{"S":"draft"}}' \
  --scan-index-forward false \
  --limit 3 \
  --region eu-west-2 \
  --query 'Items[*].{content:content.S,hashtags:hashtags.S,opportunityId:opportunityId.S}'
```

## Gebruik

- `pain` → herkenbare probleembeschrijving voor de intro van post of artikel
- `persona` → doelgroep-framing
- `rootCause` → "waarom dit probleem ontstaat" sectie in kennisbank-artikel
- `opportunity` → "zo pak je het aan" sectie
- Gegenereerde LinkedIn draft → startpunt voor herschrijven met marketing-super-team toon

Als beide queries leeg zijn of een fout geven: val terug op Obsidian vault als enige bron.
