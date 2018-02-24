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

const logger = {
  info(first: Object | string, second: ?string) {
    const normalizedFirst = normalizeFirst(first);
    const normalizedSecond = normalizeSecond(second);

    console.log(normalizedFirst, normalizedSecond);
  }
};

export default logger;
