/**
 * One-time seed script — run manually after first deploy:
 *   node dist/seed-subreddits.js <table-name>
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

const SEED_SUBREDDITS = [
  'smallbusiness',
  'Entrepreneur',
  'startups',
  'netherlands',
  'dutchentrepreneurs',
  'automation',
  'nocode',
]

async function seed() {
  const tableName = process.argv[2] ?? 'aintern-admin'
  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))
  const now = new Date().toISOString()

  for (const name of SEED_SUBREDDITS) {
    try {
      await ddb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            pk: `SUBREDDIT#${name}`,
            sk: 'CONFIG',
            GSI1pk: 'STATUS#active',
            GSI1sk: now,
            name,
            active: true,
            signalCount: 0,
            addedAt: now,
            updatedAt: now,
          },
          ConditionExpression: 'attribute_not_exists(pk)',
        }),
      )
      console.log('Seeded: r/%s', name)
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
        console.log('Already exists: r/%s — skipping', name)
      } else {
        console.error('Failed: r/%s', name, err)
      }
    }
  }

  console.log('Seed complete.')
}

seed()
