import {
  assertEquals,
  assertStrictEquals,
  fail,
} from './deps_dev.ts';
import {cli, HELP} from './cli.ts';
import {DateParseError, daysBetweenDates} from './mod.ts';

const INVALID_DATE = 'INVALID_DATE';
const OMITTED_DATE = 'OMITTED_DATE';
const MOCK_DAYS = 42;

const mockFn: typeof daysBetweenDates = (arg1: string, arg2?: string) => {
  if (arg1 === INVALID_DATE || arg2 === INVALID_DATE) {
    throw new DateParseError(INVALID_DATE);
  }

  return {
    days: MOCK_DAYS,
    startISO: arg1,
    endISO: arg2 ?? OMITTED_DATE,
  };
};

Deno.test('cli shows help when `--help` is in args', () => {
  const inputs = [
    ['--help'],
    ['--help', INVALID_DATE],
    ['--help', INVALID_DATE, INVALID_DATE],
    [INVALID_DATE, '--help', INVALID_DATE],
    [INVALID_DATE, INVALID_DATE, '--help'],
  ];

  const expectedResult = {
    message: HELP,
    exitCode: 0,
  };

  for (const input of inputs) {
    const result = cli(mockFn, input);

    assertEquals(
      result,
      expectedResult,
      [
        'Incorrect output from cli():',
        '\nPASSED:', Deno.inspect(input),
        '\nEXPECTED:', Deno.inspect(expectedResult),
        '\nRECEIVED:', Deno.inspect(result),
        '',
      ].join('\n')
    );
  }
});

Deno.test('cli shows help when `-h` is in args', () => {
  const inputs = [
    ['-h'],
    ['-h', INVALID_DATE],
    ['-h', INVALID_DATE, INVALID_DATE],
    [INVALID_DATE, '-h', INVALID_DATE],
    [INVALID_DATE, INVALID_DATE, '-h'],
  ];

  const expectedResult = {
    message: HELP,
    exitCode: 0,
  };

  for (const input of inputs) {
    const result = cli(mockFn, input);

    assertEquals(
      result,
      expectedResult,
      [
        'Incorrect output from cli():',
        '\nPASSED:', Deno.inspect(input),
        '\nEXPECTED:', Deno.inspect(expectedResult),
        '\nRECEIVED:', Deno.inspect(result),
        '',
      ].join('\n')
    );
  }
});

Deno.test('cli errors & shows help when called with 0 args', () => {
  assertEquals(
    cli(mockFn, []),
    {
      message: HELP,
      exitCode: 1,
    }
  );
});

Deno.test('cli errors & shows help when called with 3 args', () => {
  assertEquals(
    cli(mockFn, ['1', '2', '3']),
    {
      message: HELP,
      exitCode: 1,
    }
  );
});

Deno.test('cli errors when `DateParseError` is thrown [1 arg]', () => {
  assertEquals(
    cli(mockFn, [INVALID_DATE]),
    {
      message: INVALID_DATE,
      exitCode: 1,
    },
  );
});

Deno.test('cli errors when `DateParseError` is thrown [2 args]', () => {
  assertEquals(
    cli(mockFn, [INVALID_DATE, INVALID_DATE]),
    {
      message: INVALID_DATE,
      exitCode: 1,
    },
  );
});

Deno.test('cli re-throws when `Error` is thrown [1 arg]', () => {
  const mockError = new Error();
  const mockErrorFn = (arg1: string, arg2?: string) => {
    throw mockError;
  };

  let result;

  try {
    result = cli(mockErrorFn, ['1']);
  } catch (error) {
    assertStrictEquals(
      error,
      mockError,
      [
        'Expected mock error to be re-thrown, but got new error instance',
        '\nMOCK ERROR:', Deno.inspect(mockError),
        '\nTHROWN ERROR:', Deno.inspect(error),
        '',
      ].join('\n')
    );
  }

  if (result) {
    const prettyResult = Deno.inspect(result);
    fail(`Expected function to throw, but it returned:\n\n${prettyResult}\n`);
  }
});

Deno.test('cli re-throws when `Error` is thrown [2 args]', () => {
  const mockError = new Error();
  const mockErrorFn = (arg1: string, arg2?: string) => {
    throw mockError;
  };

  let result;

  try {
    result = cli(mockErrorFn, ['1', '2']);
  } catch (error) {
    assertStrictEquals(
      error,
      mockError,
      [
        'Expected mock error to be re-thrown, but got new error instance',
        '\nMOCK ERROR:', Deno.inspect(mockError),
        '\nTHROWN ERROR:', Deno.inspect(error),
        '',
      ].join('\n')
    );
  }

  if (result) {
    const prettyResult = Deno.inspect(result);
    fail(`Expected function to throw, but it returned:\n\n${prettyResult}\n`);
  }
});

Deno.test('cli formats result for valid input [1 arg]', () => {
  assertEquals(
    cli(mockFn, ['ARG_ONE']),
    {
      message: `ARG_ONE – ${OMITTED_DATE}: ${MOCK_DAYS} days`,
      exitCode: 0,
    }
  );
});

Deno.test('cli formats result for valid input [2 args]', () => {
  assertEquals(
    cli(mockFn, ['ARG_ONE', 'ARG_TWO']),
    {
      message: `ARG_ONE – ARG_TWO: ${MOCK_DAYS} days`,
      exitCode: 0,
    }
  );
});
