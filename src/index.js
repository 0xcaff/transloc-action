// @flow
import "@babel/polyfill";

import { DialogflowApp } from "actions-on-google";
import { actionMap } from "./handlers";
import logger from "./logger";

export const handleHttp = (request: any, response: any) => {
  const app = new DialogflowApp({ request, response });

  const info = { headers: request.headers, body: request.body };
  logger.info(info, "request");

  app.handleRequest(actionMap);
};
