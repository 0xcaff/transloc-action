// @flow
import type {
  Response,
  DeviceLocation,
  SupportedPermission,
  SurfaceCapability,
  SimpleResponse,
  Context
} from "actions-on-google";
import {
  RichResponse,
  List,
  OptionItem
} from "actions-on-google/response-builder";
import type { UserData } from "./userData";

type RecordedPermission = {
  context: string,
  permission: SupportedPermission,
  dialogState?: Object
};

type RecordedResponse =
  | { type: "TELL", response: Response }
  | { type: "ASK_FOR_PERMISSION", permission: RecordedPermission }
  | { type: "ASK_WITH_LIST", list: List };

// A mock DialogflowApplication. It is used to pass in arguments and collect.
export class MockDialogflowApp {
  // Output Field
  response: ?RecordedResponse = null;
  contextOut: Map<string, Context<Object>> = new Map();

  // Input Fields
  args: Map<string, any>;
  permissionGranted: boolean = false;
  deviceLocation: ?DeviceLocation;
  selectedOption: ?string;
  surfaceCapabilities: Set<SurfaceCapability> = new Set();
  context: Map<string, Context<Object>> = new Map();
  userStorage: UserData = {
    agency_id: 643
  };

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
    permission: SupportedPermission,
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

  askWithList = (
    inputPrompt: string | RichResponse | SimpleResponse,
    list: List
  ): Object => {
    if (this.response) {
      throw new TypeError(`Multiple responses received.`);
    }

    this.response = {
      type: "ASK_WITH_LIST",
      list
    };

    return {};
  };

  buildRichResponse = (otherResponse: ?RichResponse): RichResponse => {
    return new RichResponse(otherResponse);
  };

  buildList = (title: string): List => new List(title);

  buildOptionItem = (
    key: ?string,
    synonyms: string | string[] | void
  ): OptionItem => {
    const optionItem = new OptionItem();
    if (key) {
      optionItem.setKey(key);
    }
    if (synonyms) {
      optionItem.addSynonyms(synonyms);
    }
    return optionItem;
  };

  getDeviceLocation = (): ?DeviceLocation => this.deviceLocation;

  getSelectedOption = (): ?string => this.selectedOption;

  hasSurfaceCapability = (cap: SurfaceCapability): boolean =>
    this.surfaceCapabilities.has(cap);

  getContext = (name: string) => this.context.get(name);

  setContext = (name: string, lifespan: ?number, params: Object) => {
    this.contextOut.set(name, {
      name,
      lifespan: lifespan || 0,
      parameters: params
    });
  };

  SupportedPermissions = {
    NAME: "NAME",
    DEVICE_PRECISE_LOCATION: "DEVICE_PRECISE_LOCATION",
    DEVICE_COARSE_LOCATION: "DEVICE_COARSE_LOCATION",
    UPDATE: "UPDATE"
  };

  SurfaceCapabilities = {
    AUDIO_OUTPUT: "actions.capability.AUDIO_OUTPUT",
    SCREEN_OUTPUT: "actions.capability.SCREEN_OUTPUT"
  };
}
