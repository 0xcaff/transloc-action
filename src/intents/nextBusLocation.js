// @flow
import type { DialogflowApp } from "actions-on-google";
import type { Stop } from "transloc-api";
import { getStops } from "../data/index";
import logger from "../logger";
import { FROM_STOP_KEY, storeLocationContext } from "../context";
import { findNearestStop } from "../resolve";
import { displayStopsList, findAndShowArrivals } from "../responses";
import { FROM_OPTION_TYPE } from "./nextBusOption";
import type { Result } from "../result";
import { resolveToStop } from "../resolve";
import { convertResult, must } from "../result";
import { getStoredUserAgency } from "../agencies";

// Called in response to a permission request for the current location.
export const nextBusLocation = async (app: DialogflowApp): Promise<void> => {
  logger.info("nextBusLocation");

  const agency = must(
    app,
    getStoredUserAgency(app),
    `Sorry, but I don't know which agency you belong to. Please try again later.`,
    "missing stored agency"
  );

  if (agency.type === "DELEGATING") {
    return;
  }

  const agencies = [agency.value];

  const { stops, routes } = await getStops({ agencies, include_stops: true });
  const location = app.getDeviceLocation();

  // Parse Response From Handler
  if (!app.isPermissionGranted() || !location || !location.coordinates) {
    // The user rejected providing their location. Let's just show them a
    // list of possible stops instead.
    const unknownLocationMessage =
      "I couldn't find the nearest stop without your location.";

    handleFailure(unknownLocationMessage, app, stops);
    return;
  }

  // Permission Granted, Get Nearest Stop
  const { coordinates: deviceCoordinates } = location;
  const nearestStop = findNearestStop(deviceCoordinates, stops);

  if (!nearestStop) {
    // There were no stops, so there isn't a nearest stop.

    const noNearestStopMessage = `I couldn't find any stops. Please try again later.`;
    app.tell(noNearestStopMessage);
    return;
  }

  // Set "from" Context
  storeLocationContext(app, FROM_STOP_KEY, nearestStop);

  // Get "to" Information
  const maybeToStop: Result<Stop> = resolveToStop(app, stops);
  if (maybeToStop.type === "DELEGATING") {
    logger.info("delegating to stop resolution");
    return;
  }

  const convertedMaybeToStop: ?Stop = convertResult(maybeToStop);

  return findAndShowArrivals(
    app,
    nearestStop,
    convertedMaybeToStop,
    routes,
    agencies
  );
};

const handleFailure = (message: string, app: DialogflowApp, stops: Stop[]) => {
  if (!app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
    app.tell(message);
    return;
  }

  return app.askWithList(
    [message, `Try one of the following stops.`].join(" "),
    displayStopsList(app, FROM_OPTION_TYPE, stops)
  );
};
