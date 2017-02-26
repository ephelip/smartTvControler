###Smart TV controller

###Installing & Running
To install and run simply follow these steps:

1)  Clone this repo

2)  Open your terminal and run `npm install`

3)  Open your terminal and run `node server.js`. If using nodemon, run `nodemon server.js`.

4)  Your server is now available at `http://localhost:6060/`


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

### POST /autozap
