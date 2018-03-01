// @flow
import { DialogflowApp } from "actions-on-google";
import logger from "./logger";

// A request has been made for more information from the user.
export type ResultDelegating = { type: "DELEGATING" };

// The stop has successfully been resolved.
export type ResultSuccess<T> = { type: "SUCCESS", value: T };

// There is no stop to resolve.
export type ResultEmpty = { type: "EMPTY" };

// A result type with a delegating choice.
export type Result<T> = ResultDelegating | ResultSuccess<T> | ResultEmpty;

// Converts a result to a nullable value.
export const convertResult = <T>(r: ResultSuccess<T> | ResultEmpty): ?T => {
  if (r.type === "EMPTY") {
    return null;
  }

  return r.value;
};

// Reports an error for empty results.
export const must = <T>(
  app: DialogflowApp,
  r: Result<T>,
  message: string,
  logMessage: string
): ResultSuccess<T> | ResultDelegating => {
  if (r.type === "EMPTY") {
    app.tell(message);
    logger.warn(logMessage);
    return { type: "DELEGATING" };
  }

  return r;
};
