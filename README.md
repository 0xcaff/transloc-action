# transloc-action

[![Build Status][build-status-image]][build-status]

An Action on Google for Rochester Institute of Technology bus arrival times.
Data is fetched from Transloc, a service which to provide realtime bus arrival
information. The code can easily be adapted to work with other Transloc
agencies.

## Deploying

This action is deployed by CircleCI on every push to master. The dialogflow
state is stored in [`./dialogflow`](./dialogflow). The state is imported into
dialogflow by [dialogflow-cli].

The Cloud Function is transpiled and deployed using the `gcloud` command line
tool. For details on how the deployment works, check out the [CircleCI
configuration](./.circleci/config.yml).

## Developing

Before pushing, run

    yarn check-all

to make sure the automated checks done by the CI will pass.

## Usage

You can ask it about the following things.

### Next Buses

* Which buses are arriving at _place_ next?
* When is the next bus to _place_ arriving?
* When is the next bus from _place_ to _place_ arriving?

This will list all buses arriving at `source` sorted from soonest arriving to
latest arriving. If `source` isn't specified, the current location is used.

If `destination` is specified, only buses which are going from the `source`
which have `destination` on their route are listed.

* The Perkin's Green bus is arriving in 5 minutes and the Park Point bus is
  arriving in 10.

### Future Plans

* How long will it take for me to get to _place_?
* Where does _bus_ stop?
* How long before _bus_ arrives?

[build-status-image]: https://circleci.com/gh/0xcaff/transloc-action.svg?style=svg
[build-status]: https://circleci.com/gh/0xcaff/transloc-action
[dialogflow-cli]: https://github.com/0xcaff/dialogflow-cli
