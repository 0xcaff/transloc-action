// @flow
import type { Stop } from "transloc-api";

import type { Coordinates } from "actions-on-google";
import { coordsToPosition, distance, lowestCost } from "../../utils";

// Find the nearest stop the the specified co-ordinates.
export const findNearestStop = (to: Coordinates, stops: Stop[]): ?Stop =>
  lowestCost(stops, stop => {
    const devicePosition = coordsToPosition(to);
    const distanceToStop = distance(devicePosition, (stop.position: any));

    return distanceToStop;
  });

// Finds the stop which most closely matches the query. If there isn't a
// close match, returns null.
export const findMatchingStop = (query: ?string, stops: Stop[]): ?Stop => {
  if (!query) {
    return;
  }

  const normalizedFrom = query.toLowerCase().trim();
  const stop = stops.find(
    element => element.name.toLowerCase().trim() === normalizedFrom
  );

  return stop;
};
