// @flow
import type { Position } from "transloc-api";
import { now } from "./now";

type Identifiable<T> = {
  id: T
};

export const addToMap = <I, T: Identifiable<I>>(map: Map<I, T>, item: T) => {
  map.set(item.id, item);
};

export const makeMap = <I, T: Identifiable<I>>(list: T[]): Map<I, T> =>
  list.reduce((map, identifiable: T) => {
    addToMap(map, identifiable);
    return map;
  }, new Map());

export const lowestCost = <T>(list: T[], costFn: T => number): ?T => {
  const { cheapestItem } = list.reduce(
    ({ lowestCost, cheapestItem }, item) => {
      const itemCost = costFn(item);

      if (itemCost < lowestCost) {
        return { lowestCost: itemCost, cheapestItem: item };
      }

      return { lowestCost, cheapestItem };
    },
    { lowestCost: Infinity, cheapestItem: null }
  );

  return cheapestItem;
};

export type Coords = {
  latitude: number,
  longitude: number
};

export const coordsToPosition = (c: Coords): Position => [
  c.latitude,
  c.longitude
];

const haversineDistance = (
  [lat1, lon1]: Position,
  [lat2, lon2]: Position
): number => {
  const radius = 6371e3;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = radius * c;
  return distance;
};

const deg2rad = (deg: number): number => deg * (Math.PI / 180);

export const distance = haversineDistance;

// The amount of seconds until this time.
export const timeUntil = (time: number) => time - now();

type SimpleDuration = {
  unit: string,
  count: number
};

export const simplifyDuration = (time: number): SimpleDuration => {
  if (time > 60) {
    return { unit: "minute", count: Math.floor(time / 60) };
  }

  return { unit: "second", count: time };
};

export const ssmlDuration = ({ count, unit }: SimpleDuration): string =>
  `<say-as interpret-as="unit">${count} ${unit}</say-as>`;

export const ssml = (
  literals: string[],
  ...substitutions: string[]
): string => {
  const raw = literals.reduce(
    (out, str, i) => (i ? out + substitutions[i - 1] + str : str)
  );

  return `<ssml>${raw}</ssml>`;
};

export const escape = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const pluralizedDurationSuffix = ({ count, unit }: SimpleDuration) => {
  if (count > 1) {
    return simplePluralize(unit);
  }

  return unit;
};

const simplePluralize = (unit: string): string => `${unit}s`;
