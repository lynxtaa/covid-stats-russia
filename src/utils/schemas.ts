import { z } from 'zod'

import { regions } from '../regions'

export const MonthStats = z.array(
	z.object({
		date: z.string(),
		sick: z.number(),
		healed: z.number(),
		died: z.number(),
	}),
)

export const DayStats = z.array(
	z.object({
		title: z.string(),
		code: z.string().refine(
			val => val in regions,
			val => ({ message: `Unknown region: "${val}"` }),
		),
		sick: z.number(),
		healed: z.number(),
		died: z.number(),
	}),
)
