import PQueue from 'p-queue'
import { URLSearchParams } from 'url'
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import { parse as parseDate, isValid, startOfDay } from 'date-fns'
import ru from 'date-fns/locale/ru/index.js'

import { RegionCode, regions } from './regions.js'
import { DayStats, MonthStats } from './utils/schemas.js'

export enum Category {
	Sick = 'sick',
	Healed = 'healed',
	Died = 'died',
}

export type Stat = {
	date: Date
	sick: number
	healed: number
	died: number
	regionCode: string
}

export class SiteParser {
	queue: PQueue

	constructor() {
		this.queue = new PQueue({ interval: 500, intervalCap: 1 })
	}

	async getStatsByRegion(regionCode: RegionCode): Promise<Stat[]> {
		return this.queue.add(async () => {
			const response = await fetch(
				`http://стопкоронавирус.рф/covid_data.json?${new URLSearchParams({
					do: 'region_stats',
					code: regionCode,
				})}`,
			)

			if (!response.ok) {
				throw new Error(`Error requesting ${response.url}: ${response.status}`)
			}

			const data = MonthStats.parse(await response.json())

			return data.map(el => ({
				date: parseDate(el.date, 'dd.MM.yyyy', new Date()),
				[Category.Sick]: Number(el.sick),
				[Category.Healed]: Number(el.healed),
				[Category.Died]: Number(el.died),
				regionCode,
			}))
		})
	}

	async getAllStatsByMonth(): Promise<Stat[]> {
		let allStats: Stat[] = []

		for (const regionCode of Object.keys(regions)) {
			const stats = await this.getStatsByRegion(regionCode as RegionCode)
			allStats = [...allStats, ...stats.map(stat => ({ ...stat, regionCode }))]
		}

		return allStats
	}

	async getLatestStats(): Promise<Stat[]> {
		const response = await fetch(`http://стопкоронавирус.рф/information/`)

		if (!response.ok) {
			throw new Error(`Error requesting ${response.url}: ${response.status}`)
		}

		const html = await response.text()

		const $ = cheerio.load(html)

		const match = $('h1.cv-section__title')
			.text()
			.trim()
			.match(/состоянию на (.+)$/i)

		if (!match) {
			throw new Error('Не удалось получить дату')
		}

		const dateStr = match[1]!
		const date = startOfDay(
			parseDate(dateStr, 'dd MMMM HH:mm', new Date(), { locale: ru }),
		)

		if (!isValid(date)) {
			throw new Error('Не удалось распарсить дату')
		}

		const spreadStr = $('cv-spread-overview').attr(':spread-data')
		if (!spreadStr) {
			throw new Error('Не удалось получить статистику из HTML')
		}

		const spreadData = DayStats.parse(JSON.parse(spreadStr))

		return spreadData.map(item => ({
			date,
			regionCode: item.code,
			sick: item.sick,
			healed: item.healed,
			died: item.died,
		}))
	}
}
