// @flow
import "@babel/polyfill";

import { DialogflowApp } from "actions-on-google";
import { actionMap } from "./intents/index";
import logger from "./logger";

export const handleHttp = (request: any, response: any) => {
  // Log Request
  const info = { headers: request.headers, body: request.body };
  logger.info(info, "request");

  const app = new DialogflowApp({ request, response });
  app.handleRequest(actionMap);
};
