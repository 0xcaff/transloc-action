// @flow
import { DialogflowApp } from "actions-on-google";

export const BUS_ARRIVAL_INTENT = "bus.arrival";

const BUS_ARGUMENT = "bus";
const LOCATION_ARGUMENT = "location";

const getBusArg = (app: DialogflowApp): string => app.getArgument(BUS_ARGUMENT);

const getLocationArg = (app: DialogflowApp): ?string =>
  app.getArgument(LOCATION_ARGUMENT);

export const busArrival = (app: DialogflowApp): void => {
  // TODO: Get The Bus Argument
  // TODO: Get the Location Argument
  // TODO: Request Arrivals for Stop
  // TODO: Filter by Bus
};
