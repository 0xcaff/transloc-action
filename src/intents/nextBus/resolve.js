// @flow
import type { Stop } from "transloc-api/lib/endpoints/stops";
import { DialogflowApp } from "actions-on-google";
import type { OptionKey, OptionType } from "./option";
import { findMatchingStop, findNearestStop } from "./utils";
import logger from "../../logger";
import { sortByDistance } from "../../utils";
import { handleUnknownStops } from "./responses";
import { FROM_OPTION_TYPE, TO_OPTION_TYPE } from "./option";
import { getFromArg, getToArg } from "./arguments";

// A request has been made for more information from the user.
export type StopResultDelegating = { type: "DELEGATING" };

// The stop has successfully been resolved.
export type StopResultSuccess = { type: "SUCCESS", stop: Stop };

// There is no stop to resolve.
export type StopResultEmpty = { type: "EMPTY" };

// A container the result of a stop resolution.
export type StopResult =
  | StopResultDelegating
  | StopResultSuccess
  | StopResultEmpty;

// Converts StopResult to a ?Stop.
export const convertStopResult = (
  r: StopResultSuccess | StopResultEmpty
): ?Stop => {
  if (r.type === "EMPTY") {
    return null;
  }

  return r.stop;
};

// Find a stop matching the specified query. If none can be found, a list of
// stops is shown to the user.
const findOrRequestMatchingStop = (
  app: DialogflowApp,
  query: string,
  stops: Stop[],
  type: OptionType
): StopResult => {
  // From was provided, try finding a matching stop.
  const stop = findMatchingStop(query, stops);
  logger.info({ stop }, `found matching "${(type: any)}" stop`);
  if (!stop) {
    // No stop matches, return suggestions.
    askWithStopList(app, type, query, stops);
    return { type: "DELEGATING" };
  }

  return { type: "SUCCESS", stop: stop };
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
): StopResult => {
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
): StopResult => {
  const from: ?string = getFromArg(app);

  if (!from) {
    // From not provided, try to use device location.
    return getStopByLocation(app, stops);
  }

  // From was provided, try finding a matching stop.
  return findOrRequestMatchingStop(app, from, stops, FROM_OPTION_TYPE);
};

// Get's the stop nearest to the current location. If the location isn't
// available, requests it.
const getStopByLocation = (app: DialogflowApp, stops: Stop[]): StopResult => {
  const location = app.getDeviceLocation();
  if (location && location.coordinates) {
    // The location was provided previously, let's use it.

    const { coordinates: deviceCoordinates } = location;
    const nearestStop = findNearestStop(deviceCoordinates, stops);

    if (nearestStop) {
      return { type: "SUCCESS", stop: nearestStop };
    }
  }

  // There was no suitable location, let's ask for permission.
  logger.info("requesting location permission");

  const fromLocation = app.askForPermission(
    "To find the nearest stop",
    app.SupportedPermissions.DEVICE_PRECISE_LOCATION
  );

  if (fromLocation === null) {
    throw new TypeError(`Failed to ask for location permission.`);
  }

  // After this, the location is collected and the intent with the event
  // actions_intent_PERMISSION is triggered.

  return { type: "DELEGATING" };
};

export const getStopFromOption = (
  app: DialogflowApp,
  option: OptionKey,
  type: OptionType,
  stops: Stop[]
): StopResult => {
  if (option.type !== type) {
    return { type: "EMPTY" };
  }

  const stop = getStopById(option.id, stops);
  if (!stop) {
    logger.warn({ option, stops }, "missing selected stop");
    app.tell(`The selected stop couldn't be found.`);
    return { type: "DELEGATING" };
  }

  return { type: "SUCCESS", stop };
};

// Reports an error for empty results.
export const must = (
  app: DialogflowApp,
  r: StopResult,
  message: string,
  logMessage: string
): StopResultSuccess | StopResultDelegating => {
  if (r.type === "EMPTY") {
    app.tell(message);
    logger.warn(logMessage);
    return { type: "DELEGATING" };
  }

  return r;
};

export const getStopById = (stopId: number, stops: Stop[]): ?Stop =>
  stops.find(stop => stop.id === stopId);
