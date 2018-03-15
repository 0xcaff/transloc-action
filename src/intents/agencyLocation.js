// @flow

import type { DialogflowApp } from "actions-on-google";
import { fail } from "../result";
import { findUserAgency, setUserAgency } from "../agencies";
import { nextBusWithAgency } from "./nextBus";

export const agencyLocation = async (app: DialogflowApp): Promise<void> => {
  const deviceLocation = app.getDeviceLocation();
  if (!deviceLocation || !deviceLocation.coordinates) {
    fail(
      app,
      `I couldn't find your current location.`,
      "failed to find current location"
    );

    return;
  }

  const maybeAgency = await findUserAgency(app, deviceLocation);
  if (maybeAgency.type === "DELEGATING") {
    return;
  }

  const agency = maybeAgency.value;
  // TODO: Say Something About Saving
  setUserAgency(app, agency);

  await nextBusWithAgency(app, agency);
};
