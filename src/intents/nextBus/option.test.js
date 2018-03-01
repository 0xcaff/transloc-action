// @flow
jest.mock("../../now");

import { MockDialogflowApp } from "../../mockDialogflowApp";
import { FROM_ARGUMENT, TO_ARGUMENT } from "./arguments";
import { DialogflowApp } from "actions-on-google";

import { nextBusOption } from "./option";
import { FROM_STOP_KEY } from "./context";

it(`uses the list key for the "to" field`, async () => {
  const app = new MockDialogflowApp();
  app.context.set((FROM_STOP_KEY: any), {
    lifespan: 10,
    name: (FROM_STOP_KEY: any),
    parameters: {
      // Gleason Circle
      stopId: 4197446
    }
  });

  const realApp: DialogflowApp = (app: any);
  app.selectedOption = JSON.stringify({ id: 4209568, type: TO_ARGUMENT });

  await nextBusOption(realApp);

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});

it(`uses the list key for the "from" field`, async () => {
  const app = new MockDialogflowApp();

  const realApp: DialogflowApp = (app: any);
  app.selectedOption = JSON.stringify({ id: 4197446, type: FROM_ARGUMENT });

  await nextBusOption(realApp);

  expect(app.response).toMatchSnapshot();
  expect(app.contextOut).toMatchSnapshot();
});
