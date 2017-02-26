'use strict';

var fs = require('fs');

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

exports.readJsonFile = readJsonFile;
exports.writeJsonFile = writeJsonFile;
