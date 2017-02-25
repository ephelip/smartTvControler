'use strict'
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
var net = require('net');

//Allow all requests from all domains & localhost
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

let currentChannelIndex = 0;

function parseJsonFile(filepath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (err, data) => {
      if (err) {
	console.log("Unable to read %s", filepath);
        return reject(err);
      }
      try {
        var json = JSON.parse(data);
        console.log("parse successfull %s", filepath);
        return resolve(json);
      } catch (err) {
	console.log("Unable to parse ", filepath);
        return reject(err);
      }
    });
  });
}

function changeChannelOnTv(tvPort, tvIp, urlToSet) {
  console.log(tvPort, tvIp, urlToSet);
  var client = new net.Socket();
  return new Promise((resolve, reject) => {
    client.connect(tvPort, tvIp, () => {
    	console.log('Connected');
    	client.write(urlToSet);
    });

    client.on('data', (data) => {
    	console.log('Received: ' + data);
    	client.destroy(); // kill client after server's response
    });

    client.on('close', () => {
    	console.log('Connection closed');
      return Promise.resolve(true);
    });

    client.on('timeout', () => {
    	console.log('Connection timeout on socket');
      return Promise.reject(new Error('Connection timeout on socketConnection timeout on socket'));
    });

    client.on('error', (err) => {
    	console.log('Error on socket');
      return Promise.reject(err);
    });
  })
}

function saveJsonFile(filepath,jsonObj) {
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

function autoZapCallback() {
	console.log("auto zap");
	parseJsonFile('channels.json')
	.then((channels)  => {
		currentChannelIndex++;
		if(currentChannelIndex > channels.length -1){
			currentChannelIndex = 0;
		}
		return channels[currentChannelIndex].url;
	})
	.then((channelUrl) => {
		parseJsonFile('displays.json')
		.then((TVs) => {
			// let promiseArrayForTVs = [];
			TVs.map((TV) => {
        console.log(`setting ${TV.name} to ${channelUrl}`);
        changeChannelOnTv(TV.port, TV.url, channelUrl);
        return;
				// promiseArrayForTVs.push(changeChannelOnTv(TV.port, TV.url, channelUrl))
			})
			// return Promise.all(promiseArrayForTVs);
		})
	})
	.catch ((error) => {
		console.log(error);
	});
}

let autoZapTimer = setInterval(autoZapCallback,10000);

app.get('/channels', function(req, res) {
    console.log("GET From SERVER");
    parseJsonFile('channels.json')
	.then((jsonReturned) => {
    		res.status(200).send(jsonReturned);
	})
	.catch((errReturned) => {
    		res.status(500).send('Erreur interne de serveur (QC powered)');
	});
});

app.post('/channels', function(req, res) {
    if (  !req.body.url || !req.body.description ){
      return res.status(400).send({error:" you need url and description"});
    }

    var newChannel = {url: req.body.url, description: req.body.description};
    parseJsonFile("channels.json")
    .then((jsonReturned) => {
      let newChannelNumber =0;
      jsonReturned.map((channelObj) => {
	 if(channelObj.channel >= newChannelNumber){
		newChannelNumber = channelObj.channel + 1;
	 }
      })
      newChannel.channel=newChannelNumber;
      jsonReturned.push(newChannel);
      return jsonReturned;
    })
    .then((jsonUpdated) => {
      console.log(jsonUpdated);
      return saveJsonFile('channels.json',jsonUpdated);
    })
    .then((done) => {
      return res.status(200).send(newChannel);
    })
    .catch((errReturned) => {
      console.log(errReturned);
      return res.status(500).send('Erreur interne de serveur (QC powered)');
    })
});


app.get('/tvs', function(req, res) {
    console.log("GET tv infos");
    parseJsonFile("./displays.json")
    .then((tvjson) => {
	console.log(tvjson);
	res.status(200).send(tvjson);
    })
    .catch((err) => {
	console.log(err);
	res.status(500).send('Internal Server Error');
    });
});

app.post('/tvs', function(req, res) {
    if ( !req.body.name || !req.body.url || !req.body.port ) {
	console.log('Bad json file for tv');
	return res.status(400).send(`Bad Request: url, port and name required}`);
    }
    var newtv = {"name":req.body.name, "url":req.body.url, "port":req.body.port};
    console.log('POST new tv');

    parseJsonFile('./displays.json')
    .then((displaysFile) => {
	let tvid = 0;
	console.log(displaysFile);
	displaysFile.map((tvobject) => {
		if(tvobject.id >= tvid) {
			tvid = tvobject.id + 1;
		}
	});

	newtv.id = tvid;

	displaysFile.push(newtv);
	let strdisplays = JSON.stringify(displaysFile)
	console.log('new displayFile %s', strdisplays);
	return saveJsonFile('./displays.json', displaysFile);
    })
    .then((done) => {
	res.status(200).send(newtv);
    })
    .catch((err) => {
	console.log(err);
	res.status(500).send('Internal Server Error');
    });
});


app.post('/zap', function(req, res) {
    console.log('Channel zap requested');
    if ( !req.body.channel ) {
	     return res.status(400).send(`Bad Request: channel required}`);
    }

    parseJsonFile('channels.json')
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
        return res.status(400).send(`Bad Request: channel not found}`);
      }
      parseJsonFile('displays.json')
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
    })
})

app.listen(6060);
