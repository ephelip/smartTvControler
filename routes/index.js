'use strict';

// Dependencies
const routes = require('express').Router();
const bonjour = require('bonjour')();
const Promise = require('bluebird');
const _ = require('lodash');

// Utils
const readJsonFile = require('../lib/utils').readJsonFile;
const writeJsonFile = require('../lib/utils').writeJsonFile;
const setTvToAutoZap = require('../lib/controllers').setTvToAutoZap
const setTvToFixedChannel = require('../lib/controllers').setTvToFixedChannel
const setModeToAllTv = require('../lib/controllers').setModeToAllTv

const activeServices = [];

routes.get('/channels', (req, res) => {
  console.log("GET /channels");
  return readJsonFile('channels.json')
    .then((channels) => {
      res.status(200).send(channels);
    })
    .catch((err) => {
      res.status(500).send('Erreur interne de serveur (QC powered)');
    });
});

routes.post('/channels', (req, res) => {
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
      newChannel.channel = newChannelNumber;
      channels.push(newChannel);
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

routes.get('/tvs', (req, res) => {
  console.log('GET /tvs');
  let tvs = activeServices.reduce((tvs, tv) => {
    tvs.push({
      name: tv.name,
      ip: tv.ip,
      port: tv.port
    });
    return tvs;


  }, [])
	return res.status(200).send(tvs);
});

routes.post('/zap', (req, res) => {
  console.log('POST /zap');
  if (!req.body.channel) {
    return res.status(400).send(`Bad Request: channel required`);
  }

  return readJsonFile('channels.json')
    .then((channels) => {
      let channelUrl;
      channels.map((channel) => {
        if(channel.channel == req.body.channel){
          channelUrl = channel.url;
        }
      });
      return channelUrl;
    })
    .then((channelUrl) => {
      if (!channelUrl) {
        console.log('error channel not found, cannot zap');
        return res.status(400).send(`Bad Request: channel not found`);
      }

      // Requested zap on one tv
      if (req.body.tv) {
        let tv = findActiveService(activeServices, req.body.tv);
        if (!tv) {
          console.log('tv not found');
          return res.status(400).send(`Bad Request: tv not found`);
        }

        return setTvToFixedChannel(tv, channelUrl);
      }

      // No tv requested, setting channel to all TVs
      return setModeToAllTv(activeServices, setTvToFixedChannel(tv, channelUrl));
    })
    .then((done) => {
      return res.status(200).send(`Channel changed`);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send(`Internal Server Error`);
    });
});

routes.post('/autozap', (req, res) => {
  console.log('POST /autoZap');
  
  // Default reload time set to 10 seconds
  let reloadTime = 10000;
  if (Number.isInteger(req.body.reloadTime)) {
    reloadTime = req.body.reloadTime * 1000; // convert to ms
  }
  return Promise.resolve()
    .then(() => {
      // Requested auto zap on one tv
      if (req.body.tv) {
        let tv = findActiveService(activeServices, req.body.tv);
        if (!tv) {
          console.log('tv not found');
          return res.status(400).send(`Bad Request: tv not found`);
        }

        return setTvToAutoZap(tv, timer);
      }

      // No tv requested, setting channel to all TVs
      return setModeToAllTv(activeServices, setTvToAutoZap(tv, timer));
    })
    .then((done) => {
      return res.status(200).send(`Channel changed`);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send(`Internal Server Error`);
    });
});


/*******************************************************************************
                          Watch and handle tvs
*******************************************************************************/

// browse for all http services
var browser = bonjour.find({ type: 'http' }, (service) => {
});

browser.on('up', (service) => {
  console.log(`+ New service found ${service.name}`);
  activeServices.push({
    name: service.name,
    ip: service.referer.address,
    port: service.referer.port
  });

  // Set all new tvs to autozap with 10 seconds reload
  let tv = findActiveService(activeServices, service.name);
  return setTvToAutoZap(tv, 10000);
});

browser.on('down', (service) => {
  console.log(`- Service ${service.name} has stopped`);
  removeActiveService(activeServices, service.name);
})

function removeActiveService(services, name) {
  let serviceIndex = _.findIndex(services, (s) => { return s.name === name; });

  if (serviceIndex > -1) {
    if (services[serviceIndex].autoZapTimer) {
      clearInterval(services[serviceIndex].autoZapTimer);
      delete services[serviceIndex].autoZapTimer;
    }
    services.splice(serviceIndex, 1);
  }
}

function findActiveService(services, name) {
  let serviceIndex = _.findIndex(services, (s) => { return s.name === name; });
  if (serviceIndex > -1) {
    return services[serviceIndex];
  }
  return false;
}
/******************************************************************************/



/*******************************************************************************
                           FOR TESTING

                  Simulate service creation and deletion
*******************************************************************************/

function pubService(name){
  bonjour.publish({ name: name, type: 'http', port: 3000 });
}

function killService(service){
  service.stop();
}

function countServices(services){
  console.log(`There is ${services.length} active services`);
}

setTimeout(() => {
  pubService('TV accueil');
  countServices(activeServices);
}, 2000);

let serviceToKill;
setTimeout(() => {
  serviceToKill = bonjour.publish({ name: 'killable service', type: 'http', port: 3000 });
  pubService('TV 3eme');
  countServices(activeServices);
}, 5000);

setTimeout(() => {
  killService(serviceToKill);
  countServices(activeServices);
}, 8000);

setTimeout(() => {
  pubService('TV default');
  countServices(activeServices);
}, 10000);

/******************************************************************************/

module.exports = routes;
