####Smart TV controller


### API Resources

  - [GET /channels](#get-channels)
  - [POST /channels](#post-channels)
  - [GET /tvs](#get-tvs)
  - [POST /zap](#post-zap)
  - [POST /autozap](#post-autozap)

### GET /channels

Response body:

    [{
      "channel": 1,
      "url": "http://www.channel1.com",
      "description": "description for channel 1"
    },
    {
      "channel": 2,
      "url": "http://www.channel2.com",
      "description": "description for channel 2"
    }]

### POST /channels

Adds a new channel to the list

Required parameters in body:
* `url` url for the channel
* `description` short description of the channel

Response body:

    {
      "channel": 3,
      "url": "http://www.channel3.com",
      "description": "description for channel 3"
    }

### GET /tvs

Response body:

    [{
      "name": "tv one",
      "ip": "192.168.0.1",
      "port": 1234
    }, {
      "name": "tv two",
      "ip": "192.168.0.2",
      "port": 1234
    }]

### POST /zap

Force all tv or just one to display a channel.

If tv parameter is not set, all tvs will update.

Required parameters in body:
* `channel`: Datatype: `integer`. the channel number

Optionnal parameter in body:
* `tv`:  Datatype: `string`. The name of the tv to update


### POST /autozap

Force all tv or just one in autozap mode.
TV will loop between all available channels.

If tv parameter is not set, all tvs will update.

Required parameters in body:
* `channel`: Datatype: `integer`. the channel number

Optionnal parameter in body:
* `tv`:  Datatype: `string`. The name of the tv to update.
* `reloadTime`:  Datatype: `Integer`. Time for which each channel will be displayed. Default: `10`.

###Installing & Running
To install and run simply follow these steps:

* Clone this repo

* Open your terminal and run `npm install`

* Open your terminal and run `node server.js`. If using nodemon, run `nodemon server.js`.

* Your server is now available at `http://localhost:6060/`
