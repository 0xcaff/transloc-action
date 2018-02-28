// @flow
import type { DialogflowApp } from "actions-on-google";

export const FROM_ARGUMENT = "from";

export const getFromArg = (app: DialogflowApp): ?string =>
  app.getArgument(FROM_ARGUMENT);

export const TO_ARGUMENT = "to";

export const getToArg = (app: DialogflowApp): ?string =>
  app.getArgument(TO_ARGUMENT);
