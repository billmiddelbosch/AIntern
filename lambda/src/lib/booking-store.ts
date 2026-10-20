/**
 * Shared DynamoDB access for the booking feature (aintern-admin table).
 *
 *   pk BOOKING_SLOTS / sk SLOT#<iso>  → a booked appointment (slot lock + details)
 *   pk BOOKING_OPEN  / sk OPEN#<iso>  → a block Bill opened in the admin; only these are bookable
 */

import { QueryCommand, type DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

export const SLOT_PK = 'BOOKING_SLOTS'
export const OPEN_PK = 'BOOKING_OPEN'
export const SLOT_PREFIX = 'SLOT#'
export const OPEN_PREFIX = 'OPEN#'

/** All items of one booking partition whose start lies between fromIso and toIso (inclusive). */
export async function queryRange(
  ddb: DynamoDBDocumentClient,
  tableName: string,
  pk: typeof SLOT_PK | typeof OPEN_PK,
  fromIso: string,
  toIso: string,
  projection?: string,
): Promise<Record<string, unknown>[]> {
  const prefix = pk === SLOT_PK ? SLOT_PREFIX : OPEN_PREFIX
  const items: Record<string, unknown>[] = []
  let startKey: Record<string, unknown> | undefined
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'pk = :pk AND sk BETWEEN :from AND :to',
        ExpressionAttributeValues: { ':pk': pk, ':from': `${prefix}${fromIso}`, ':to': `${prefix}${toIso}` },
        ...(projection ? { ProjectionExpression: projection } : {}),
        ExclusiveStartKey: startKey,
      }),
    )
    items.push(...((res.Items ?? []) as Record<string, unknown>[]))
    startKey = res.LastEvaluatedKey
  } while (startKey)
  return items
}

/** Slot start (ISO) from an item's sort key. */
export function startFromSk(sk: unknown): string {
  const value = String(sk)
  const hash = value.indexOf('#')
  return hash === -1 ? value : value.slice(hash + 1)
}

/** Start times (ISO) of the items of one partition in a range. */
export async function queryStarts(
  ddb: DynamoDBDocumentClient,
  tableName: string,
  pk: typeof SLOT_PK | typeof OPEN_PK,
  fromIso: string,
  toIso: string,
): Promise<Set<string>> {
  const items = await queryRange(ddb, tableName, pk, fromIso, toIso, 'sk')
  return new Set(items.map((i) => startFromSk(i.sk)))
}
