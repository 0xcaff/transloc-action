// @flow

// This is on its own because it is easier to mock a module than a function.

// The current time in integer epoch seconds.
export const now = (): number => Math.floor(+new Date() / 1000);
