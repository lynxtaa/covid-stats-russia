import { promises } from 'fs'
import { parse as parseCsv, unparse as unparseCsv } from 'papaparse'
import { parse as parseDate, isAfter } from 'date-fns'

import { Category, Stat } from '../SiteParser'
import { groupBy, sortBy } from 'lodash'

export async function addStatsToTable(csvPath: string, stats: Stat[]): Promise<void> {
	const csv = await promises.readFile(csvPath, 'utf-8')

	const { data, errors } = parseCsv<string[]>(csv, { skipEmptyLines: true })

	if (errors.length > 0) {
		throw new Error(errors[0].message)
	}

	const lastRow = data[data.length - 1]
	const lastDate = parseDate(lastRow[0], 'dd.MM.yyyy', new Date())

	const newStats = stats.filter((stat) =>
		isAfter(parseDate(stat.date, 'dd.MM.yyyy', new Date()), lastDate),
	)

	const statByDate = groupBy(newStats, (stat) => stat.date)

	const newCsvData = sortBy(Object.entries(statByDate), ([date]) =>
		parseDate(date, 'dd.MM.yyyy', new Date()).valueOf(),
	).flatMap(([date, stats]) =>
		Object.values(Category).map((category) => ({
			date,
			category,
			Россия: stats.reduce((prev, curr) => prev + curr[category], 0),
			...Object.fromEntries(
				sortBy(stats, (stat) => stat.name).map((stat) => [stat.name, stat[category]]),
			),
		})),
	)

	const newCsv = unparseCsv(newCsvData, { header: false, newline: '\n' })

	await promises.appendFile(csvPath, `${newCsv}\n`, 'utf-8')
}
