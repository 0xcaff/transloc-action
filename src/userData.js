// @flow

// The type of the data stored in app.userStorage. The only way the user
// storage can be updated is by this handler. Care must be taken to not
// break this data format across versions.
export type UserData = {
  // the id of the agency which this user has set.
  agency_id: number
};
