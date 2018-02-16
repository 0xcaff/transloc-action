// @flow

import type { HandlerMap } from "actions-on-google";
import { NEXT_BUS_INTENT, nextBus } from "./nextBus";
import { BUS_ARRIVAL_INTENT, busArrival } from "./busArrival";
import { HELPER_RESPONSE_INTENT, helperResponse } from "./helperHandler";

export const actionMap: HandlerMap = new Map();

actionMap.set(NEXT_BUS_INTENT, nextBus);
actionMap.set(BUS_ARRIVAL_INTENT, busArrival);
actionMap.set(HELPER_RESPONSE_INTENT, helperResponse);
