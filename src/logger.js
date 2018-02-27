// @flow
const normalizeFirst = (first: Object | string): string => {
  if (typeof first === "object") {
    // JSON.stringify is needed because otherwise only the first few levels
    // of the object are printed.
    return JSON.stringify(first);
  } else {
    return first;
  }
};

const normalizeSecond = (second: ?string): string => {
  if (second) {
    return second;
  }

  return "";
};

type ConsoleLogger = (...args: any[]) => void;

type Logger = (first: Object | string, second: ?string) => void;

const makeLogger = (log: ConsoleLogger): Logger => (
  first: Object | string,
  second: ?string
): void => {
  const normalizedFirst = normalizeFirst(first);
  const normalizedSecond = normalizeSecond(second);

  log(normalizedFirst, normalizedSecond);
};

const logger = {
  // eslint-disable-next-line no-console
  info: makeLogger(console.log),

  // eslint-disable-next-line no-console
  error: makeLogger(console.error),

  // eslint-disable-next-line no-console
  warn: makeLogger(console.warn)
};

export default logger;
