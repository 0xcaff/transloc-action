// @flow
import type { HandlerMap } from "actions-on-google";
import { nextBus } from "./nextBus/nextBus";
import { nextBusLocation } from "./nextBus/location";
import { nextBusOption } from "./nextBus/option";

export const actionMap: HandlerMap = new Map();
actionMap.set("bus.next", nextBus);
actionMap.set("bus.next.location", nextBusLocation);
actionMap.set("bus.next.option", nextBusOption);
