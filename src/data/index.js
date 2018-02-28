// @flow
import { getArrivals, getRoutes } from "transloc-api";
import type { Arrival, Route, RouteStops, Stop } from "transloc-api";

import logger from "../logger";
import { agencies } from "./agencies";
import { makeMap, mustGet } from "../utils";
export { getStops } from "./stops";

export type ArrivalWithRoute = Arrival & { +route: Route };
export type ArrivalWithRouteStops = Arrival & { +route: RouteWithStop };
export type RouteWithStop = Route & RouteStops;

export const getArrivalsWithRoute = async (
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

export const stitchRouteStops = (
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
