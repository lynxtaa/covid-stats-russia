import PQueue from 'p-queue'
import { URLSearchParams } from 'url'
import fetch from 'node-fetch'
import { assert } from 'superstruct'
import cheerio from 'cheerio'
import { parse as parseDate, isValid, format as formatDate } from 'date-fns'
import { ru } from 'date-fns/locale'

import { RegionCode, regions } from './regions'
import { DayStats, MonthStats } from './utils/structs'

export enum Category {
	Sick = 'sick',
	Healed = 'healed',
	Died = 'died',
}

export type Stat = {
	date: string
	sick: number
	healed: number
	died: number
	region: string
	name: string
}

export class SiteParser {
	queue: PQueue

	constructor() {
		this.queue = new PQueue({ interval: 500, intervalCap: 1 })
	}

	async getStatsByRegion(regionCode: RegionCode): Promise<Stat[]> {
		return this.queue.add(async () => {
			const response = await fetch(
				`https://стопкоронавирус.рф/covid_data.json?${new URLSearchParams({
					do: 'region_stats',
					code: regionCode,
				})}`,
			)

			if (!response.ok) {
				throw new Error(`Error requesting ${response.url}: ${response.status}`)
			}

			const data = await response.json()

			assert(data, MonthStats)

			return data.map((el) => ({
				date: el.date,
				[Category.Sick]: Number(el.sick),
				[Category.Healed]: Number(el.healed),
				[Category.Died]: Number(el.died),
				region: regionCode,
				name: regions[regionCode],
			}))
		})
	}

	async getAllStatsByMonth(): Promise<Stat[]> {
		const allStats: Stat[] = []

		for (const [region, name] of Object.entries(regions)) {
			const stats = await this.getStatsByRegion(region as RegionCode)
			allStats.push(...stats.map((stat) => ({ ...stat, name, region })))
		}

		return allStats
	}

	async getLatestStats(): Promise<Stat[]> {
		const response = await fetch(`https://стопкоронавирус.рф/information/`)

		if (!response.ok) {
			throw new Error(`Error requesting ${response.url}: ${response.status}`)
		}

		const html = await response.text()

		const $ = cheerio.load(html)

		const match = $('h1.cv-section__title')
			.text()
			.match(/состоянию на (.+)$/i)

		if (!match) {
			throw new Error()
		}

		const [, dateStr] = match
		const date = parseDate(dateStr, 'dd MMMM HH:mm', new Date(), { locale: ru })

		if (!isValid(date)) {
			throw new Error()
		}

		const spreadStr = $('cv-spread-overview').attr(':spread-data')
		if (!spreadStr) {
			throw new Error()
		}

		const spreadData = JSON.parse(spreadStr)

		assert(spreadData, DayStats)

		return spreadData.map((item) => {
			return {
				date: formatDate(date, 'dd.MM.yyyy'),
				name: regions[item.code as RegionCode],
				region: item.code,
				sick: item.sick,
				healed: item.healed,
				died: item.died,
			}
		})
	}
}
