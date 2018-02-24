import { Writable } from "stream";
import path from "path";
import bunyan from "bunyan";

const streams = [];

type Entry = {
  level: string
};

// Gets the function which the message will be logged to for the log entry.
const getLogger = (entry: Entry) => {
  if (entry.level === bunyan.WARN) {
    // eslint-disable-next-line no-console
    return console.warn;
  }

  // eslint-disable-next-line no-console
  return console.log;
};

// A stream which consumes objects and delivers them to console.log /
// console.warn.
class ConsoleWritableStream extends Writable {
  constructor() {
    super({ objectMode: true });
  }

  _write(entry: Entry, encoding: string, done: void => void) {
    const logger = getLogger(entry);

    logger(JSON.stringify(entry));

    done();
  }
}

if (process.env.NODE_ENV === "production") {
  const stream = new ConsoleWritableStream();
  streams.push({ level: "info", type: "raw", stream });
} else {
  const bunyanDebugStream = require("bunyan-debug-stream");
  const stream = bunyanDebugStream({
    basepath: path.resolve(__dirname, "..")
  });

  streams.push({ level: "info", type: "raw", stream });
}

const logger = bunyan.createLogger({
  name: "fulfilment-handler",
  streams,
  serializers: bunyan.stdSerializers
});

export default logger;
