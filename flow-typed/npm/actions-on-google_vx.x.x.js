// flow-typed signature: ba34effbe391b50b73073ca43db3e9aa
// flow-typed version: <<STUB>>/actions-on-google_v1.8.2/flow_v0.65.0

declare module "actions-on-google" {
  declare export opaque type SupportedPermission;

  declare type SupportedPermissions = {
    NAME: SupportedPermission,
    DEVICE_PRECISE_LOCATION: SupportedPermission,
    DEVICE_COARSE_LOCATION: SupportedPermission,
    UPDATE: SupportedPermission
  };

  declare export opaque type SurfaceCapability;

  declare type SurfaceCapabilities = {
    AUDIO_OUTPUT: SurfaceCapability,
    SCREEN_OUTPUT: SurfaceCapability
  };

  declare export type Coordinates = {
    latitude: number,
    longitude: number
  };

  declare export type DeviceLocation = FineDeviceLocation &
    CoarseDeviceLocation;

  declare export type FineDeviceLocation = {
    coordinates: Coordinates
  };

  declare export type CoarseDeviceLocation = {
    address: string,
    zipCode: string,
    city: string
  };

  declare export type SimpleResponse = {
    speech: string,
    displayText: string
  };

  declare export type Response = string | SimpleResponse | RichResponse;

  declare class RichResponse {
    constructor(otherResponse: ?RichResponse): RichResponse;
    addSimpleResponse(response: string | SimpleResponse): RichResponse;
  }

  declare export class OptionItem {
    constructor(other: ?OptionItem): OptionItem;

    setTitle(title: string): OptionItem;

    setDescription(description: string): OptionItem;
  }

  declare export class List {
    constructor(otherList: List | string | OptionItem[] | void): List;

    title: string;
    items: OptionItem[];

    addItems(OptionItem | OptionItem[]): List;
    setTitle(title: string): List;
  }

  declare export class AssistantApp {
    SupportedPermissions: SupportedPermissions;
    SurfaceCapabilities: SurfaceCapabilities;

    isPermissionGranted(): boolean;
    askForPermission(
      context: string,
      permission: SupportedPermission,
      dialogState?: Object
    ): ?Object;

    getDeviceLocation(): ?DeviceLocation;

    buildList(list: string): List;

    buildOptionItem(
      key: ?string,
      synonyms: string | string[] | void
    ): OptionItem;
  }

  declare export type Context<T> = {
    name: string,
    lifespan: number,
    parameters: T
  };

  declare export type HandlerMap = Map<string, Handler>;

  declare export class DialogflowApp extends AssistantApp {
    constructor(options: Object): DialogflowApp;

    handleRequest(handler: Handler | HandlerMap): void;

    getArgument(argName: string): any;
    tell(speechResponse: Response): ?Object;
    buildRichResponse(otherResponse: ?RichResponse): RichResponse;
    setContext(
      name: string,
      lifespan: ?number,
      parameters: ?Object
    ): null | void;
    getContext<T: Object>(name: string): Context<T> | null;

    hasSurfaceCapability(cap: SurfaceCapability): boolean;

    askWithList(
      inputPrompt: string | RichResponse | SimpleResponse,
      list: List
    ): Object;

    getSelectedOption(): ?string;
  }

  declare export type Handler = DialogflowApp => Promise<void> | void;
}
