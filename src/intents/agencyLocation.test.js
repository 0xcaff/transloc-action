// @flow
jest.mock("../now");

import { agencyLocation } from "./agencyLocation";
import type { DeviceLocation } from "actions-on-google";
import { MockDialogflowApp } from "../mockDialogflowApp";

const location: DeviceLocation = {
  coordinates: { latitude: 43.082978, longitude: -77.677036 },
  address: "105 Lomb Memorial Dr",
  zipCode: "14623",
  city: "Rochester, NY"
};

it(`sets the agency based on the location`, async () => {
  const app = new MockDialogflowApp();
  app.deviceLocation = location;
  app.permissionGranted = true;
  app.userStorage = {};

  await agencyLocation((app: any));

  expect(app.response).toMatchSnapshot();
  expect(app.userStorage).toMatchSnapshot();
});
