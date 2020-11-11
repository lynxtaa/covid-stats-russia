import { SiteParser } from '../SiteParser'
import { addStatsToTable } from '../utils/addStatsToTable'
import { getCsvPath } from '../utils/getCsvPath'

async function main() {
	const siteParser = new SiteParser()
	const statsByLatestDay = await siteParser.getLatestStats()

	const { statsAdded } = await addStatsToTable(getCsvPath(), statsByLatestDay)

	// eslint-disable-next-line no-console
	console.log(statsAdded > 0 ? `Added ${statsAdded} stats` : 'No new stats found')
}

main().catch((err) => {
	// eslint-disable-next-line no-console
	console.error(err)
	process.exit(1)
})
