'use strict';

// Dependencies
const routes = require('express').Router();

// Utils
const readJsonFile = require('../lib/utils').readJsonFile;
const writeJsonFile = require('../lib/utils').writeJsonFile;

routes.get('/channels', function(req, res) {
  console.log("GET /channels");
  return readJsonFile('channels.json')
    .then((channels) => {
      res.status(200).send(channels);
    })
    .catch((err) => {
      res.status(500).send('Erreur interne de serveur (QC powered)');
    });
});

routes.post('/channels', function(req, res) {
  if (!req.body.url || !req.body.description){
    return res.status(400).send({error:" you need url and description"});
  }

  let newChannel = {
    url: req.body.url,
    description: req.body.description
  };

  return readJsonFile("channels.json")
    .then((channels) => {
      let newChannelNumber = 0;
      channels.map((channel) => {
        if(channel.channel >= newChannelNumber){
          newChannelNumber = channel.channel + 1;
        }
      })
      channels.channel = newChannelNumber;
      jsonReturned.push(newChannel);
      return channels;
    })
    .then((updatedChannels) => {
      return writeJsonFile('channels.json',updatedChannels);
    })
    .then((done) => {
      return res.status(200).send(newChannel);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send('Erreur interne de serveur (QC powered)');
    });
});

routes.get('/tvs', function(req, res) {
  console.log('GET /tvs');
  return readJsonFile("./displays.json")
    .then((tvs) => {
    	return res.status(200).send(tvs);
    })
    .catch((err) => {
    	console.log(err);
    	return res.status(500).send('Internal Server Error');
    });
});

routes.post('/tvs', function(req, res) {
  console.log('POST /tvs');
  if (!req.body.name || !req.body.url || !req.body.port) {
    return res.status(400).send(`Bad Request: url, port and name required`);
  }

  let newtv = {
    name:req.body.name,
    url: req.body.url,
    port:req.body.port
  };

  return readJsonFile('./displays.json')
    .then((tvs) => {
      let tvId = 0;

      tvs.map((tv) => {
        if(tv.id >= tvId) {
          tvId = tv.id + 1;
        }
      });

	    newtv.id = tvId;
	    tvs.push(newtv);

    	return writeJsonFile('./displays.json', tvs);
    })
    .then((done) => {
      return res.status(200).send(newtv);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send('Internal Server Error');
    });
});


routes.post('/zap', function(req, res) {
  console.log('Channel zap requested');
  if ( !req.body.channel ) {
    return res.status(400).send(`Bad Request: channel required}`);
  }

  return readJsonFile('channels.json')
    .then((channels)  => {
      let channelUrl;
      channels.map((channel) => {
        if(channel.channel == req.body.channel){
          channelUrl = channel.url;
        }
      });
      return channelUrl;
    })
    .then((channelUrl) => {
      if(!channelUrl) {
        console.log('error missing channel, cannot zap');
        return res.status(400).send(`Bad Request: channel not found`);
      }
      readJsonFile('displays.json')
      .then((TVs) => {
        // let promiseArrayForTVs = [];
        TVs.map((TV) => {
          console.log(`setting ${TV.name} to ${channelUrl}`);
          changeChannelOnTv(TV.port, TV.url, channelUrl);
          clearInterval(autoZapTimer);
          autoZapTimer = setInterval(autoZapCallback,10000);

          return res.status(200).send(`Channel changed}`);
          // promiseArrayForTVs.push(changeChannelOnTv(TV.port, TV.url, channelUrl))
        })
        // return Promise.all(promiseArrayForTVs);
      })
    });
})

module.exports = routes;
