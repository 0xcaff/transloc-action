// @flow
jest.mock("../now");

import type { DeviceLocation } from "actions-on-google";
import { MockDialogflowApp } from "../mockDialogflowApp";
import { nextBusLocation } from "./nextBusLocation";
import { TO_ARGUMENT } from "../arguments";

const location: DeviceLocation = {
  coordinates: { latitude: 43.082978, longitude: -77.677036 },
  address: "105 Lomb Memorial Dr",
  zipCode: "14623",
  city: "Rochester, NY"
};

it(`works with the location provided`, async () => {
  const app = new MockDialogflowApp();
  app.deviceLocation = location;
  app.permissionGranted = true;
  app.userStorage = { agency_id: 643 };

  await nextBusLocation((app: any));

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

it(`fails when permission is granted but location isn't provided`, async () => {
  const app = new MockDialogflowApp();
  app.deviceLocation = null;
  app.permissionGranted = true;
  app.userStorage = { agency_id: 643 };

  await nextBusLocation((app: any));

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

it(`works when "to" is specified correctly`, async () => {
  const app = new MockDialogflowApp(new Map([[TO_ARGUMENT, "Perkins Green"]]));
  app.deviceLocation = location;
  app.permissionGranted = true;
  app.userStorage = { agency_id: 643 };

  await nextBusLocation((app: any));

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

it(`fails when "to" is specified incorrectly`, async () => {
  const app = new MockDialogflowApp(new Map([[TO_ARGUMENT, "Park Point"]]));
  app.deviceLocation = location;
  app.permissionGranted = true;
  app.userStorage = { agency_id: 643 };

  await nextBusLocation((app: any));

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});
