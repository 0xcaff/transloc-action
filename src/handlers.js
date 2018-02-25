// @flow

import type { HandlerMap } from "actions-on-google";
import {
  NEXT_BUS_INTENT,
  NEXT_BUS_LOCATION_INTENT,
  NEXT_BUS_OPTION_INTENT,
  nextBus
} from "./nextBus";

export const actionMap: HandlerMap = new Map();

actionMap.set(NEXT_BUS_INTENT, nextBus);
actionMap.set(NEXT_BUS_LOCATION_INTENT, nextBus);
actionMap.set(NEXT_BUS_OPTION_INTENT, nextBus);
