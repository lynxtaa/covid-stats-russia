import { SiteParser } from '../SiteParser'
import { addStatsToTable } from '../utils/addStatsToTable'
import { getCsvPath } from '../utils/getCsvPath'

async function main() {
	const siteParser = new SiteParser()
	const statsByLatestDay = await siteParser.getLatestStats()

	await addStatsToTable(getCsvPath(), statsByLatestDay)
}

main().catch((err) => {
	// eslint-disable-next-line no-console
	console.error(err)
	process.exit(1)
})
