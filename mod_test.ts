import {
  assert,
  assertEquals,
  assertThrows
} from 'https://deno.land/std@0.53.0/testing/asserts.ts';
import {
  DateParseError,
  daysBetweenDates,
  localDateToUTC,
  parseDate,
  utcDateToISOString,
} from './mod.ts';

const INVALID_DATE_FORMATS: string[] = [
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

const INVALID_DATES: string[] = [
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
  assertEquals(utc.getUTCFullYear(), local.getFullYear());
  assertEquals(utc.getUTCMonth(), local.getMonth());
  assertEquals(utc.getUTCDate(), local.getDate());
  assertEquals(utc.getUTCHours(), 0);
  assertEquals(utc.getUTCMinutes(), 0);
  assertEquals(utc.getUTCSeconds(), 0);
  assertEquals(utc.getUTCMilliseconds(), 0);
});

Deno.test('utcDateToISOString', () => {
  assertEquals(
    utcDateToISOString(new Date('2020-01-01')),
    '2020-01-01'
  );
});

Deno.test('parseDate', () => {
  assertEquals(
    parseDate('2020-01-01'),
    new Date('2020-01-01')
  );
  assertEquals(
    parseDate('0999-01-01'),
    new Date('0999-01-01')
  );
});

Deno.test('parseDate throws (invalid format)', () => {
  for (const date of INVALID_DATE_FORMATS) {
    assertThrows(
      () => {
        parseDate(date)
      },
      DateParseError,
      'Invalid date format:',
      `parseDate('${date}')`
    );
  }
});

Deno.test('parseDate throws (invalid date)', () => {
  for (const date of INVALID_DATES) {
    assertThrows(
      () => {
        parseDate(date)
      },
      DateParseError,
      'Invalid date:',
      `parseDate('${date}')`
    );
  }
});

Deno.test('daysBetweenDates [2 args] same day', () => {
  assertEquals(
    daysBetweenDates('2020-01-01', '2020-01-01'),
    {
      days: 0,
      startDate: '2020-01-01',
      endDate: '2020-01-01',
    }
  );
});

Deno.test('daysBetweenDates [2 args] future date', () => {
  assertEquals(
    daysBetweenDates('2020-01-01', '2020-01-02'),
    {
      days: 1,
      startDate: '2020-01-01',
      endDate: '2020-01-02',
    }
  );
});

Deno.test('daysBetweenDates [2 args] past date', () => {
  assertEquals(
    daysBetweenDates('2020-01-01', '2019-12-31'),
    {
      days: -1,
      startDate: '2020-01-01',
      endDate: '2019-12-31',
    }
  );
});

Deno.test('daysBetweenDates [2 args] leap year', () => {
  assertEquals(
    daysBetweenDates('2020-02-28', '2020-03-01'),
    {
      days: 2,
      startDate: '2020-02-28',
      endDate: '2020-03-01',
    }
  );
});

Deno.test('daysBetweenDates [2 args] non-leap year', () => {
  assertEquals(
    daysBetweenDates('2019-02-28', '2019-03-01'),
    {
      days: 1,
      startDate: '2019-02-28',
      endDate: '2019-03-01',
    }
  );
});

Deno.test('daysBetweenDates [2 args] daylight saving', () => {
  /*
   * NOTE: These tests are inherently imperfect, because they depend on the
   * locale where the test is executed to observe Daylight Saving Time
   *
   * Reference for dates by country for which Daylight Saving is observed:
   * https://en.wikipedia.org/wiki/Daylight_saving_time_by_country
   */

  // For countries that observe Daylight Saving, January 1 and August 1 are on
  // different sides of the transition for every country except Western Sahara,
  // which only has a 1-month window
  assertEquals(
    daysBetweenDates('2020-01-01', '2020-08-01'),
    {
      days: 213, // Must be an integer
      startDate: '2020-01-01',
      endDate: '2020-08-01',
    }
  );

  // Western Sahara is on Standard Time only from April 20 through May 30th,
  // So May 1 is on Standard Time and June 1 is on Daylight Saving Time
  assertEquals(
    daysBetweenDates('2020-05-01', '2020-06-01'),
    {
      days: 31, // Must be an integer
      startDate: '2020-05-01',
      endDate: '2020-06-01',
    }
  );
});

/**
 * Tests which call `daysBetweenDates()` with 1 argument
 *
 * These are contained in an IIFE so that the function-under-test's implicit
 * use of its execution date can be validated.
 */
(() => {
  function isoString(date: Date, dayOffset: number = 0) {
    const newDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    newDate.setUTCDate(newDate.getUTCDate() + dayOffset);
    const newDateISO = newDate.toISOString().slice(0, 10); // 'yyyy-mm-dd'
    return newDateISO;
  }

  const now = new Date();
  const nowUTC = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const nowISO = isoString(now);
  const testStartDate = now.getUTCDate();

  Deno.test('daysBetweenDates [1 arg] same day', () => {
    assertEquals(
      daysBetweenDates(isoString(now, 0)),
      {
        days: 0,
        startDate: nowISO,
        endDate: isoString(now, 0),
      }
    );
  });

  Deno.test('daysBetweenDates [1 arg] future date', () => {
    assertEquals(
      daysBetweenDates(isoString(now, 1)),
      {
        days: 1,
        startDate: nowISO,
        endDate: isoString(now, 1),
      }
    );
  });

  Deno.test('daysBetweenDates [1 arg] past date', () => {
    assertEquals(
      daysBetweenDates(isoString(now, -1)),
      {
        days: -1,
        startDate: nowISO,
        endDate: isoString(now, -1),
      }
    );
  });

  (() => {
    const nowTzOffset = now.getTimezoneOffset();
    const MS_IN_DAY = 1000 * 60 * 60 * 24;
    const DAYS_IN_LEAP_YEAR = 366;
    let otherDate: Date;
    let hasDaylightSaving = false;

    for (let dayOffset = 1; dayOffset < DAYS_IN_LEAP_YEAR; dayOffset += 1) {
      otherDate = new Date(now.getTime() + MS_IN_DAY * dayOffset);

      if (otherDate.getTimezoneOffset() !== nowTzOffset) {
        hasDaylightSaving = true;
        break;
      }
    }

    Deno.test({
      name: 'daysBetweenDates [1 arg] daylight saving',
      ignore: !hasDaylightSaving,
      fn() {
        const otherDateISO = isoString(otherDate);
        const {days} = daysBetweenDates(otherDateISO);
        assert(
          days % 1 === 0,
          `daysBetweenDates('${otherDateISO}').days is not an integer: ${days}`
        );
      },
    });
  })();

  const testEndDate = new Date().getUTCDate();

  if (testStartDate !== testEndDate) {
    throw new Error(
      'Invalid test run: UTC date changed during test. Please run test again.'
    );
  }
})();

Deno.test('daysBetweenDates throws (invalid format)', () => {
  for (const date of INVALID_DATE_FORMATS) {
    assertThrows(
      () => {
        daysBetweenDates(date)
      },
      DateParseError,
      'Invalid date format:',
      `daysBetweenDates('${date}')`
    );
    assertThrows(
      () => {
        daysBetweenDates(date, date)
      },
      DateParseError,
      'Invalid date format:',
      `daysBetweenDates('${date}', '${date}')`
    );
  }
});

Deno.test('daysBetweenDates throws (invalid date)', () => {
  for (const date of INVALID_DATES) {
    assertThrows(
      () => {
        daysBetweenDates(date)
      },
      DateParseError,
      'Invalid date:',
      `daysBetweenDates('${date}')`
    );
    assertThrows(
      () => {
        daysBetweenDates(date, date)
      },
      DateParseError,
      'Invalid date:',
      `daysBetweenDates('${date}', '${date}')`
    );
  }
});
