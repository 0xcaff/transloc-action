// @flow
import type { Stop } from "transloc-api";
import type { DialogflowApp } from "actions-on-google";
import type { Result } from "./result";
import { getStopById } from "./resolve";

export opaque type LocationKey = string;

export const FROM_STOP_KEY: LocationKey = "from";
export const TO_STOP_KEY: LocationKey = "to";

export type StopParams = {
  stopId: number
};

export const storeLocationContext = (
  app: DialogflowApp,
  key: LocationKey,
  stop: Stop
): void => {
  const lifetime = undefined;

  const params: StopParams = { stopId: stop.id };

  app.setContext(key, lifetime, params);
};

export const getStopFromContext = (
  app: DialogflowApp,
  key: LocationKey,
  stops: Stop[]
): Result<Stop> => {
  const context = app.getContext(key);
  if (!context) {
    return { type: "EMPTY" };
  }

  const params: StopParams = context.parameters;
  const maybeStop: ?Stop = getStopById(params.stopId, stops);
  if (!maybeStop) {
    app.tell("Something went wrong.");
    return { type: "DELEGATING" };
  }

  return { type: "SUCCESS", value: maybeStop };
};
