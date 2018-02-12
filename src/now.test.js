// @flow
import { now } from "./now";

describe("now", () => {
  it("should be an integer time", () => {
    const time = now();
    expect(time).toBe(Math.floor(time));
  });
});
