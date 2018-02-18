// @flow
jest.mock("./now");

import type { DeviceLocation } from "actions-on-google";
import { DialogflowApp } from "actions-on-google";
import { FROM_ARGUMENT, nextBus, TO_ARGUMENT } from "./nextBus";
import { MockDialogflowApp } from "./mockDialogflowApp";

const location: DeviceLocation = {
  coordinates: { latitude: 43.082978, longitude: -77.677036 },
  address: "105 Lomb Memorial Dr",
  zipCode: "14623",
  city: "Rochester, NY"
};

describe("nextBus handler", () => {
  it("should request the location when from is not provided", async () => {
    const app = new MockDialogflowApp();
    app.permissionGranted = false;

    await nextBus((app: any));

    expect(app.response).toMatchSnapshot();
  });

  it("should resolve a query without the from field with location provided", async () => {
    const app = new MockDialogflowApp();
    app.deviceLocation = location;
    app.permissionGranted = true;

    await nextBus((app: any));

    expect(app.response).toMatchSnapshot();
  });

  it("should resolve a query with a given from location", async () => {
    const app = new MockDialogflowApp(new Map([["from", "Gleason Circle"]]));
    app.permissionGranted = false;

    await nextBus((app: any));

    expect(app.response).toMatchSnapshot();
  });

  it("should resolve a query with a given from location and to location", async () => {
    const app = new MockDialogflowApp(
      new Map([
        [FROM_ARGUMENT, "Gleason Circle"],
        [TO_ARGUMENT, "Park Point South"]
      ])
    );
    app.permissionGranted = false;

    await nextBus((app: any));

    expect(app.response).toMatchSnapshot();
  });

  it("should resolve a query without a given from and with a to location", async () => {
    const app = new MockDialogflowApp(
      new Map([[TO_ARGUMENT, "Park Point South"]])
    );
    app.permissionGranted = true;
    app.deviceLocation = location;

    await nextBus((app: any));

    expect(app.response).toMatchSnapshot();
  });

  it(
    "should resolve a query with with a given from without any buses " +
      "traveling to the destination",
    async () => {
      const app = new MockDialogflowApp(
        new Map([[FROM_ARGUMENT, "Gleason Circle"], [TO_ARGUMENT, "Target"]])
      );

      await nextBus((app: any));

      expect(app.response).toMatchSnapshot();
    }
  );

  it("should not return a list on incompatible surfaces", async () => {
    const app = new MockDialogflowApp(
      new Map([[FROM_ARGUMENT, "Gleason Circle"], [TO_ARGUMENT, "Unknown"]])
    );
    const realApp: DialogflowApp = (app: any);
    app.surfaceCapabilities.add(realApp.SurfaceCapabilities.AUDIO_OUTPUT);

    await nextBus(realApp);

    expect(app.response).toMatchSnapshot();
  });

  it("should return a list on compatible surfaces", async () => {
    const app = new MockDialogflowApp(
      new Map([[FROM_ARGUMENT, "Gleason Circle"], [TO_ARGUMENT, "Unknown"]])
    );
    const realApp: DialogflowApp = (app: any);
    app.surfaceCapabilities.add(realApp.SurfaceCapabilities.AUDIO_OUTPUT);
    app.surfaceCapabilities.add(realApp.SurfaceCapabilities.SCREEN_OUTPUT);

    await nextBus(realApp);

    expect(app.response).toMatchSnapshot();
  });

  it("should select the value for the from field using the list key", async () => {
    const app = new MockDialogflowApp(
      new Map([[FROM_ARGUMENT, "Gleason Circle"], [TO_ARGUMENT, "Unknown"]])
    );

    const realApp: DialogflowApp = (app: any);
    app.selectedOption = JSON.stringify({ id: 4209568, type: TO_ARGUMENT });

    await nextBus(realApp);

    expect(app.response).toMatchSnapshot();
  });

  // TODO: should resolve a query with a given from without any busses
  // TODO: Should resolve a query which returns a single bus
  // TODO: Test Failure Case With Specified From and To
});
