// @flow
import type { DeviceLocation } from "actions-on-google";
import { MockDialogflowApp } from "../../mockDialogflowApp";
import { nextBusLocation } from "./location";

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

  await nextBusLocation((app: any));

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

it(`fails when a location isn't provided`, async () => {
  const app = new MockDialogflowApp();
  app.deviceLocation = null;
  app.permissionGranted = true;

  await nextBusLocation((app: any));

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

// TODO: Check With To
