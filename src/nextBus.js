// @flow
import type { Position, Route, Stop } from "transloc-api";
import { getArrivals, getRoutes, getStops } from "transloc-api";
import {
  humanizeDuration,
  positionToCoordinates,
  squaredDist,
  timeUntil
} from "./utils";

const FROM_ARGUMENT = "from";
const TO_ARGUMENT = "to";

// TODO: Decide this at runtime.
const agencies = ["643"];

const getFromArg = (app: DialogFlowApp): ?string =>
  app.getArgument(FROM_ARGUMENT);

const getToArg = (app: DialogFlowApp): ?string => app.getArgument(TO_ARGUMENT);

const buildRouteMap = async (): Promise<Map<number, Route>> => {
  const { routes } = await getRoutes({ agencies });

  return routes.reduce((map, route) => {
    map.set(route.id, route);
    return map;
  }, new Map());
};

export const nextBus = async (app: DialogFlowApp): Promise<void> => {
  const from = getFromArg(app);
  const stop = await resolveStop(app, from);
  if (!stop) {
    return;
  }

  const { arrivals } = await getArrivals({ agencies, stop_id: stop.id });
  const routes: Map<number, Route> = await buildRouteMap();

  const response = `The following busses are arriving: ${arrivals
    .map(({ route_id, timestamp }) => {
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

      return `${route.long_name} in ${humanizeDuration(timeUntil(timestamp))}`;
    })
    .join("; ")}.`;

  app.tell(response);

  // TODO: Display List of Items
};

const resolveStop = async (app: DialogFlowApp, from: ?string): ?Stop => {
  const { stops } = await getStops({ agencies });
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

      // TODO: Figure out What Happens After This
      return;
    }

    const { coordinates: deviceCoordinates } = app.getDeviceLocation();

    const { stop: nearestStop } = stops.reduce(
      ({ distance: nearestStopDistance, stop: nearestStop }, stop) => {
        const stopCoords = positionToCoordinates(stop.position);
        const distanceToStop = squaredDist(deviceCoordinates, stopCoords);

        if (distanceToStop < nearestStopDistance) {
          return { distance: distanceToStop, stop };
        }

        return { distance: nearestStopDistance, stop: nearestStop };
      },
      { distance: Infinity, stop: null }
    );

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
