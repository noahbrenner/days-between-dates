export class DateParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DateParseError';
  }
}

export function localDateToUTC(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export function utcDateToISOString(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function parseDate(isoDate: string) {
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

  const MS_IN_DAY = 1000 * 60 * 60 * 24;
  const msElapsed = end.getTime() - start.getTime();
  const daysElapsed = msElapsed / MS_IN_DAY;

  return {
    days: daysElapsed,
    startDate: utcDateToISOString(start),
    endDate: utcDateToISOString(end),
  };
}
