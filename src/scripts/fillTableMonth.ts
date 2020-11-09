import { SiteParser } from '../SiteParser'
import { addStatsToTable } from '../utils/addStatsToTable'
import { getCsvPath } from '../utils/getCsvPath'

async function main() {
	const siteParser = new SiteParser()
	const statsByMonth = await siteParser.getAllStatsByMonth()

	await addStatsToTable(getCsvPath(), statsByMonth)
}

main().catch((err) => {
	// eslint-disable-next-line no-console
	console.error(err)
	process.exit(1)
})
