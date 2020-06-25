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

export function parseDateToUTC(isoDate: string) {
  const re = /^(?<year>[0-9]{4})-(?<month>[0-1][0-9])-(?<day>[0-3][0-9])$/;
  const parsed = re.exec(isoDate);

  if (parsed === null) {
    throw new DateParseError(
      `Invalid date format: "${isoDate}". Please specify as "yyyy-mm-dd"`
    );
  }

  const year = Number(parsed.groups!.year);
  const month = Number(parsed.groups!.month) - 1;
  const day = Number(parsed.groups!.day);
  const date = new Date(Date.UTC(year, month, day));

  // Catch `Date` bug: `Date.UTC(2020, 0, 32) === Date.UTC(2020, 1, 1)`
  if (
    date.getUTCDate() !== day ||
    date.getUTCMonth() !== month ||
    date.getUTCFullYear() !== year
  ) {
    throw new DateParseError(`Invalid date: "${isoDate}"`);
  }

  return date;
}

export function findDateRange(localNow: Date, date1: string, date2?: string) {
  const dateRange: [Date, Date] = date2 === undefined
    // 1 date passed: Use it as the end date, use `localNow` as the start date
    ? [localDateToUTC(localNow), parseDateToUTC(date1)]
    // 2 dates passed: Use them as endpoints, ignore `localNow`
    : [date1, date2].map(parseDateToUTC) as [Date, Date];

  return dateRange;
}

export function daysElapsed([start, end]: [Date, Date]) {
  const MS_IN_DAY = 1000 * 60 * 60 * 24;
  const msElapsed = end.getTime() - start.getTime();
  const days = msElapsed / MS_IN_DAY;
  return {start, end, days};
}

export function datesToISOStrings(
  {start, end, days}: {start: Date, end: Date, days: number}
) {
  const startISO = utcDateToISOString(start);
  const endISO = utcDateToISOString(end);
  return {startISO, endISO, days};
}

export function daysBetweenDates(date1: string, date2?: string) {
  return datesToISOStrings(daysElapsed(
    findDateRange(new Date(), date1, date2)
  ));
}
