// @flow
const BUS_ARGUMENT = "bus";
const LOCATION_ARGUMENT = "location";

const getBusArg = (app: DialogFlowApp): string => app.getArgument(BUS_ARGUMENT);

const getLocationArg = (app: DialogFlowApp): ?string =>
  app.getArgument(LOCATION_ARGUMENT);

export const busArrival = (app: DialogFlowApp): void => {
  // TODO: Get The Bus Argument
  // TODO: Get the Location Argument
  // TODO: Request Arrivals for Stop
  // TODO: Filter by Bus
};
