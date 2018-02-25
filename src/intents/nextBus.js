// @flow
import type { DialogflowApp, OptionItem } from "actions-on-google";
import type { Arrival, Route, Stop, RouteStops } from "transloc-api";
import { getArrivals, getRoutes, getStops } from "transloc-api";

import type { Coords } from "../utils";
import {
  coordsToPosition,
  distance,
  simplifyDuration,
  lowestCost,
  makeMap,
  timeUntil,
  mustGet,
  pluralizeByCount,
  pluralizeDo,
  sortByDistance
} from "../utils";

import logger from "../logger";
import { now } from "../now";

export const NEXT_BUS_INTENT = "bus.next";
export const NEXT_BUS_LOCATION_INTENT = "bus.next.location";
export const NEXT_BUS_OPTION_INTENT = "bus.next.option";

const agencies = ["643"];

export const FROM_ARGUMENT = "from";

const getFromArg = (app: DialogflowApp): ?string =>
  app.getArgument(FROM_ARGUMENT);

export const TO_ARGUMENT = "to";

const getToArg = (app: DialogflowApp): ?string => app.getArgument(TO_ARGUMENT);

type ArrivalWithRoute = Arrival & { +route: Route };
type ArrivalWithRouteStops = Arrival & { +route: RouteWithStop };
type RouteWithStop = Route & RouteStops;

const getArrivalsWithRoute = async (
  stop: Stop
): Promise<ArrivalWithRoute[]> => {
  const arrivalsResponse = await getArrivals({ agencies, stop_id: stop.id });
  logger.info({ arrivalsResponse }, "getArrivals response");
  const { arrivals } = arrivalsResponse;

  const routesResponse = await getRoutes({ agencies });
  logger.info({ routesResponse }, "getRoutes response");
  const { routes } = routesResponse;
  const routesMap: Map<number, Route> = makeMap(routes);

  return arrivals.map(arrival => ({
    ...arrival,
    get route(): Route {
      return mustGet(routesMap, arrival.route_id);
    }
  }));
};

const stitchRouteStops = (
  arrivals: ArrivalWithRoute[],
  routeStops: RouteStops[]
): $ReadOnlyArray<ArrivalWithRouteStops> => {
  const routeStopsMap: Map<number, RouteStops> = makeMap(routeStops);

  return arrivals.map(
    (arrival: ArrivalWithRoute): ArrivalWithRouteStops =>
      (({
        ...arrival,
        get route(): RouteWithStop {
          const route = arrival.route;
          const routeStops = mustGet(routeStopsMap, arrival.route_id);

          return {
            ...route,
            ...routeStops
          };
        }
      }: any): ArrivalWithRouteStops)
  );
};

type OptionKey = {
  id: number,
  type: string
};

const handleUnknownStops = (
  potentialStops: Stop[],
  type: string,
  stopName: string,
  app: DialogflowApp
): void => {
  const failedToFindStopMsg: string = `I couldn't find a stop named "${stopName}."`;
  const sortedPotentialStops: Stop[] = sortByDistance(
    potentialStops,
    stopName,
    stop => stop.name
  );

  if (!app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
    app.tell(failedToFindStopMsg);
    return;
  }

  // Display List of Stops
  const list = app.buildList("Stops").addItems(
    sortedPotentialStops.map((stop: Stop): OptionItem => {
      const option = app.buildOptionItem(
        JSON.stringify(({ id: stop.id, type }: OptionKey))
      );

      option.setTitle(stop.name);
      option.setDescription(stop.description);

      return option;
    })
  );

  app.askWithList(failedToFindStopMsg, list);
};

export const nextBus = async (app: DialogflowApp): Promise<void> => {
  logger.info("handling next bus intent");

  const to = getToArg(app);
  const from = getFromArg(app);
  logger.info({ to, from }, "arguments");

  const { stops, routes } = await getStops({ agencies, include_routes: !!to });
  logger.info({ stops, routes }, "getStops response");

  const fromStop: ?Stop = resolveFromStop(app, from, stops);
  if (!fromStop) {
    return;
  }
  logger.info({ fromStop }, "resolved from stop");

  const arrivals = await getArrivalsWithRoute(fromStop);
  if (!arrivals.length) {
    app.tell(`There are no buses arriving at ${fromStop.name}.`);
    return;
  }

  let filteredArrivals: $ReadOnlyArray<ArrivalWithRoute> = arrivals;
  const optionStop: ?Stop = getStopFromOption(stops, TO_ARGUMENT, app);
  const matchingStop: ?Stop = findMatchingStop(to, stops);
  let resolvedToStop: ?Stop = optionStop || matchingStop;

  if (to && !matchingStop) {
    handleUnknownStops(stops, TO_ARGUMENT, to, app);
    return;
  }

  if (resolvedToStop) {
    logger.info({ resolvedToStop }, "found matching to stop");
    if (!routes) {
      logger.error({ routes }, `The API response didn't include routes`);
      app.tell("Something went wrong.");

      return;
    }

    const stitchedRoutes = stitchRouteStops(arrivals, routes);
    filteredArrivals = stitchedRoutes.filter(arrival =>
      arrival.route.stops.find(id => id === resolvedToStop.id)
    );
  }

  logger.info({ filteredArrivals }, "filter arrivals");

  createResponse(app, fromStop, resolvedToStop, filteredArrivals);
};

const createResponse = (
  app: DialogflowApp,
  from: Stop,
  to: ?Stop,
  inputArrivals: $ReadOnlyArray<ArrivalWithRoute>
): void => {
  const currentTime = now();
  const arrivals = inputArrivals
    .slice()
    .filter(arrival => currentTime < arrival.timestamp);

  // Sort arrivals by timestamp in ascending order (smallest first).
  arrivals.sort((a, b) => a.timestamp - b.timestamp);

  const topArrivals = arrivals.slice(0, 5);

  const arrivalsInfo = topArrivals.map(({ route, timestamp }) => {
    const duration = simplifyDuration(timeUntil(timestamp));

    return { duration, routeName: route.long_name };
  });

  const textArrivals = arrivalsInfo
    .map(
      ({ duration, routeName }) =>
        `${routeName} in ${duration.count} ${pluralizeByCount(
          duration.unit,
          duration.count
        )}`
    )
    .join("; ");

  let predicate: string = "";
  if (!to) {
    predicate = `arriving at ${from.name}`;
  } else {
    predicate = `traveling from ${from.name} to ${to.name}`;
  }

  if (arrivals.length) {
    app.tell(
      `The following ${pluralizeByCount("bus", arrivals.length)} ${pluralizeDo(
        arrivals.length
      )} ${predicate}. ${textArrivals}.`
    );
  } else {
    app.tell(`There are no buses ${predicate}.`);
  }
};

const findNearestStop = (to: Coords, stops: Stop[]): ?Stop =>
  lowestCost(stops, stop => {
    const devicePosition = coordsToPosition(to);
    const distanceToStop = distance(devicePosition, (stop.position: any));

    return distanceToStop;
  });

const findMatchingStop = (query: ?string, stops: Stop[]): ?Stop => {
  if (!query) {
    return;
  }

  const normalizedFrom = query.toLowerCase().trim();
  const stop = stops.find(
    element => element.name.toLowerCase().trim() === normalizedFrom
  );

  return stop;
};

// Gets the nearest stop to the current location, requesting permission if
// needed.
const getStopByLocation = (stops: Stop[], app: DialogflowApp): ?Stop => {
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
};

const getStopFromOption = (
  stops: Stop[],
  argumentType: string,
  app: DialogflowApp
): ?Stop => {
  logger.info({ argumentType }, "getting from option");
  const selectedOption = app.getSelectedOption();
  logger.info({ selectedOption }, "selected option");
  if (!selectedOption) {
    return;
  }

  // Try to get from argument.
  const { id, type } = JSON.parse(selectedOption);
  if (type !== argumentType) {
    return;
  }

  const stop = stops.find((stop: Stop) => stop.id === id);
  if (!stop) {
    return;
  }

  logger.info({ argumentType, stop }, "got stop from option");
  return stop;
};

// Tries to find the nearest stop to `from`. If not provided, uses the
// current location.
const resolveFromStop = (
  app: DialogflowApp,
  from: ?string,
  stops: Stop[]
): ?Stop => {
  const optionStop = getStopFromOption(stops, FROM_ARGUMENT, app);
  if (optionStop) {
    return optionStop;
  }

  if (!from) {
    // From not provided, try to use device location.
    return getStopByLocation(stops, app);
  }

  const stop = findMatchingStop(from, stops);
  logger.info({ stop }, "found matching stop");
  if (!stop) {
    handleUnknownStops(stops, FROM_ARGUMENT, from, app);
    return;
  }

  return stop;
};
