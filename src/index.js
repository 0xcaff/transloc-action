// @flow
import "@babel/polyfill";

import { DialogflowApp } from "actions-on-google";
import { actionMap } from "./handlers";
import logger from "./logger";

export const handleHttp = (request: any, response: any) => {
  const app = new DialogflowApp({ request, response });

  logger.info({ headers: request.headers, body: request.body }, "request");

  app.handleRequest(actionMap);
};
