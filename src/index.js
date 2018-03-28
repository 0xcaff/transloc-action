// @flow
import "@babel/polyfill";

import { DialogflowApp } from "actions-on-google";
import { actionMap } from "./intents/index";
import logger from "./logger";
import { requestFromDialogflow } from "./request/inbound";
import { buildChatbaseMessage } from "./request/request";

export const handleHttp = (request: any, response: any) => {
  // Log Request
  const info = { headers: request.headers, body: request.body };
  logger.info(info, "request");

  // Authenticate Request
  const { authorization } = request.headers;
  if (authorization !== process.env.ALLOWED_AUTHORIZATION) {
    response.sendStatus(401);
    return;
  }

  const app = new DialogflowApp({ request, response });

  // Initialize Chatbase
  if (process.env.CHATBASE_KEY && process.env.CIRCLE_SHA1) {
    const key = process.env.CHATBASE_KEY;
    const version = process.env.CIRCLE_SHA1;

    const req = requestFromDialogflow(request);
    const msg = buildChatbaseMessage(key, version, req);
    msg.send();
  }

  app.handleRequest(actionMap);
};
