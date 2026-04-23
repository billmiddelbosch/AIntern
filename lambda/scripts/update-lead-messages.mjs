#!/usr/bin/env node
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

const ssm = new SSMClient({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

const { Parameter } = await ssm.send(new GetParameterCommand({ Name: '/aintern/dev/dynamodb/table-name' }))
const table = Parameter.Value
console.log('Table:', table)

const leads = [
  {
    website: 'vansoest-amsterdam.nl',
    connectionMessage: 'Hoi Franny, met je eigen AI stagiair helpen wij voor geautomatiseerde product plaatsing in Lightspeed webshops. Zou dat iets voor jou zijn?',
    connectionVariant: 'ROI',
  },
  {
    website: 'lijmenwinkel.nl',
    connectionMessage: 'Hoi Denise, wist je dat je met een eigen AI stagiair de product plaatsing in je Lightspeed webshop volledig kunt automatiseren? Benieuwd hoe dat werkt?',
    connectionVariant: 'Nieuwsgierigheid',
  },
  {
    website: 'paperspecials.nl',
    connectionMessage: 'Hoi Ilse, we helpen Lightspeed-webshops al 2 weken na intake met AI-automatisering. No cure no pay. Zin om even te sparren?',
    connectionVariant: 'Resultaat',
  },
  {
    website: 'dezeilenspecialist.nl',
    connectionMessage: 'Hoi Nick, met je eigen AI stagiair helpen wij voor geautomatiseerde product plaatsing in Lightspeed webshops. Zou dat iets voor jou zijn?',
    connectionVariant: 'ROI',
  },
  {
    website: 'homesecuur.nl',
    connectionMessage: 'Hoi Bep, wist je dat je met een eigen AI stagiair de product plaatsing in je Lightspeed webshop volledig kunt automatiseren? Benieuwd hoe dat werkt?',
    connectionVariant: 'Nieuwsgierigheid',
  },
]

for (const lead of leads) {
  const pk = `LEAD#${encodeURIComponent(lead.website)}`
  await ddb.send(new UpdateCommand({
    TableName: table,
    Key: { pk, sk: 'METADATA' },
    UpdateExpression: 'SET connectionMessage = :msg, connectionVariant = :variant, updatedAt = :now',
    ExpressionAttributeValues: {
      ':msg': lead.connectionMessage,
      ':variant': lead.connectionVariant,
      ':now': new Date().toISOString(),
    },
  }))
  console.log(`✅ Updated: ${lead.website} (${lead.connectionVariant})`)
}

console.log(`\nDone — updated ${leads.length} leads`)
