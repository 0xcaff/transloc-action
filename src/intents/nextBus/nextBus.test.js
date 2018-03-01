// @flow
jest.mock("../../now");

import { FROM_ARGUMENT, TO_ARGUMENT } from "./arguments";
import type { DeviceLocation } from "actions-on-google";
import { DialogflowApp } from "actions-on-google";
import { nextBus } from "./nextBus";
import { MockDialogflowApp } from "../../mockDialogflowApp";

const location: DeviceLocation = {
  coordinates: { latitude: 43.082978, longitude: -77.677036 },
  address: "105 Lomb Memorial Dr",
  zipCode: "14623",
  city: "Rochester, NY"
};

it(`requests the location when "from" is not provided`, async () => {
  const app = new MockDialogflowApp();
  app.permissionGranted = false;

  await nextBus((app: any));

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

it(`uses a previously authorized location if provided`, async () => {
  const app = new MockDialogflowApp();
  app.deviceLocation = location;
  app.permissionGranted = false;

  await nextBus((app: any));

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

it("works with an explicit source location", async () => {
  const app = new MockDialogflowApp(new Map([["from", "Gleason Circle"]]));
  app.permissionGranted = false;

  await nextBus((app: any));

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

it("works with an explicit source and destination", async () => {
  const app = new MockDialogflowApp(
    new Map([
      [FROM_ARGUMENT, "Gleason Circle"],
      [TO_ARGUMENT, "Park Point South"]
    ])
  );
  app.permissionGranted = false;

  await nextBus((app: any));

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

it("works with a location based source and explicit destination", async () => {
  const app = new MockDialogflowApp(
    new Map([[TO_ARGUMENT, "Park Point South"]])
  );
  app.permissionGranted = true;
  app.deviceLocation = location;

  await nextBus((app: any));

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

it("works on a route without any buses", async () => {
  const app = new MockDialogflowApp(
    new Map([[FROM_ARGUMENT, "Gleason Circle"], [TO_ARGUMENT, "Target"]])
  );

  await nextBus((app: any));

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

it("should not return a list on incompatible surfaces", async () => {
  const app = new MockDialogflowApp(
    new Map([[FROM_ARGUMENT, "Gleason Circle"], [TO_ARGUMENT, "Unknown"]])
  );
  const realApp: DialogflowApp = (app: any);
  app.surfaceCapabilities.add(realApp.SurfaceCapabilities.AUDIO_OUTPUT);

  await nextBus(realApp);

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

it("should return a list on compatible surfaces", async () => {
  const app = new MockDialogflowApp(
    new Map([
      [FROM_ARGUMENT, "Gleason Circle"],
      [TO_ARGUMENT, "Barnes and Noble"]
    ])
  );
  const realApp: DialogflowApp = (app: any);
  app.surfaceCapabilities.add(realApp.SurfaceCapabilities.AUDIO_OUTPUT);
  app.surfaceCapabilities.add(realApp.SurfaceCapabilities.SCREEN_OUTPUT);

  await nextBus(realApp);

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

// TODO: should resolve a query with a selected to and a location based from
// TODO: should resolve a query with a given from without any busses
// TODO: Should resolve a query which returns a single bus
// TODO: Test Failure Case With Specified From and To
