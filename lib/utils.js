'use strict';

var fs = require('fs');
var net = require('net');

function readJsonFile(filepath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (err, data) => {
      if (err) {
        console.log(`Unable to read ${filepath}`);
        return reject(err);
      }
      try {
        let json = JSON.parse(data);
        return resolve(json);
      } catch (err) {
	      console.log(`Unable to parse ${filepath}`);
        return reject(err);
      }
    });
  });
}

function writeJsonFile(filepath, jsonObj) {
	return new Promise((resolve, reject) => {
		let jsonTextObj = JSON.stringify(jsonObj);
		fs.writeFile(filepath, jsonTextObj, {encoding: 'utf8'}, (err) => {
		  if (err) {
			  console.log(`Unable to write ${filepath}`);
			  return reject(err);
		  }
		  return resolve();
		})
	});
}

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
      return Promise.resolve(true);
    });

    socket.on('timeout', () => {
    	console.log('Connection timeout on socket');
      return Promise.reject(new Error('Connection timeout on socketConnection timeout on socket'));
    });

    socket.on('error', (err) => {
    	console.log(`Could not connect to tv ${tvIp}`);
      return Promise.reject(err);
    });
  })
}

var currentChannelIndex = 0;

function autoZapCallback() {
	console.log("auto zap ");
	return readJsonFile('channels.json')
  	.then((channels)  => {
      if (channels.length === 0) {
        console.log('No channels registered');
        return 'www.google.com';
      }
  		currentChannelIndex++;
  		if(currentChannelIndex > channels.length -1){
  			currentChannelIndex = 0;
  		}
  		return channels[currentChannelIndex].url;
  	})
  	.then((channelUrl) => {
  		readJsonFile('displays.json')
    		.then((tvs) => {
    			// let promiseArrayForTVs = [];
    			tvs.map((tv) => {
            console.log(`setting ${tv.name} to ${channelUrl}`);
            changeChannelOnTv(tv.port, tv.url, channelUrl);
            return;
    				// promiseArrayForTVs.push(changeChannelOnTv(TV.port, TV.url, channelUrl))
    			})
    			// return Promise.all(promiseArrayForTVs);
    		})
  	})
  	.catch((err) => {
  		console.log(err);
  	});
}

let autoZapTimer = setInterval(autoZapCallback, 5000);

exports.readJsonFile = readJsonFile;
exports.writeJsonFile = writeJsonFile;
