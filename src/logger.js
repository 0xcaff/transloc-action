import path from "path";
import bunyan from "bunyan";

const streams = [];

if (process.env.NODE_ENV === "production") {
  streams.push({ level: "debug", stream: process.stdout });
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
