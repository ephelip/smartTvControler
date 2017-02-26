'use strict';

var net = require('net');
const readJsonFile = require('./utils').readJsonFile;

function changeChannelOnTv(tvPort, tvIp, urlToSet) {
  var socket = new net.Socket();
  return new Promise((resolve, reject) => {
    socket.setTimeout(2000, (timeout) => {
      socket.destroy();
    });

    socket.connect(tvPort, tvIp, () => {
    	socket.write(urlToSet);
    });

    socket.on('data', (data) => {
      console.log(`Channel set to ${urlToSet} on tv ${tvIp}`);
      // kill socket after server's response
    	socket.close();
    });

    socket.on('close', (had_error) => {
      return resolve(true);
    });

    socket.on('timeout', () => {
    	console.log('Connection timeout on socket');
      return reject(new Error('Connection timeout on socketConnection'));
    });

    socket.on('error', (err) => {
    	console.log(`Could not connect to tv ${tvIp}`);
      socket.destroy();
      return reject(err);
    });
  })
}

function setTvToAutoZap(tv, timer) {
  console.log(`Setting tv ${tv.name} to autozap mode with reload time ${timer/1000} seconds`);
  if (tv.fixedChannel) {
    delete tv.fixedChannel;
  }

  tv.displayMode = 'autozap';
  tv.currentChannelIndex = 0;
  tv.autoZapTimer = setInterval(() => {
    autoZap(tv)
  }, timer);

  return Promise.resolve();
};

function setTvToFixedChannel(tv, channelUrl) {
  console.log(`Setting tv ${tv.name} to fixed channel ${channelUrl}`);
  if (tv.autoZapTimer) {
    clearInterval(tv.autoZapTimer);
    delete tv.autoZapTimer;
  }
  if (tv.currentChannelIndex) {
    delete tv.currentChannelIndex;
  }

  tv.displayMode = 'fixedChannel';
  tv.activeChannel = channelUrl;

  return changeChannelOnTv(tv.port, tv.ip, channelUrl);
  };

function autoZap(tv) {
	return readJsonFile('channels.json')
  	.then((channels)  => {
      if (channels.length === 0) {
        console.log('No channels registered');
        // No channels registered, returning google by default
        return 'www.google.com';
      }
  		tv.currentChannelIndex++;
  		if(tv.currentChannelIndex > channels.length -1){
  			tv.currentChannelIndex = 0;
  		}
  		return channels[tv.currentChannelIndex].url;
  	})
  	.then((channelUrl) => {
      return changeChannelOnTv(tv.port, tv.ip, channelUrl);
  	});
}

function setModeToAllTv(tvs, setModeMethod) {
  let promiseArrayForTVs = [];
  tvs.map((tv) => {
    promiseArrayForTVs.push(setModeMethod);
  });

  return Promise.all(promises.map((promise) => {
    return promise.reflect();
  })).each((inspection) => {
    if (inspection.isFulfilled()) {
      console.log("A promise in the array was fulfilled with", inspection.value());
    } else {
      console.error("A promise in the array was rejected with", inspection.reason());
    }
  });
}

exports.setTvToAutoZap = setTvToAutoZap;
exports.setTvToFixedChannel = setTvToFixedChannel;
exports.setModeToAllTv = setModeToAllTv;
