import path from "path";
import bunyan from "bunyan";
import LoggingBunyan from "@google-cloud/logging-bunyan";
import bunyanDebugStream from "bunyan-debug-stream";

const streams = [];

if (process.env.NODE_ENV === "production") {
  // Creates a Bunyan Stackdriver Logging client
  const loggingBunyan = new LoggingBunyan();

  streams.push(loggingBunyan);
} else {
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
