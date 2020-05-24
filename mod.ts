import {parseDate} from 'https://deno.land/std@v0.53.0/datetime/mod.ts';

function localDateToUTC(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function main(date1: string, date2?: string) {
  let start: Date;
  let end: Date;
  const DATE_FORMAT = 'yyyy-mm-dd';

  if (date2 === undefined) {
    start = localDateToUTC(new Date());
    end = localDateToUTC(parseDate(date1, DATE_FORMAT));
  } else {
    start = localDateToUTC(parseDate(date1, DATE_FORMAT));
    end = localDateToUTC(parseDate(date2, DATE_FORMAT));
  }

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const ms_elapsed = end.getTime() - start.getTime();
  const days_elapsed = ms_elapsed / MS_PER_DAY;

  return days_elapsed;
}

if (import.meta.main) {
  console.log(main('2020-01-01'));
}
