import "@babel/polyfill";

import { DialogflowApp } from "actions-on-google";
import { nextBus } from "./nextBus";
import { busArrival } from "./busArrival";

const NEXT_BUS_INTENT = "bus.next";
const BUS_ARRIVAL_INTENT = "bus.arrival";

const actionMap = new Map();
actionMap.set(NEXT_BUS_INTENT, nextBus);
actionMap.set(BUS_ARRIVAL_INTENT, busArrival);

export const handleHttp = (request, response) => {
  const app = new DialogflowApp({ request, response });

  console.log(`Request headers:`, request.headers);
  console.log(`Request body:`, request.body);

  app.handleRequest(actionMap);
};
