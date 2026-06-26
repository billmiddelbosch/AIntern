/**
 * seed-ainternloop-agents
 *
 * One-shot Lambda handler — seeds the initial AGENT# config items into the
 * aintern-loop DynamoDB table. Invoke manually once after the table is live.
 *
 * Idempotent: uses ConditionExpression 'attribute_not_exists(pk)' so
 * re-running safely skips items that already exist.
 *
 * Environment variables:
 *   LOOP_TABLE_NAME — DynamoDB table name (injected by CDK)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import type { Context } from 'aws-lambda'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

interface AgentDefinition {
  pk: string
  displayName: string
  system: string
  instruction: string
}

const agents: AgentDefinition[] = [
  {
    pk: 'AGENT#IssueResolver',
    displayName: 'IssueResolver',
    system: 'AInternLoop',
    instruction:
      'Analyseer open issues van andere agents. Bepaal of het probleem opgelost kan worden zonder menselijke tussenkomst. Geef concrete instructies aan de geblokeerde agent indien oplosbaar. Escaleer naar human als het probleem buiten agent-scope valt (bijv. API-uitval, ontbrekende configuratie, of kwaliteitsoordeel vereist). Verwerk maximaal 50 issues per run.',
  },
  {
    pk: 'AGENT#LearningAgent',
    displayName: 'LearningAgent',
    system: 'AInternLoop',
    instruction:
      'Analyseer opgeloste issues per agent en bepaal of de algemene agent-instructie verbeterd moet worden. Pas alleen aan bij high of medium confidence. Behoud de structuur en toon van de oorspronkelijke instructie. Nooit verwijzen naar specifieke issue-IDs of acties in de instructie.',
  },
  {
    pk: 'AGENT#NewsAnalyzer',
    displayName: 'NewsAnalyzer',
    system: 'NewsFlow',
    instruction:
      'Haal dagelijks RSS-feeds op van NOS en NU.nl. Classificeer elk nieuwsitem op relevantie voor het MKB en urgentie (1-100). Formuleer per item de meest urgente lezersvraag die AIntern kan beantwoorden via een landingspagina. Registreer alleen items met urgency ≥ 40 als newsflow/content actie in AInternLoop.',
  },
  {
    pk: 'AGENT#ContentBuilder',
    displayName: 'ContentBuilder',
    system: 'NewsFlow',
    instruction:
      'Verwerk newsflow/content acties. Pak altijd de hoogst-urgente open actie op. Genereer een volledige SEO-landingspagina als JSON op basis van de lezersvraag en het nieuwsitem. Publiceer via feature branch workflow naar master. Voer tsc-check uit vóór merge. Bij timeout > 10 minuten: log een issue.',
  },
  {
    pk: 'AGENT#SEOOptimizer',
    displayName: 'SEOOptimizer',
    system: 'NewsFlow',
    instruction:
      "Analyseer traffic van gepubliceerde landingspagina's via Plausible Analytics. Optimaliseer maximaal 10 pagina's per run, gesorteerd op oudste lastOptimizedAt. Pas title, meta description, intro of FAQ-sectie aan op basis van zoekintentie. Maak een newsflow/additional-content actie aan voor ContentBuilder als aanvullende content nodig is.",
  },
]

export const handler = async (_event: unknown, _context: Context): Promise<void> => {
  const tableName = process.env.LOOP_TABLE_NAME
  if (!tableName) {
    throw new Error('LOOP_TABLE_NAME environment variable is required')
  }

  const now = new Date().toISOString()
  const results: { pk: string; status: 'seeded' | 'skipped' | 'error'; error?: string }[] = []

  for (const agent of agents) {
    const item = {
      pk: agent.pk,
      sk: 'CONFIG',
      displayName: agent.displayName,
      system: agent.system,
      instruction: agent.instruction,
      instructionVersion: 1,
      lastModifiedAt: now,
      lastModifiedBy: 'human:seed',
      versionHistory: [
        {
          version: 1,
          instruction: agent.instruction,
          modifiedAt: now,
          modifiedBy: 'human:seed',
        },
      ],
      registeredAt: now,
      // GSI1: admin lists agents per system → SYSTEM#<system> / <displayName>
      GSI1pk: `SYSTEM#${agent.system}`,
      GSI1sk: agent.displayName,
    }

    try {
      await ddb.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
          // Skip if the item already exists — makes this handler safely re-runnable
          ConditionExpression: 'attribute_not_exists(pk)',
        }),
      )
      results.push({ pk: agent.pk, status: 'seeded' })
      console.log(JSON.stringify({ level: 'INFO', message: 'seeded', pk: agent.pk }))
    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : String(err)
      if (errorName === 'ConditionalCheckFailedException') {
        results.push({ pk: agent.pk, status: 'skipped' })
        console.log(JSON.stringify({ level: 'INFO', message: 'skipped (already exists)', pk: agent.pk }))
      } else {
        const errorMessage = err instanceof Error ? err.message : String(err)
        results.push({ pk: agent.pk, status: 'error', error: errorMessage })
        console.error(JSON.stringify({ level: 'ERROR', message: 'seed failed', pk: agent.pk, error: errorMessage }))
      }
    }
  }

  const seeded = results.filter((r) => r.status === 'seeded').length
  const skipped = results.filter((r) => r.status === 'skipped').length
  const errors = results.filter((r) => r.status === 'error').length

  console.log(
    JSON.stringify({
      level: 'INFO',
      message: 'seed complete',
      seeded,
      skipped,
      errors,
      results,
    }),
  )

  if (errors > 0) {
    throw new Error(`Seed completed with ${errors} error(s) — check CloudWatch logs for details`)
  }
}
