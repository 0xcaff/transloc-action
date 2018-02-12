// flow-typed signature: ba34effbe391b50b73073ca43db3e9aa
// flow-typed version: <<STUB>>/actions-on-google_v1.8.2/flow_v0.65.0

declare module "actions-on-google" {
  declare type Permission =
    | "NAME"
    | "DEVICE_PRECISE_LOCATION"
    | "DEVICE_COARSE_LOCATION"
    | "UPDATE";

  declare type Coordinates = {
    latitude: number,
    longitude: number
  };

  declare type DeviceLocation = {
    coordinates: Coordinates,
    address: string,
    zipCode: string,
    city: string
  };

  declare type SimpleResponsee = {
    speech: string,
    displayText: string
  };

  declare export class RichResponse {}

  declare export class AssistantApp {
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
    tell(speechResponse: string | SimpleResponsee | RichResponse): ?Object;
  }
}
