import { string, array, type, number, enums } from 'superstruct'

import { regions } from '../regions'

export const MonthStats = array(
	type({
		date: string(),
		sick: string(),
		healed: string(),
		died: string(),
	}),
)

export const DayStats = array(
	type({
		title: string(),
		code: enums(Object.keys(regions)),
		sick: number(),
		healed: number(),
		died: number(),
	}),
)
