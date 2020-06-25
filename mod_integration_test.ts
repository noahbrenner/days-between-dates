import {
  assert,
  assertEquals,
  assertStrictEquals,
  assertThrows,
  fail,
} from './deps_dev.ts';
import {
  DateParseError,
  daysBetweenDates,
} from './mod.ts';

// NOTE: When calling `daysBetweenDates` with only 1 argument, there is an
// implicit dependency on calling `new Date()`, which is not deterministic.
// That's why tests for `daysBetweenDates` are not unit tests.

Deno.test('daysBetweenDates [2 args] same day', () => {
  assertEquals(
    daysBetweenDates('2020-01-01', '2020-01-01'),
    {
      startISO: '2020-01-01',
      endISO: '2020-01-01',
      days: 0,
    }
  );
});

Deno.test('daysBetweenDates [2 args] 1-day future offset', () => {
  assertEquals(
    daysBetweenDates('2020-01-01', '2020-01-02'),
    {
      startISO: '2020-01-01',
      endISO: '2020-01-02',
      days: 1,
    }
  );
});

Deno.test('daysBetweenDates [2 args] 1-day past offset', () => {
  assertEquals(
    daysBetweenDates('2020-01-01', '2019-12-31'),
    {
      startISO: '2020-01-01',
      endISO: '2019-12-31',
      days: -1,
    }
  );
});

Deno.test('daysBetweenDates [2 args] returns integer (daylight saving)', () => {
  /*
   * NOTE: These tests are imperfect, because they're only meaningful if the
   * locale where the test is executed observes Daylight Saving Time.
   *
   * Reference for dates by country for which Daylight Saving is observed:
   * https://en.wikipedia.org/wiki/Daylight_saving_time_by_country
   */

  // For countries that observe Daylight Saving, January 1 and August 1 are on
  // different sides of the transition for every country except Western Sahara,
  // which only has a 1-month window
  assert(Number.isInteger(
    daysBetweenDates('2020-01-01', '2020-08-01').days
  ));

  // Western Sahara is on Standard Time only from April 20 through May 30th,
  // so May 1 is on Standard Time and June 1 is on Daylight Saving Time
  assert(Number.isInteger(
    daysBetweenDates('2020-05-01', '2020-06-01').days
  ));
});

/**
 * Tests which call `daysBetweenDates()` with 1 argument
 *
 * These are contained in an IIFE so that we can verify whether the local date
 * remained the same between the beginning and end of the tests.
 */
(() => {
  // Helper function
  function getISOStringWithOffset(date: Date, dayOffset: number) {
    assert(
      Number.isInteger(dayOffset),
      'getISOStringWithOffset() must be called with an integer offset'
    );
    const newDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset)
    );
    const newDateISO = newDate.toISOString().slice(0, 10); // 'yyyy-mm-dd'
    return newDateISO;
  }

  const NOW = new Date();
  const NOW_ISO = getISOStringWithOffset(NOW, 0);
  const TEST_START_DATE = NOW.getUTCDate();

  Deno.test('daysBetweenDates [1 arg] same day', () => {
    assertEquals(
      daysBetweenDates(getISOStringWithOffset(NOW, 0)),
      {
        days: 0,
        startISO: NOW_ISO,
        endISO: getISOStringWithOffset(NOW, 0),
      }
    );
  });

  Deno.test('daysBetweenDates [1 arg] future date', () => {
    assertEquals(
      daysBetweenDates(getISOStringWithOffset(NOW, 1)),
      {
        days: 1,
        startISO: NOW_ISO,
        endISO: getISOStringWithOffset(NOW, 1),
      }
    );
  });

  Deno.test('daysBetweenDates [1 arg] past date', () => {
    assertEquals(
      daysBetweenDates(getISOStringWithOffset(NOW, -1)),
      {
        days: -1,
        startISO: NOW_ISO,
        endISO: getISOStringWithOffset(NOW, -1),
      }
    );
  });

  // Test behavior across Daylight Saving time, if observed in current locale
  (() => {
    const nowTzOffset = NOW.getTimezoneOffset();
    const MS_IN_DAY = 1000 * 60 * 60 * 24;
    const DAYS_IN_LEAP_YEAR = 366;

    let otherDate: Date;
    let hasDaylightSaving = false;
    for (let dayOffset = 1; dayOffset < DAYS_IN_LEAP_YEAR; dayOffset += 1) {
      otherDate = new Date(NOW.getTime() + MS_IN_DAY * dayOffset);

      if (otherDate.getTimezoneOffset() !== nowTzOffset) {
        hasDaylightSaving = true;
        break;
      }
    }

    Deno.test({
      name: 'daysBetweenDates [1 arg] returns integer (daylight saving)',
      ignore: !hasDaylightSaving,
      fn() {
        const otherDateISO = getISOStringWithOffset(otherDate, 0);
        const {days} = daysBetweenDates(otherDateISO);
        assert(
          Number.isInteger(days),
          `daysBetweenDates('${otherDateISO}').days is not an integer: ${days}`
        );
      },
    });
  })();

  // NOTE: This MUST be the last test inside the containing IIFE
  Deno.test('Local Date-dependent tests began and ended on same date', () => {
    const TEST_END_DATE = new Date().getUTCDate();
    // If this assertion fails, the date changed between the start and end of
    // executing the containing IIFE: THIS TEST FILE SHOULD BE RUN AGAIN
    assertStrictEquals(TEST_START_DATE, TEST_END_DATE);
  });
})();

Deno.test('daysBetweenDates throws (invalid format)', () => {
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
