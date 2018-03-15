// @flow
import type { HandlerMap } from "actions-on-google";
import { nextBus } from "./nextBus";
import { nextBusLocation } from "./nextBusLocation";
import { nextBusOption } from "./nextBusOption";
import { agencyLocation } from "./agencyLocation";

export const actionMap: HandlerMap = new Map();
actionMap.set("bus.next", nextBus);
actionMap.set("bus.next.location", nextBusLocation);
actionMap.set("bus.next.option", nextBusOption);

actionMap.set("agency.location", agencyLocation);
