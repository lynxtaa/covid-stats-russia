import { SiteParser } from '../SiteParser.js'
import { addStatsToTable } from '../utils/addStatsToTable.js'
import { getCsvPath } from '../utils/getCsvPath.js'

const siteParser = new SiteParser()
const statsByLatestDay = await siteParser.getLatestStats()

const { statsAdded } = await addStatsToTable(getCsvPath(), statsByLatestDay)

// eslint-disable-next-line no-console
console.log(statsAdded > 0 ? `Added ${statsAdded} stats` : 'No new stats found')
