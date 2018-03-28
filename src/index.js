// @flow
import "@babel/polyfill";

import { DialogflowApp } from "actions-on-google";
import { actionMap } from "./intents/index";
import logger from "./logger";
import { requestFromDialogflow } from "./request/inbound";
import { buildChatbaseMessage } from "./request/request";

export const handleHttp = async (
  request: any,
  response: any
): Promise<void> => {
  const version = process.env.CIRCLE_SHA1;

  // Log Request
  const info = { headers: request.headers, body: request.body, version };
  logger.info(info, "request");

  // Authenticate Request
  const { authorization } = request.headers;
  if (authorization !== process.env.ALLOWED_AUTHORIZATION) {
    response.sendStatus(401);
    return;
  }

  const app = new DialogflowApp({ request, response });

  await app.handleRequestAsync(actionMap);

  // Initialize Chatbase
  if (process.env.CHATBASE_KEY && version) {
    const key = process.env.CHATBASE_KEY;

    const req = requestFromDialogflow(request.body);
    logger.info({ chatbaseMessage: req });

    const msg = buildChatbaseMessage(key, version, req);
    logger.info("sending chatbase information");

    await msg.send();

    logger.info("sent chatbase information");
  }
};
