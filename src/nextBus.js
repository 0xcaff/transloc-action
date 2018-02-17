// @flow
import type { DialogflowApp } from "actions-on-google";
import type { Arrival, Position, Route, Stop, RouteStops } from "transloc-api";
import { getArrivals, getRoutes, getStops } from "transloc-api";
import type { Coords } from "./utils";
import {
  coordsToPosition,
  distance,
  simplifyDuration,
  lowestCost,
  makeMap,
  timeUntil,
  pluralizedDurationSuffix
} from "./utils";

import logger from "./logger";

export const NEXT_BUS_INTENT = "bus.next";
export const NEXT_BUS_LOCATION_INTENT = "bus.next.location";

const agencies = ["643"];

export const FROM_ARGUMENT = "from";

const getFromArg = (app: DialogflowApp): ?string =>
  app.getArgument(FROM_ARGUMENT);

export const TO_ARGUMENT = "to";

const getToArg = (app: DialogflowApp): ?string => app.getArgument(TO_ARGUMENT);

export const nextBus = async (app: DialogflowApp): Promise<void> => {
  logger.info("handling next bus intent");

  const to = getToArg(app);
  const from = getFromArg(app);
  logger.info({ to, from }, "arguments");

  const { stops, routes } = await getStops({ agencies, include_routes: !!to });
  logger.info({ stops, routes }, "getStops response");

  const fromStop: ?Stop = await resolveStop(app, from, stops);
  if (!fromStop) {
    return;
  }
  logger.info({ fromStop }, "resolved from stop");

  const { arrivals } = await getArrivals({ agencies, stop_id: fromStop.id });
  logger.info({ arrivals }, "getArrivals response");
  if (!arrivals.length) {
    app.tell(`There are no buses arriving at ${fromStop.name}.`);
    return;
  }

  const routeMap: Map<number, Route> = await buildRouteMap();
  let filteredArrivals = arrivals;
  let resolvedToStop = null;
  if (to) {
    const toStop = findMatchingStop(to, stops);
    logger.info({ toStop }, "found matching to stop");
    if (!toStop) {
      app.tell(`I couldn't find a stop named "${to}."`);
      return;
    }

    if (!routes) {
      app.tell("Something went wrong. Try again later.");
      return;
    }

    const routeStopsMap: Map<number, RouteStops> = makeMap(routes);
    filteredArrivals = arrivals.filter(({ route_id }) => {
      const route: ?RouteStops = routeStopsMap.get(route_id);
      if (!route) {
        logger.warn(
          `Invariant Violated, couldn't find route in routeStopsMap`,
          route_id,
          routeStopsMap
        );
        return false;
      }

      const hasStopInRoute =
        route.stops.findIndex(stopId => stopId === toStop.id) !== -1;
      return hasStopInRoute;
    });

    resolvedToStop = toStop;
  }

  logger.info({ filteredArrivals }, "filter arrivals");

  createResponse(app, fromStop, resolvedToStop, filteredArrivals, routeMap);
};

const createResponse = (
  app: DialogflowApp,
  from: Stop,
  to: ?Stop,
  arrivals: Arrival[],
  routes: Map<number, Route>
): void => {
  // Sort arrivals by timestamp in ascending order (smallest first).
  arrivals.sort((a, b) => a.timestamp - b.timestamp);

  const topArrivals = arrivals.slice(0, 5);

  const arrivalsInfo = topArrivals.map(({ route_id, timestamp }) => {
    const route = routes.get(route_id);
    if (!route) {
      logger.warn(
        "Couldn't find route information for arrival.",
        route_id,
        routes,
        arrivals
      );
      throw new TypeError("Couldn't find route information for arrival.");
    }

    const duration = simplifyDuration(timeUntil(timestamp));

    return { duration, routeName: route.long_name };
  });

  const textArrivals = arrivalsInfo
    .map(
      ({ duration, routeName }) =>
        `${routeName} in ${duration.count} ${pluralizedDurationSuffix(
          duration
        )}`
    )
    .join("; ");

  if (!to) {
    app.tell(
      `The following buses are arriving at ${from.name}. ${textArrivals}.`
    );
  } else {
    app.tell(
      `The following buses are traveling from ${from.name} to ${
        to.name
      }. ${textArrivals}.`
    );
  }
};

// Fetches a list of routes and makes a map of route_id to route.
const buildRouteMap = async (): Promise<Map<number, Route>> => {
  const { routes } = await getRoutes({ agencies });
  logger.info({ routes }, "getRoutes response");
  return makeMap(routes);
};

const findNearestStop = (to: Coords, stops: Stop[]): ?Stop =>
  lowestCost(stops, stop => {
    const devicePosition = coordsToPosition(to);
    const distanceToStop = distance(devicePosition, (stop.position: any));

    return distanceToStop;
  });

const findMatchingStop = (query: string, stops: Stop[]): ?Stop => {
  const normalizedFrom = query.toLowerCase().trim();
  const stop = stops.find(
    element => element.name.toLowerCase().trim() === normalizedFrom
  );

  return stop;
};

// Tries to find the nearest stop to `from`. If not provided, uses the
// current location.
const resolveStop = async (
  app: DialogflowApp,
  from: ?string,
  stops: Stop[]
): Promise<?Stop> => {
  if (!from) {
    // From not provided, try to use device location.
    if (!app.isPermissionGranted()) {
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
      return;
    }

    const location = app.getDeviceLocation();
    logger.info({ location }, "location permission granted");
    if (!location) {
      app.tell(`I couldn't get your location.`);
      logger.info("failed to get location");
      return;
    }

    const { coordinates: deviceCoordinates } = location;
    const nearestStop = findNearestStop(deviceCoordinates, stops);
    logger.info({ nearestStop }, "resolved nearest stop");

    if (nearestStop === null) {
      app.tell("There aren't any stops. I'm not sure what to do.");
      return;
    }

    return nearestStop;
  }

  const stop = findMatchingStop(from, stops);
  logger.info({ stop }, "found matching stop");
  if (!stop) {
    app.tell(`I couldn't find a stop named "${from}."`);
    return;
  }

  return stop;
};
