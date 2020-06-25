import {
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from './deps_dev.ts';
import {
  DateParseError,
  datesToISOStrings,
  daysElapsed,
  findDateRange,
  localDateToUTC,
  parseDateToUTC,
  utcDateToISOString,
} from './mod.ts';

Deno.test('localDateToUTC', () => {
  assertEquals(
    localDateToUTC(new Date(2020, 0, 1)),
    new Date(Date.UTC(2020, 0, 1))
  );
});

Deno.test('localDateToUTC strips time', () => {
  assertEquals(
    localDateToUTC(new Date(2020, 0, 1, 0, 1)), // 2020-01-01 00:01
    new Date(Date.UTC(2020, 0, 1))
  );

  const local = new Date();
  const utc = localDateToUTC(local);
  assertStrictEquals(utc.getUTCFullYear(), local.getFullYear());
  assertStrictEquals(utc.getUTCMonth(), local.getMonth());
  assertStrictEquals(utc.getUTCDate(), local.getDate());
  assertStrictEquals(utc.getUTCHours(), 0);
  assertStrictEquals(utc.getUTCMinutes(), 0);
  assertStrictEquals(utc.getUTCSeconds(), 0);
  assertStrictEquals(utc.getUTCMilliseconds(), 0);
});

Deno.test('utcDateToISOString', () => {
  assertStrictEquals(
    utcDateToISOString(new Date(Date.UTC(2020, 0, 1))),
    '2020-01-01'
  );
  assertStrictEquals(
    utcDateToISOString(new Date(Date.UTC(999, 0, 1))),
    '0999-01-01'
  );
});

Deno.test('parseDateToUTC', () => {
  assertEquals(
    parseDateToUTC('2020-01-01'),
    new Date('2020-01-01')
  );
  assertEquals(
    parseDateToUTC('0999-01-01'),
    new Date('0999-01-01')
  );
});

Deno.test('parseDateToUTC throws (invalid format)', () => {
  const invalidDateFormats: string[] = [
    // Extra/missing digits
    '2020-01-001',
    '2020-001-01',
    '02020-01-01',
    '999-01-01',

    // Extra characters
    ' 2020-01-01',
    '2020-01-01 ',
    '\n2020-01-01',
    '2020-01-01\n',

    // Unsupported formats
    '2020-01-01T00:00:00.000Z',
    'Wed Jan 01 2020 00:00:00 GMT-0000',
    '1/1/2020',
    '01/01/2020',
    '1/1/2020',
    '1-1-2020',
    '01-01-2020',

    // Edge cases
    '',
    ' ',

    // The following are invalid dates that *seem* to have the right format,
    // but they're caught by the RegExp test before constructing a Date object
    '2020-20-01',
    '2020-01-40',
    '2020-99-99',
  ];

  for (const date of invalidDateFormats) {
    assertThrows(
      () => {
        parseDateToUTC(date)
      },
      DateParseError,
      'Invalid date format:',
      `parseDateToUTC('${date}')`
    );
  }
});

Deno.test('parseDateToUTC throws (invalid date)', () => {
  const invalidDates: string[] = [
    // Values too low
    '2020-00-00',
    '2020-01-00',
    '2020-00-01',

    // Values too high
    '2020-13-01',
    '2020-01-32',
    '2020-02-30', // Leap year
    '2019-02-29', // Non-leap year
  ];

  for (const date of invalidDates) {
    assertThrows(
      () => {
        parseDateToUTC(date)
      },
      DateParseError,
      'Invalid date:',
      `parseDateToUTC('${date}')`
    );
  }
});

Deno.test('findDateRange [3 args] chronological', () => {
  const [start, end] = findDateRange(
    new Date(2020, 0, 1), // Ignored: 3 args are passed to `findDateRange`
    '2020-01-02',
    '2020-01-03'
  );
  assertEquals(start, new Date(Date.UTC(2020, 0, 2)));
  assertEquals(end, new Date(Date.UTC(2020, 0, 3)));
});

Deno.test('findDateRange [3 args] reverse chronological', () => {
  const [start, end] = findDateRange(
    new Date(2020, 0, 3), // Ignored: 3 args are passed to `findDateRange`
    '2020-01-02',
    '2020-01-01'
  );
  // Dates are not sorted, so they can go backwards in time
  assertEquals(start, new Date(Date.UTC(2020, 0, 2)));
  assertEquals(end, new Date(Date.UTC(2020, 0, 1)));
});

Deno.test('findDateRange [2 args] chronological', () => {
  const [start, end] = findDateRange(
    new Date(2020, 0, 1),
    '2020-01-02',
  );
  assertEquals(start, new Date(Date.UTC(2020, 0, 1))); // local -> UTC
  assertEquals(end, new Date(Date.UTC(2020, 0, 2)));
});

Deno.test('findDateRange [2 args] reverse chronological', () => {
  const [start, end] = findDateRange(
    new Date(2020, 0, 2),
    '2020-01-01',
  );
  // Dates are not sorted, so they can go backwards in time
  assertEquals(start, new Date(Date.UTC(2020, 0, 2))); // local -> UTC
  assertEquals(end, new Date(Date.UTC(2020, 0, 1)));
});

Deno.test('findDateRange throws for invalid dates', () => {
  // This test isn't exhaustive, it just verifies that the errors thrown by
  // `parseDateToUTC` are propagated
  assertThrows(
    () => {
      findDateRange(new Date(), '2020-02-30');
    },
    DateParseError,
    'Invalid date:',
    "findDateRange(new Date(), '2020-02-30')"
  );
  assertThrows(
    () => {
      findDateRange(new Date(), '2020-02-01', '2020-02-30');
    },
    DateParseError,
    'Invalid date:',
    "findDateRange(new Date(), '2020-02-01', '2020-02-30')"
  );
});

Deno.test('daysElapsed returns Date objects unmodified', () => {
  const date1 = new Date(2020, 0, 1);
  const date2 = new Date(Date.UTC(2020, 0, 2));
  const timestamp1 = date1.getTime();
  const timestamp2 = date2.getTime();

  const {start, end} = daysElapsed([date1, date2]);

  // Same objects
  assertStrictEquals(start, date1);
  assertStrictEquals(end, date2);

  // Unmodified values
  assertStrictEquals(start.getTime(), timestamp1);
  assertStrictEquals(end.getTime(), timestamp2);
});

Deno.test('daysElapsed returns {days: 0, ...} for same day', () => {
  const {days} = daysElapsed([
    new Date(Date.UTC(2020, 0, 1)),
    new Date(Date.UTC(2020, 0, 1)),
  ]);
  assertStrictEquals(days, 0);
});

Deno.test('daysElapsed returns {days: 1, ...} for 1-day future offset', () => {
  const {days} = daysElapsed([
    new Date(Date.UTC(2020, 0, 1)),
    new Date(Date.UTC(2020, 0, 2)),
  ]);
  assertStrictEquals(days, 1);
});

Deno.test('daysElapsed returns {days: -1, ...} for 1-day past offset', () => {
  const {days} = daysElapsed([
    new Date(Date.UTC(2020, 0, 1)),
    new Date(Date.UTC(2019, 11, 31)),
  ]);
  assertStrictEquals(days, -1);
});

Deno.test('daysElapsed handles leap year', () => {
  const {days} = daysElapsed([
    new Date(Date.UTC(2020, 1, 28)),
    new Date(Date.UTC(2020, 2, 1)),
  ]);
  assertStrictEquals(days, 2);
});

Deno.test('daysElapsed handles non-leap year', () => {
  const {days} = daysElapsed([
    new Date(Date.UTC(2019, 1, 28)),
    new Date(Date.UTC(2019, 2, 1)),
  ]);
  assertStrictEquals(days, 1);
});

Deno.test('datesToISOStrings does not modify {days}', () => {
  const {days} = datesToISOStrings({
    start: new Date(Date.UTC(2020, 0, 1)),
    end: new Date(Date.UTC(2020, 0, 2)),
    days: 42, // Definitely incorrect for the given dates
  });
  assertStrictEquals(days, 42); // ...but is returned unchanged
});

Deno.test('datesToISOStrings translates {start, end} to ISO strings', () => {
  const {startISO, endISO} = datesToISOStrings({
    start: new Date(Date.UTC(999, 0, 1)),
    end: new Date(Date.UTC(2020, 11, 31)),
    days: 0, // Irrelevant for this test
  });
  assertStrictEquals(startISO, '0999-01-01');
  assertStrictEquals(endISO, '2020-12-31');
});
