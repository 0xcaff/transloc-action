export type Coords = {
  latitude: number,
  longitude: number
};

export const positionToCoordinates = ([latitude, longitude]: Position) => ({
  latitude,
  longitude
});

export const squaredDist = (a: Coords, b: Coords): number =>
  (a.latitude - b.latitude) ** 2 + (a.longitude - b.longitude) ** 2;

// The current time a epoch seconds.
const now = (): number => +new Date() / 1000;

// The amount of seconds until this time.
export const timeUntil = (time: number) => time - now();

// A human readable duration string from the number of seconds.
export const humanizeDuration = (time: number) => {
  if (time > 60) {
    return `${Math.floor(time / 60)} minutes`;
  }

  return `${time} seconds`;
};
