import {DateParseError, daysBetweenDates} from './mod.ts';

const help = `Calculate the number of days between 2 ISO-formatted dates.

USAGE:
    $exe [start-date] <end-date>

    \`start-date\` defaults to today.

EXAMPLE:
    # Days between Deno v0.0.1 and v1.0.0
    $exe 2018-08-17 2020-05-13
`;

interface CLIOutput {
  message: string;
  exitCode: 0 | 1;
}

function main(args: string[]): CLIOutput {
  if (args.includes('-h') || args.includes('--help')) {
    return {
      message: help,
      exitCode: 0,
    };
  }

  if (args.length < 1 || args.length > 2) {
    return {
      message: help,
      exitCode: 1,
    };
  }

  let result;

  try {
    result = daysBetweenDates(...args as [string, string?]);
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

  const {days, startDate, endDate} = result;

  return {
    message: `${startDate} – ${endDate}: ${days} days`,
    exitCode: 0,
  };
}

if (import.meta.main) {
  const {message, exitCode} = main(Deno.args);
  const consoleFn = exitCode === 0
    ? 'log'
    : 'error';

  console[consoleFn](message);
  Deno.exit(exitCode);
}
