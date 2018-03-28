declare module "@google/chatbase" {
  declare export class Message {
    setAsTypeUser(): Message;
    setTimestamp(time: string): Message;
    setPlatform(platform: string): Message;
    setMessage(message: string): Message;
    setIntent(action: string): Message;
    setVersion(version: string): Message;
    setUserId(id: string): Message;
    setCustomSessionId(id: string): Message;
    setMessageId(id: string): Message;

    send(): Promise<void>;
  }

  declare export default {
    newMessage: (apiKey: string) => Message
  }
}
