// @flow
import { getAgencies as getAgenciesImpl } from "transloc-api";
import type { Agencies } from "transloc-api";

import logger from "../logger";

export const getAgencies = async function<T: Object>(
  args: T
): Promise<Agencies> {
  const response = await getAgenciesImpl(args);
  logger.info({ response, args }, "getAgencies called");
  return response;
};
