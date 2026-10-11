import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export function parseDDMMYYYY(value: string): string | null {
  const parsed = dayjs(value, 'DD/MM/YYYY', true)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null
}
