// @flow
jest.mock("./now");

import { nextBus } from "./nextBus";
import { MockDialogflowApp } from "./mockDialogflowApp";

describe("nextBus handler", () => {
  it("should request the location when from is not provided", async () => {
    const app = new MockDialogflowApp();
    app.permissionGranted = false;

    await nextBus((app: any));

    expect(app.response).toMatchSnapshot();
  });

  it("should resolve a query without the from field with location provided", async () => {
    const app = new MockDialogflowApp();
    app.deviceLocation = {
      coordinates: { latitude: 43.082978, longitude: -77.677036 },
      address: "105 Lomb Memorial Dr",
      zipCode: "14623",
      city: "Rochester, NY"
    };
    app.permissionGranted = true;

    await nextBus((app: any));

    expect(app.response).toMatchSnapshot();
  });

  it("should resolve a query with a given location", async () => {
    const app = new MockDialogflowApp(new Map([["from", "Perkins Green"]]));
    app.permissionGranted = false;

    await nextBus((app: any));

    expect(app.response).toMatchSnapshot();
  });
});
