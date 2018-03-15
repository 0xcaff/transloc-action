// @flow
import type { Position } from "transloc-api";
import type { Coordinates } from "actions-on-google";
import { now } from "./now";
import levenshtein from "fast-levenshtein";

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

export const coordsToPosition = (c: Coordinates): Position => [
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
  minutes: number,
  seconds: number
};

export const simplifyDuration = (inputSeconds: number): SimpleDuration => {
  const minutes = Math.floor(inputSeconds / 60);
  const seconds = Math.floor(inputSeconds - minutes * 60);

  return { minutes, seconds };
};

export const stringifyDuration = (simpleDuration: SimpleDuration): string => {
  const mins = `${simpleDuration.minutes} ${pluralizeByCount(
    "minute",
    simpleDuration.minutes
  )}`;

  if (simpleDuration.minutes > 3) {
    return mins;
  }

  const secs = `${simpleDuration.seconds} ${pluralizeByCount(
    "second",
    simpleDuration.seconds
  )}`;

  if (simpleDuration.minutes < 1) {
    return secs;
  }

  return `${mins} and ${secs}`;
};

export const pluralizeByCount = (str: string, count: number): string => {
  if (count > 1) {
    return pluralize(str);
  }

  return str;
};

const SPECIAL_ENDINGS = ["s", "ss", "sh", "ch", "x", "z"];

export const pluralize = (s: string): string => {
  if (SPECIAL_ENDINGS.find(ending => s.endsWith(ending))) {
    return `${s}es`;
  }

  return `${s}s`;
};

export const pluralizeDo = (count: number) => {
  if (count > 1) {
    return "are";
  }

  return "is";
};

export const mustGet = <K: any, V>(map: Map<K, V>, k: K): V => {
  const result = map.get(k);
  if (!result) {
    throw new TypeError(
      `Failed to get value from map. Map: ${map.toString()}, Key: ${k}.`
    );
  }

  return result;
};

export const sortByDistance = <T>(
  items: T[],
  to: string,
  getter: T => string
): T[] => {
  const mapped = items.slice().map((item: T) => ({
    item,
    distance: levenshtein.get(to, getter(item))
  }));

  const sorted = mapped.sort(
    ({ distance: aDistance }, { distance: bDistance }) => aDistance - bDistance
  );

  return sorted.map(({ item }) => item);
};
