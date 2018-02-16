// @flow

import { DialogflowApp } from "actions-on-google";

import type {
  Response,
  DeviceLocation,
  Permission,
  Context
} from "actions-on-google";
import { RichResponse } from "actions-on-google/response-builder";

type RecordedPermission = {
  context: string,
  permission: Permission,
  dialogState?: Object
};

type RecordedResponse =
  | { type: "TELL", response: Response }
  | { type: "ASK_FOR_PERMISSION", permission: RecordedPermission };

// A mock DialogflowApplication. It is used to pass in arguments and collect.
export class MockDialogflowApp {
  // Output Field
  response: ?RecordedResponse = null;

  // Input Fields
  args: Map<string, any>;
  permissionGranted: boolean = false;
  deviceLocation: ?DeviceLocation;
  context: Map<string, Context<Object>> = new Map();

  constructor(args: Map<string, any> = new Map()) {
    this.args = args;
  }

  tell = (speechResponse: Response): ?Object => {
    if (this.response) {
      throw new TypeError("Multiple responses received.");
    }

    this.response = { type: "TELL", response: speechResponse };
  };

  getArgument = (argName: string): any => this.args.get(argName);

  isPermissionGranted = (): boolean => this.permissionGranted;

  askForPermission = (
    context: string,
    permission: Permission,
    dialogState?: Object
  ): ?Object => {
    if (this.response) {
      throw new TypeError("Multiple responses received.");
    }

    this.response = {
      type: "ASK_FOR_PERMISSION",
      permission: { context, permission, dialogState }
    };
  };

  buildRichResponse = (otherResponse: ?RichResponse): RichResponse => {
    return new RichResponse(otherResponse);
  };

  getDeviceLocation = (): ?DeviceLocation => this.deviceLocation;

  getContext = (name: string) => this.context.get(name);

  setContext = (name: string, lifespan: ?number, params: Object) => {
    this.context.set(name, {
      name,
      lifespan: lifespan || 0,
      parameters: params
    });
  };

  SupportedPermissions = {
    ...DialogflowApp.SupportedPermissions
  };
}
