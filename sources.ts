import { defineSource } from '@jaspers-ai/sdk'
import { z } from 'zod'


// The European Central Bank's data portal. No key. Euro area reference rates and policy rates, in
// SDMX-JSON, which puts its numbers in one object and their dates in another.

const HOST = 'data-api.ecb.europa.eu'

interface Sdmx {
  dataSets: { series: Record<string, { observations: Record<string, (number | null)[]> }> }[]
  structure: { dimensions: { observation: { id: string; values: { id: string; name?: string }[] }[] } }
}

/**
 * SDMX-JSON as rows. The observations are keyed by position, and the positions index the time
 * dimension's values, so the two are read together.
 */
async function read(ctx: { fetch: typeof fetch }, path: string, query: string): Promise<{ date: string; value: number }[]> {
  const response = await ctx.fetch(`https://${HOST}/service/data/${path}?${query}&format=jsondata`)
  if (!response.ok) {
    if (response.status === 404) throw new Error('The ECB has no series at that key.')
    throw new Error(`The ECB answered ${response.status}.`)
  }
  const body = (await response.json()) as Sdmx
  const dates = body.structure.dimensions.observation[0]?.values.map((one) => one.id) ?? []
  const series = Object.values(body.dataSets[0]?.series ?? {})[0]
  if (!series) throw new Error('The ECB answered with no series.')
  return Object.entries(series.observations)
    .map(([at, values]) => ({ date: dates[Number(at)] ?? at, value: values[0] }))
    .filter((one): one is { date: string; value: number } => typeof one.value === 'number')
    .sort((a, b) => a.date.localeCompare(b.date))
}

export const fx = defineSource({
  description:
    'The ECB euro reference rate against one currency, daily: how many units of that currency one euro buys. currency is a three letter code like USD, GBP, JPY, or CHF.',
  hosts: [HOST],
  input: z.object({
    currency: z.string().default('USD').describe('A three letter currency code.'),
    days: z.number().int().min(1).max(10000).default(250),
  }),
  async run({ currency, days }, ctx) {
    const code = currency.trim().toUpperCase()
    const rows = await read(ctx, `EXR/D.${code}.EUR.SP00.A`, `lastNObservations=${days}`)
    return { pair: `EUR/${code}`, rows: rows.map((one) => ({ date: one.date, pair: `EUR/${code}`, rate: one.value })) }
  },
})

export const policyRate = defineSource({
  description: 'The ECB deposit facility rate, the euro area policy rate, every time it changed.',
  hosts: [HOST],
  input: z.object({ days: z.number().int().min(1).max(10000).default(400) }),
  async run({ days }, ctx) {
    const rows = await read(ctx, 'FM/D.U2.EUR.4F.KR.DFR.LEV', `lastNObservations=${days}`)
    return { rows: rows.map((one) => ({ date: one.date, rate: one.value })) }
  },
})
