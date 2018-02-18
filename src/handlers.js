// @flow

import type { HandlerMap } from "actions-on-google";
import {
  NEXT_BUS_INTENT,
  NEXT_BUS_LOCATION_INTENT,
  NEXT_BUS_OPTION_INTENT,
  nextBus
} from "./nextBus";
import { BUS_ARRIVAL_INTENT, busArrival } from "./busArrival";

export const actionMap: HandlerMap = new Map();

actionMap.set(NEXT_BUS_INTENT, nextBus);
actionMap.set(NEXT_BUS_LOCATION_INTENT, nextBus);
actionMap.set(NEXT_BUS_OPTION_INTENT, nextBus);
actionMap.set(BUS_ARRIVAL_INTENT, busArrival);
