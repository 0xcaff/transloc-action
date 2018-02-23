# transloc-action

[![Build Status][build-status-image]][build-status]

A dialogflow action for information exposed by the transloc API.

You can ask it about the following things.

## Next Buses

* Which buses are arriving at _place_ next?
* When is the next bus to _place_ arriving?
* When is the next bus from _place_ to _place_ arriving?

This will list all buses arriving at `source` sorted from soonest arriving to
latest arriving. If `source` isn't specified, the current location is used.

If `destination` is specified, only buses which are going from the `source`
which have `destination` on their route are listed.

* The Perkin's Green bus is arriving in 5 minutes and the Park Point bus is
  arriving in 10.

## Future Plans

* How long will it take for me to get to _place_?
* Where does _bus_ stop?
* How long before _bus_ arrives?

### Bus Arrival Time

* How long before _bus_ arrives at _place_?
* How far away is _bus_?
* When is _bus_ arriving?

If place isn't specified, the current location is used. Gives the amount of time
before the bus arrives at the stop.

* It'll be here in 10 minutes.
* It's boarding now, it will arrive again in an hour.

[build-status-image]: https://circleci.com/gh/0xcaff/transloc-action.svg?style=svg
[build-status]: https://circleci.com/gh/0xcaff/transloc-action)
