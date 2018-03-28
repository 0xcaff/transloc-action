// @flow
import chatbase from "@google/chatbase";
import type { Message } from "@google/chatbase";

// A container holding information about an incoming request.
export type Request = {
  id: string,

  // The timestamp at which this request was spoken as the number of ms
  // since the epoch.
  timestamp: number,

  // The unique identifier of the user making the request.
  userId?: string,

  // The intent this message matches.
  intent: string,

  // A unique string used to define the scope of each message.
  sessionId: string,

  // The message the user spoke.
  message: string,

  // The platform from which this request is coming from.
  platform: string
};

export const buildChatbaseMessage = (
  key: string,
  version: string,
  request: Request
): Message => {
  const msg = chatbase
    .newMessage(key)
    .setAsTypeUser()
    .setTimestamp(request.timestamp.toString())
    .setPlatform(request.platform)
    .setMessage(request.message)
    .setIntent(request.intent)
    .setVersion(version)
    .setCustomSessionId(request.sessionId)
    .setMessageId(request.id);

  if (request.userId) {
    msg.setUserId(request.userId);
  }

  return msg;
};
