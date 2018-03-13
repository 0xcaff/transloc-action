// @flow
import type { DialogflowApp, Coordinates } from "actions-on-google";
import type { ResultDelegating, ResultEmpty, ResultSuccess } from "./result";
import { mustGetLocation } from "./resolve";
import { coordsToPosition, distance, lowestCost } from "./utils";
import { getAgencies } from "./data/agencies";
import type { Agency } from "transloc-api";
import type { UserData } from "./userData";
import logger from "./logger";

// Gets the user's agency. If none is set, sets it to the nearest agency.
export const getUserAgency = async (
  app: DialogflowApp
): Promise<ResultSuccess<number> | ResultDelegating> => {
  const maybeStoredAgency = getStoredUserAgency(app);
  if (maybeStoredAgency.type === "SUCCESS") {
    return maybeStoredAgency;
  }

  const locationResult = mustGetLocation(app, "To find nearest transit agency");
  if (locationResult.type === "DELEGATING") {
    return locationResult;
  }

  const { agencies } = await getAgencies({});
  const { coordinates: deviceCoordinates } = locationResult.value;
  const nearestAgency = findNearestAgency(agencies, deviceCoordinates);
  if (!nearestAgency) {
    app.tell(`I couldn't find the nearest agency.`);
    logger.warn(`couldn't find the nearest agency`);

    return { type: "DELEGATING" };
  }

  // TODO: Notify User Of Set Agency
  return { type: "SUCCESS", value: nearestAgency.id };
};

export const getStoredUserAgency = (
  app: DialogflowApp
): ResultSuccess<number> | ResultEmpty => {
  const userStorage: UserData = app.userStorage;
  if (userStorage.agency_id) {
    return { type: "SUCCESS", value: userStorage.agency_id };
  }

  return { type: "EMPTY" };
};

// Finds the nearest agency
const findNearestAgency = (agencies: Agency[], position: Coordinates) =>
  lowestCost(agencies, agency => {
    const devicePosition = coordsToPosition(position);
    const distanceToAgency = distance(devicePosition, agency.position);

    return distanceToAgency;
  });
