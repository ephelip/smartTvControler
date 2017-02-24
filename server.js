'use strict'
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();

//Allow all requests from all domains & localhost
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

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


app.listen(6060);
