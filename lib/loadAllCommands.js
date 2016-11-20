'use strict';
const logger = require('winston');
const fs = require('fs');
const path = require('path');
const utils = require('./utilities');

module.exports = function LoadCommands(client) {
  return new Promise((resolve, reject) => {
    load(client)
      .then(resolve)
      .catch(reject);
  });
};

function load(client) {
  return new Promise((resolve, reject) => {
    logger.debug('Loading commands into memory');
    // Get a list of all files in the cmds directory
    fs.readdir(path.join(process.cwd(), 'lib/cmds'), (err, files) => {
      if (err) {
        reject(err);
      } else {
        logger.info(`Loading ${files.length} command(s).`);
        // Create promise array of promises to load the command files
        const promiseArray = files.map(f => {
          const cmdPath = path.join(process.cwd(), 'lib/cmds', f);
          return client.loadOneCommand(client, cmdPath);
        });
        // Flush any commands that no longer have a file present
        client.commands
          .map(c => c.name)
          .filter(c => files.indexOf(`${c}.js`) === -1)
          .forEach(c => {
            logger.debug(`Flushing no longer found command file '${c}'`);
            const cmdPath = path.join(process.cwd(), 'lib/cmds', `${c}.js`);
            utils.removeCommand(client, c, cmdPath);
          });
        // After no longer existing commands are flushed, load all commands
        Promise.all(promiseArray)
          .then(resolve)
          .catch(reject);
      }
    });
  });
}