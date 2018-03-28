// @flow

import type { Request } from "./request";
import { first } from "../utils";

// The body received at the fulfilment web-hook from Dialogflow.
type FulfilmentRequest = {
  originalRequest: ActionOnGoogleRequestContainer | Object,
  id: string,
  sessionId: string,
  timestamp: string,
  result: Result
};

type ActionOnGoogleRequestContainer = {
  source: "google",
  version: "2",
  data: ActionOnGoogleRequest
};

type User = {
  userId: string
};

type ActionOnGoogleRequest = {
  inputs: Input[],
  user: User,
  conversation: Conversation
};

type Conversation = {
  conversationId: string
};

type Input = {
  rawInputs: RawInput[]
};

type RawInput = {
  inputType: InputType,
  query: string
};

type Result = {
  action: string,
  resolvedQuery: string
};

type InputType = "UNSPECIFIED_INPUT_TYPE" | "TOUCH" | "VOICE" | "KEYBOARD";

export const requestFromDialogflow = (request: FulfilmentRequest): Request => {
  let timestamp = Date.parse(request.timestamp);
  let intent = request.result.action;
  let message = request.result.resolvedQuery;
  let sessionId = request.sessionId;
  let userId = undefined;
  let id = request.id;
  let platform = "dialogflow";

  const originalRequest = request.originalRequest;
  if (
    originalRequest &&
    originalRequest.source === "google" &&
    originalRequest.version === "2"
  ) {
    // Collect Additional Information From Action on Google Request
    platform = "google";
    const data = originalRequest.data;

    // Collect Original Query If Possible
    const maybeFirstInput = first(data.inputs);
    if (maybeFirstInput) {
      const maybeFirstRawInput = first(maybeFirstInput.rawInputs);
      if (maybeFirstRawInput) {
        message = maybeFirstRawInput.query;
      }
    }

    // Get User Identifier
    userId = data.user.userId;
  }

  return {
    id,
    timestamp,
    intent,
    message,
    sessionId,
    userId,
    platform
  };
};
