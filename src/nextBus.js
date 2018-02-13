// @flow
import type { DialogflowApp } from "actions-on-google";
import type { Arrival, Position, Route, Stop } from "transloc-api";
import { getArrivals, getRoutes, getStops } from "transloc-api";
import {
  coordsToPosition,
  distance,
  simplifyDuration,
  lowestCost,
  makeMap,
  timeUntil,
  ssmlDuration,
  ssml,
  escape,
  pluralizedDurationSuffix
} from "./utils";
import type { Coords } from "./utils";

const agencies = ["643"];

const FROM_ARGUMENT = "from";

const getFromArg = (app: DialogflowApp): ?string =>
  app.getArgument(FROM_ARGUMENT);

const TO_ARGUMENT = "to";

const getToArg = (app: DialogflowApp): ?string => app.getArgument(TO_ARGUMENT);

export const nextBus = async (app: DialogflowApp): Promise<void> => {
  const from = getFromArg(app);
  const fromStop: ?Stop = await resolveStop(app, from);
  if (!fromStop) {
    return;
  }

  const { arrivals } = await getArrivals({ agencies, stop_id: fromStop.id });
  if (!arrivals.length) {
    app.tell(`There are no busses arriving at ${fromStop.name}.`);
    return;
  }

  const routes: Map<number, Route> = await buildRouteMap();

  createResponse(app, fromStop, arrivals, routes);
};

const createResponse = (
  app: DialogflowApp,
  from: Stop,
  arrivals: Arrival[],
  routes: Map<number, Route>
): void => {
  // Sort arrivals by timestamp in ascending order (smallest first).
  arrivals.sort((a, b) => a.timestamp - b.timestamp);

  const topArrivals = arrivals.slice(0, 5);

  const arrivalsInfo = topArrivals.map(({ route_id, timestamp }) => {
    const route = routes.get(route_id);
    if (!route) {
      console.error(
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

  const spokenArrivals = arrivalsInfo
    .map(
      ({ duration, routeName }) => `${routeName} in ${ssmlDuration(duration)}`
    )
    .join("; ");

  const textArrivals = arrivalsInfo
    .map(
      ({ duration, routeName }) =>
        `${routeName} in ${duration.count} ${pluralizedDurationSuffix(
          duration
        )}`
    )
    .join("; ");

  const richResponse = app.buildRichResponse();

  richResponse.addSimpleResponse(
    ssml`The following busses are arriving at ${escape(
      from.name
    )}. ${spokenArrivals}.`
  );

  richResponse.addSimpleResponse(
    `The following busses are arriving at ${from.name}. ${textArrivals}.`
  );

  app.tell(richResponse);
};

// Fetches a list of routes and makes a map of route_id to route.
const buildRouteMap = async (): Promise<Map<number, Route>> => {
  const { routes } = await getRoutes({ agencies });
  return makeMap(routes);
};

const findNearestStop = (to: Coords, stops: Stop[]): ?Stop =>
  lowestCost(stops, stop => {
    const devicePosition = coordsToPosition(to);
    const distanceToStop = distance(devicePosition, (stop.position: any));

    return distanceToStop;
  });

// Tries to find the nearest stop to `from`. If not provided, uses the
// current location.
const resolveStop = async (
  app: DialogflowApp,
  from: ?string
): Promise<?Stop> => {
  const { stops } = await getStops({ agencies, include_routes: false });
  console.log("Received Stops", stops);

  if (!from) {
    // From not provided, try to use device location.
    if (!app.isPermissionGranted()) {
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
    if (!location) {
      app.tell(`I couldn't get your location.`);
      console.error("Failed to get location.");
      return;
    }

    const { coordinates: deviceCoordinates } = location;

    const nearestStop = findNearestStop(deviceCoordinates, stops);

    if (nearestStop === null) {
      app.tell("There aren't any stops. I'm not sure what to do.");
      return;
    }

    return nearestStop;
  }

  const normalizedFrom = from.toLowerCase();
  const stop = stops.find(
    element => element.name.toLowerCase() === normalizedFrom
  );

  if (!stop) {
    app.tell(`I couldn't find a stop with that name.`);
    return;
  }

  return stop;
};
