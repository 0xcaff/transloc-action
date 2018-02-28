// @flow
import type { DialogflowApp } from "actions-on-google";
import type { Stop } from "transloc-api";

import { getStops } from "../../data";
import logger from "../../logger";
import { agencies } from "../../data/agencies";
import {
  convertStopResult,
  getStopFromOption,
  must,
  resolveToStop
} from "./resolve";
import { FROM_STOP_KEY, getStopFromContext, TO_STOP_KEY } from "./context";
import type {
  StopResult,
  StopResultDelegating,
  StopResultSuccess
} from "./resolve";
import { findAndShowArrivals } from "./responses";

export type OptionKey = {
  id: number,
  type: OptionType
};

export const FROM_OPTION_TYPE: OptionType = "from";
export const TO_OPTION_TYPE: OptionType = "to";

export opaque type OptionType = string;

const getOption = (app: DialogflowApp): ?OptionKey => {
  const key = app.getSelectedOption();
  if (!key) {
    return null;
  }

  return JSON.parse(key);
};

// Called when an options menu was used to clarify a selection.
export const nextBusOption = async (app: DialogflowApp) => {
  logger.info("nextBusOption");

  const { stops, routes } = await getStops({
    agencies,
    include_routes: true
  });

  const option = getOption(app);
  if (!option) {
    throw new TypeError(`Didn't receive an option.`);
  }

  const fromResult = resolveFrom(app, option, stops);
  if (fromResult.type === "DELEGATING") {
    return;
  }

  const from: Stop = fromResult.stop;

  const toResult = resolveTo(app, option, stops);
  if (toResult.type === "DELEGATING") {
    return;
  }

  const maybeTo: ?Stop = convertStopResult(toResult);

  return findAndShowArrivals(app, from, maybeTo, routes);
};

// Resolve the "from" stop.
const resolveFrom = (
  app: DialogflowApp,
  option: OptionKey,
  stops: Stop[]
): StopResultSuccess | StopResultDelegating => {
  // At this point the "from" attribute has been resolved into a context or
  // it is the response to the option selection.

  const maybeOptionLocation = getStopFromOption(
    app,
    option,
    FROM_OPTION_TYPE,
    stops
  );

  if (
    maybeOptionLocation.type === "DELEGATING" ||
    maybeOptionLocation.type === "SUCCESS"
  ) {
    return maybeOptionLocation;
  }

  // It wasn't the option, it must be in the context.
  const maybeContextLocation = getStopFromContext(app, FROM_STOP_KEY, stops);
  return must(
    app,
    maybeContextLocation,
    "Something went wrong.",
    "missing stop from context"
  );
};

// Resolves the "to" stop.
const resolveTo = (
  app: DialogflowApp,
  option: OptionKey,
  stops: Stop[]
): StopResult => {
  const maybeOptionLocation = getStopFromOption(
    app,
    option,
    TO_OPTION_TYPE,
    stops
  );

  if (
    maybeOptionLocation.type === "DELEGATING" ||
    maybeOptionLocation.type === "SUCCESS"
  ) {
    return maybeOptionLocation;
  }

  const maybeContextLocation = getStopFromContext(app, TO_STOP_KEY, stops);
  if (
    maybeContextLocation.type === "DELEGATING" ||
    maybeContextLocation.type === "SUCCESS"
  ) {
    return maybeOptionLocation;
  }

  // The argument couldn't be found in the options and the context. It must
  // be un-parsed.
  return resolveToStop(app, stops);
};