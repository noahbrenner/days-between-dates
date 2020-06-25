import {DateParseError, daysBetweenDates} from './mod.ts';

export const HELP = `Calculate the number of days between 2 ISO-formatted dates.

USAGE:
    days-between-dates [start-date] <end-date>

    \`start-date\` defaults to today.

EXAMPLE:
    # Days between Deno v0.0.1 and v1.0.0
    days-between-dates 2018-08-17 2020-05-13
`;

interface CLIOutput {
  message: string;
  exitCode: 0 | 1;
}

export function cli(
  fn: typeof daysBetweenDates,
  args: string[]
): CLIOutput {
  if (args.includes('-h') || args.includes('--help')) {
    return {
      message: HELP,
      exitCode: 0,
    };
  }

  if (args.length < 1 || args.length > 2) {
    return {
      message: HELP,
      exitCode: 1,
    };
  }

  let result;

  try {
    result = fn(...args as [string, string?]);
  } catch (error) {
    if (error instanceof DateParseError) {
      return {
        message: error.message,
        exitCode: 1,
      };
    } else {
      throw error;
    }
  }

  const {days, startISO, endISO} = result;

  return {
    message: `${startISO} – ${endISO}: ${days} days`,
    exitCode: 0,
  };
}

if (import.meta.main) {
  const {message, exitCode} = cli(daysBetweenDates, Deno.args);
  const consoleFn = exitCode === 0
    ? 'log'
    : 'error';

  console[consoleFn](message);
  Deno.exit(exitCode);
}
