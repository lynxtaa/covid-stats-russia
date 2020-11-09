import path from 'path'

export function getCsvPath(): string {
	return path.join(__dirname, '../../covid_stats.csv')
}
