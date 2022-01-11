import { SiteParser } from '../SiteParser.js'
import { addStatsToTable } from '../utils/addStatsToTable.js'
import { getCsvPath } from '../utils/getCsvPath.js'

const siteParser = new SiteParser()
const statsByMonth = await siteParser.getAllStatsByMonth()

const { statsAdded } = await addStatsToTable(getCsvPath(), statsByMonth)

// eslint-disable-next-line no-console
console.log(statsAdded > 0 ? `Added ${statsAdded} stats` : 'No new stats found')
