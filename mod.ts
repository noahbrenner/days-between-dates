function localDateToUTC(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function main(date1: string, date2?: string) {
  let start: Date;
  let end: Date;

  if (date2 === undefined) {
    start = localDateToUTC(new Date());
    end = new Date(Date.parse(date1));
  } else {
    start = new Date(Date.parse(date1));
    end = new Date(Date.parse(date2));
  }

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const ms_elapsed = end.getTime() - start.getTime();
  const days_elapsed = ms_elapsed / MS_PER_DAY;

  return days_elapsed;
}

if (import.meta.main) {
  console.log(main('2020-01-01'));
}
