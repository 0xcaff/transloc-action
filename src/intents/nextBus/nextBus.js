// @flow
import type { DialogflowApp } from "actions-on-google";
import type { Stop } from "transloc-api";

import { getStops } from "../../data";

import logger from "../../logger";
import { agencies } from "../../data/agencies";
import { findAndShowArrivals } from "./responses";
import type { Result } from "./resolve";
import { convertResult, resolveFromStop, resolveToStop } from "./resolve";
import { FROM_STOP_KEY, storeLocationContext } from "./context";

// The intent handler for the next bus intent.
export const nextBus = async (app: DialogflowApp): Promise<void> => {
  logger.info("handling next bus intent");

  const { stops, routes } = await getStops({
    agencies,
    include_routes: true
  });

  const maybeFromStop: Result<Stop> = resolveFromStop(app, stops);
  if (maybeFromStop.type === "DELEGATING") {
    logger.info("delegating from stop resolution");
    // Either a request for clarification or a location request was performed.
    return;
  }

  if (maybeFromStop.type === "EMPTY") {
    throw new TypeError(`Didn't expect the from stop to be empty.`);
  }

  const fromStop: Stop = maybeFromStop.value;
  logger.info({ fromStop }, "resolved from stop");

  // Set "from" Context
  storeLocationContext(app, FROM_STOP_KEY, fromStop);

  const maybeToStop: Result<Stop> = resolveToStop(app, stops);
  if (maybeToStop.type === "DELEGATING") {
    logger.info("delegating to stop resolution");
    return;
  }

  const convertedMaybeToStop: ?Stop = convertResult(maybeToStop);

  return findAndShowArrivals(app, fromStop, convertedMaybeToStop, routes);
};
