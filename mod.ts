export class DateParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DateParseError';
  }
}

function localDateToUTC(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function parseDate(isoDate: string) {
  const isoDatePattern = /^[0-9]{4}-[0-1][0-9]-[0-3][0-9]$/;

  if (!isoDatePattern.test(isoDate)) {
    throw new DateParseError(
      `Invalid date format: "${isoDate}". Please specify as "yyyy-mm-dd"`
    );
  }

  const timestamp = Date.parse(isoDate);

  if (isNaN(timestamp)) {
    throw new DateParseError(`Invalid date: "${isoDate}"`);
  }

  return new Date(timestamp);
}

export function daysBetweenDates(date1: string, date2?: string) {
  let start: Date;
  let end: Date;

  if (date2 === undefined) {
    start = localDateToUTC(new Date());
    end = parseDate(date1);
  } else {
    start = parseDate(date1);
    end = parseDate(date2);
  }

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const ms_elapsed = end.getTime() - start.getTime();
  const days_elapsed = ms_elapsed / MS_PER_DAY;

  return days_elapsed;
}
