// @flow
import { getStops as getStopsImpl } from "transloc-api";
import type { Stops } from "transloc-api";

import logger from "../logger";

export const getStops = async function<T: Object>(args: T): Promise<Stops> {
  const response = await getStopsImpl(args);
  logger.info({ response }, "getStops called");
  return response;
};
