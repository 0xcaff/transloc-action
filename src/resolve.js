// @flow
import type { Stop } from "transloc-api";
import type {
  DeviceLocation,
  FineDeviceLocation,
  Coordinates
} from "actions-on-google";
import { DialogflowApp } from "actions-on-google";
import type { OptionKey, OptionType } from "./intents/nextBusOption";
import { FROM_OPTION_TYPE, TO_OPTION_TYPE } from "./intents/nextBusOption";
import logger from "./logger";
import {
  coordsToPosition,
  distance,
  lowestCost,
  sortByDistance
} from "./utils";
import { handleUnknownStops } from "./responses";
import { getFromArg, getToArg } from "./arguments";
import type { Result, ResultDelegating, ResultSuccess } from "./result";

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
// Find a stop matching the specified query. If none can be found, a list of
// stops is shown to the user.
const findOrRequestMatchingStop = (
  app: DialogflowApp,
  query: string,
  stops: Stop[],
  type: OptionType
): Result<Stop> => {
  // From was provided, try finding a matching stop.
  const stop = findMatchingStop(query, stops);
  logger.info({ stop }, `found matching "${(type: any)}" stop`);
  if (!stop) {
    // No stop matches, return suggestions.
    askWithStopList(app, type, query, stops);
    return { type: "DELEGATING" };
  }

  return { type: "SUCCESS", value: stop };
};

// Displays a list of stops, sorted by closest match to furthest match.
const askWithStopList = (
  app: DialogflowApp,
  type: OptionType,
  stopName: string,
  potentialStops: Stop[]
): void => {
  const sortedPotentialStops: Stop[] = sortByDistance(
    potentialStops,
    stopName,
    stop => stop.name
  );

  handleUnknownStops(sortedPotentialStops, type, stopName, app);
};

// Tries to find the stop most closely named to `to`.
export const resolveToStop = (
  app: DialogflowApp,
  stops: Stop[]
): Result<Stop> => {
  const to: ?string = getToArg(app);
  if (!to) {
    return { type: "EMPTY" };
  }

  return findOrRequestMatchingStop(app, to, stops, TO_OPTION_TYPE);
};

// Tries to find the stop named most closely to `from`. If not provided,
// uses the current location. If not provided, requests the current location.
export const resolveFromStop = (
  app: DialogflowApp,
  stops: Stop[]
): Result<Stop> => {
  const from: ?string = getFromArg(app);

  if (!from) {
    // From not provided, try to use device location.
    return getStopByLocation(app, stops);
  }

  // From was provided, try finding a matching stop.
  return findOrRequestMatchingStop(app, from, stops, FROM_OPTION_TYPE);
};

// Tries to retrive the current location. Requests if needed.
export const mustGetLocation = (
  app: DialogflowApp,
  reason: string
): ResultSuccess<FineDeviceLocation> | ResultDelegating => {
  const location: ?DeviceLocation = app.getDeviceLocation();
  if (location && location.coordinates) {
    // The location was provided previously, let's use it.

    return { type: "SUCCESS", value: location };
  }

  // There was no suitable location, let's ask for permission.
  logger.info("requesting location permission");

  const fromLocation = app.askForPermission(
    reason,
    app.SupportedPermissions.DEVICE_PRECISE_LOCATION
  );

  if (fromLocation === null) {
    throw new TypeError(`Failed to ask for location permission.`);
  }

  // After this, the location is collected and the intent with the event
  // actions_intent_PERMISSION is triggered.
  return { type: "DELEGATING" };
};

// Get's the stop nearest to the current location. If the location isn't
// available, requests it.
const getStopByLocation = (app: DialogflowApp, stops: Stop[]): Result<Stop> => {
  const locationResult = mustGetLocation(app, "To find the nearest stop");

  if (locationResult.type === "DELEGATING") {
    return locationResult;
  }

  const { coordinates: deviceCoordinates } = locationResult.value;
  const nearestStop = findNearestStop(deviceCoordinates, stops);

  if (!nearestStop) {
    return { type: "EMPTY" };
  }

  return { type: "SUCCESS", value: nearestStop };
};

export const getStopFromOption = (
  app: DialogflowApp,
  option: OptionKey,
  type: OptionType,
  stops: Stop[]
): Result<Stop> => {
  if (option.type !== type) {
    return { type: "EMPTY" };
  }

  const stop = getStopById(option.id, stops);
  if (!stop) {
    logger.warn({ option, stops }, "missing selected stop");
    app.tell(`The selected stop couldn't be found.`);
    return { type: "DELEGATING" };
  }

  return { type: "SUCCESS", value: stop };
};

export const getStopById = (stopId: number, stops: Stop[]): ?Stop =>
  stops.find(stop => stop.id === stopId);
