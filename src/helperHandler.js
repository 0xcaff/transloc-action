// @flow
import type { Context } from "actions-on-google";
import { DialogflowApp } from "actions-on-google";
import logger from "./logger";
import { actionMap } from "./handlers";

type HandlerIntent = "bus.arrival" | "bus.next";

export const HELPER_RESPONSE_INTENT = "helper.response";

export const CONTEXT_ARGUMENT_NAME = "helper.context";

export type HelperContextParams = {
  // The handler this response should be forwarded to.
  handler: HandlerIntent,

  // Arguments to the original handler. These will be forwarded to the
  // handler specified.
  originalArguments: Object
};

// Records arguments into the context. This *MUST* be called before handing
// off control to a helper.
export const recordContext = (
  handler: HandlerIntent,
  args: Object,
  app: DialogflowApp
): void => {
  const lifespan = 1;
  app.setContext(handler, lifespan, {
    handler,
    originalArguments: args
  });
};

// Gets arguments from the context. This should be called after getting
// control back from the helper.
export const getArguments = (app: DialogflowApp): Object => {
  const context: ?Context<HelperContextParams> = app.getContext(
    CONTEXT_ARGUMENT_NAME
  );

  if (!context) {
    // No context provided, return empty object.
    return {};
  }

  return context.parameters.originalArguments;
};

// This response is triggered in response to the helper response intent. The
// helper response intent handles all events which are a response to a call
// to a helper. A complete list of helpers and their events are here:
// https://developers.google.com/actions/assistant/helpers#built-in_helper_intents
//
// We're only concerned with handling the following:
// * actions_intent_PERMISSION
// * actions_intent_OPTION
export const helperResponse = async (app: DialogflowApp): Promise<void> => {
  logger.info("handling helper response intent");

  // Delegate to Correct Handler
  const context: ?Context<HelperContextParams> = app.getContext(
    CONTEXT_ARGUMENT_NAME
  );

  if (!context) {
    throw new TypeError(`Context helper invoked without context information.`);
  }

  const handler = actionMap.get(context.parameters.handler);
  if (!handler) {
    throw new TypeError(
      `There is no handler for that action. ${context.parameters.handler}`
    );
  }

  const ret = handler(app);
  if (ret) {
    await ret;
  } else {
    return ret;
  }
};
