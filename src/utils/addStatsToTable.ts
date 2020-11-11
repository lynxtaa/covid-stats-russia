import { promises } from 'fs'
import { parse as parseCsv, unparse as unparseCsv } from 'papaparse'
import { isAfter, formatISO, parseISO, getUnixTime } from 'date-fns'
import { groupBy, sortBy } from 'lodash'

import { Category, Stat } from '../SiteParser'
import { regions, RegionCode } from '../regions'

async function appendCsv({ data, csvPath }: { data: string[][]; csvPath: string }) {
	const newCsv = unparseCsv(data, { header: false, newline: '\n' })
	await promises.appendFile(csvPath, `${newCsv}\n`, 'utf-8')
}

export async function addStatsToTable(
	csvPath: string,
	stats: Stat[],
): Promise<{ statsAdded: number }> {
	const csv = await promises.readFile(csvPath, 'utf-8')

	const { data, errors } = parseCsv<string[]>(csv, { skipEmptyLines: true })

	if (errors.length > 0) {
		throw new Error(errors[0].message)
	}

	const headerIndexes = Object.fromEntries(
		data[0].map((headerName, i) => [headerName, i]),
	)

	const lastDate = (() => {
		const lastRow = data[data.length - 1]
		return parseISO(lastRow[0])
	})()

	const newStats = stats.filter((stat) => isAfter(stat.date, lastDate))

	if (newStats.length === 0) {
		return { statsAdded: 0 }
	}

	const statByDate = groupBy(newStats, (stat) =>
		formatISO(stat.date, { representation: 'date' }),
	)

	const newCsvData: string[][] = sortBy(Object.entries(statByDate), ([date]) =>
		getUnixTime(parseISO(date)),
	).flatMap(([date, stats]) =>
		Object.values(Category).map((category) => {
			const columns: [string, string][] = [
				['date', date],
				['category', category],
				['Россия', String(stats.reduce((prev, curr) => prev + curr[category], 0))],
				...stats.map((stat): [string, string] => [
					regions[stat.regionCode as RegionCode],
					String(stat[category]),
				]),
			]

			const row: string[] = []

			for (const [colName, colValue] of columns) {
				if (colName in headerIndexes) {
					row[headerIndexes[colName]] = colValue
				} else {
					throw new Error(`Не найдена колонка для ${colName}`)
				}
			}

			return row
		}),
	)

	await appendCsv({ data: newCsvData, csvPath })

	return { statsAdded: newCsvData.length }
}
