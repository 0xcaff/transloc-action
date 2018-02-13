// flow-typed signature: ba34effbe391b50b73073ca43db3e9aa
// flow-typed version: <<STUB>>/actions-on-google_v1.8.2/flow_v0.65.0

declare module "actions-on-google" {
  declare export type Permission =
    | "NAME"
    | "DEVICE_PRECISE_LOCATION"
    | "DEVICE_COARSE_LOCATION"
    | "UPDATE";

  declare export type Coordinates = {
    latitude: number,
    longitude: number
  };

  declare export type DeviceLocation = {
    coordinates: Coordinates,
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

  declare export class AssistantApp {
    static SupportedPermissions: { [Permission]: Permission };
    SupportedPermissions: { [Permission]: Permission };

    isPermissionGranted(): boolean;
    askForPermission(
      context: string,
      permission: Permission,
      dialogState?: Object
    ): ?Object;

    getDeviceLocation(): ?DeviceLocation;
  }

  declare export class DialogflowApp extends AssistantApp {
    getArgument(argName: string): any;
    tell(speechResponse: Response): ?Object;
    buildRichResponse(otherResponse: ?RichResponse): RichResponse;
  }
}
