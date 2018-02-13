// @flow
import {
  addToMap,
  coordsToPosition,
  distance,
  lowestCost,
  makeMap,
  simplifyDuration,
  ssml,
  ssmlDuration
} from "./utils";
import { now } from "./now";

type IdentifiableType = {
  id: string,
  value: number
};

it("should add an element to a map", () => {
  const map: Map<string, IdentifiableType> = new Map();
  const item = { id: "hello", value: 10 };
  addToMap(map, item);

  expect(map.get("hello")).toBe(item);
});

it("should build a map with all elements from the array", () => {
  const items: IdentifiableType[] = [
    { id: "afcjla", value: 1 },
    { id: "dfa", value: 10 }
  ];

  const map = makeMap(items);
  const entries = Array.from(map.entries());

  expect(entries).toEqual(items.map(item => [item.id, item]));
});

it("should find the item with the lowest cost", () => {
  const items = [
    { cost: 10 },
    { cost: 0 },
    { cost: -10 },
    { cost: 300 },
    { cost: -30 }
  ];

  const lowestCostItem = lowestCost(items, ({ cost }) => cost);
  expect(lowestCostItem).toEqual({ cost: -30 });
});

it("should convert coordinates to position", () => {
  const longitude = 10;
  const latitude = 20;

  expect(coordsToPosition({ longitude, latitude })).toEqual([
    latitude,
    longitude
  ]);
});

it("should calculate distance correctly", () => {
  const a = [43.084466, -77.679465];
  const b = [43.084472, -77.679472];

  const dist = distance(a, b);

  expect(dist).toBeCloseTo(8.765e-1, 1e-3);
});

// TODO: Test timeUntil

describe("simplify duration", () => {
  it("should simplify minutes", () =>
    expect(simplifyDuration(100.321)).toEqual({ unit: "minute", count: 1 }));

  it("should simplify seconds", () =>
    expect(simplifyDuration(30)).toEqual({ unit: "second", count: 30 }));
});

it("should wrap duration in ssml", () => {
  const got = ssmlDuration({ count: 10, unit: "second" });
  expect(got).toBe(`<say-as interpret-as="unit">10 second</say-as>`);
});

it("should wrap the contents in ssml tags", () =>
  expect(ssml`hello world`).toEqual(`<ssml>hello world</ssml>`));
