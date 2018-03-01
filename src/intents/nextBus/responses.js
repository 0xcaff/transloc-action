// @flow
import type { Stop, RouteStops } from "transloc-api";
import type { DialogflowApp, List, OptionItem } from "actions-on-google";
import type { ArrivalWithRoute } from "../../data";
import {
  pluralizeByCount,
  pluralizeDo,
  simplifyDuration,
  sortByDistance,
  stringifyDuration,
  timeUntil
} from "../../utils";
import { now } from "../../now";
import type { OptionKey, OptionType } from "./option";
import logger from "../../logger";
import { getArrivalsWithRoute, stitchRouteStops } from "../../data";

export const findAndShowArrivals = async (
  app: DialogflowApp,
  from: Stop,
  maybeTo: ?Stop,
  routes: ?(RouteStops[])
): Promise<void> => {
  const arrivals = await findArrivals(app, from, maybeTo, routes);
  if (!arrivals) {
    return;
  }

  sendResponse(app, from, maybeTo, arrivals);
};

// Find arrivals traveling from a stop to another stop. Returns null if
// an invalid API response was received.
const findArrivals = async (
  app: DialogflowApp,
  from: Stop,
  maybeTo: ?Stop,
  routes: ?(RouteStops[])
): Promise<?$ReadOnlyArray<ArrivalWithRoute>> => {
  const arrivals = await getArrivalsWithRoute(from);

  if (maybeTo) {
    const to: Stop = maybeTo;

    if (!routes) {
      logger.error({ routes }, `The API response didn't include routes`);
      app.tell("Something went wrong.");
      return null;
    }

    const stitchedRoutes = stitchRouteStops(arrivals, routes);
    return stitchedRoutes.filter(arrival =>
      arrival.route.stops.find(id => id === to.id)
    );
  }

  return arrivals;
};

// Arranges and sorts information to respond to the next bus query.
const sendResponse = (
  app: DialogflowApp,
  from: Stop,
  to: ?Stop,
  inputArrivals: $ReadOnlyArray<ArrivalWithRoute>
): void => {
  const currentTime = now();

  // Ignore Arrivals In Past
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
        `${routeName} in ${stringifyDuration(duration)}`
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

export const handleUnknownStops = (
  potentialStops: Stop[],
  type: OptionType,
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

  const list = displayStopsList(app, type, sortedPotentialStops);

  app.askWithList(failedToFindStopMsg, list);
};

// Creates a list of formatted stops.
export const displayStopsList = (
  app: DialogflowApp,
  type: OptionType,
  potentialStops: Stop[]
): List =>
  app.buildList("Stops").addItems(
    potentialStops.map((stop: Stop): OptionItem => {
      const option = app.buildOptionItem(
        JSON.stringify(({ id: stop.id, type }: OptionKey))
      );

      option.setTitle(stop.name);
      option.setDescription(stop.description);

      return option;
    })
  );
