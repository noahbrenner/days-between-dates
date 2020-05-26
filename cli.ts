import {DateParseError, daysBetweenDates} from './mod.ts';

if (import.meta.main) {
  try {
    console.log(daysBetweenDates('2020-01-01'));
  } catch (error) {
    if (error instanceof DateParseError) {
      console.error(error.message);
      Deno.exit(1);
    } else {
      throw error;
    }
  }
}
