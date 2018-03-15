// @flow
import type {
  DialogflowApp,
  Coordinates,
  FineDeviceLocation
} from "actions-on-google";
import type { ResultDelegating, ResultEmpty, ResultSuccess } from "./result";
import { mustGetLocation } from "./resolve";
import { coordsToPosition, distance, lowestCost } from "./utils";
import { getAgencies } from "./data/agencies";
import type { Agency } from "transloc-api";
import type { UserData } from "./userData";
import { fail } from "./result";

// Gets the user's agency. If none is set requests for the location.
export const getUserAgency = async (
  app: DialogflowApp
): Promise<ResultSuccess<number> | ResultDelegating> => {
  const maybeStoredAgency = getStoredUserAgency(app);
  if (maybeStoredAgency.type === "SUCCESS") {
    return maybeStoredAgency;
  }

  const locationResult = mustGetLocation(
    app,
    "To find the nearest transit agency"
  );
  if (locationResult.type === "DELEGATING") {
    return locationResult;
  }

  return findUserAgency(app, locationResult.value);
};

export const findUserAgency = async (
  app: DialogflowApp,
  location: FineDeviceLocation
): Promise<ResultDelegating | ResultSuccess<number>> => {
  const { agencies } = await getAgencies({});
  const { coordinates: deviceCoordinates } = location;
  const nearestAgency = findNearestAgency(agencies, deviceCoordinates);
  if (!nearestAgency) {
    fail(
      app,
      `I couldn't find the nearest agency.`,
      "failed to find nearest agency"
    );

    return { type: "DELEGATING" };
  }

  return { type: "SUCCESS", value: nearestAgency.id };
};

export const setUserAgency = (app: DialogflowApp, agencyId: number): void => {
  const userStorage: UserData = app.userStorage;
  userStorage.agency_id = agencyId;
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
const findNearestAgency = (
  agencies: Agency[],
  position: Coordinates
): ?Agency =>
  lowestCost(agencies, agency => {
    const devicePosition = coordsToPosition(position);
    const distanceToAgency = distance(devicePosition, agency.position);

    return distanceToAgency;
  });
