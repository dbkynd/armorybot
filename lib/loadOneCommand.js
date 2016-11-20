'use strict';
const path = require('path');
const logger = require('winston');
const utils = require('./utilities');

module.exports = function LoadSingleCommand(client, cmdPath) {
  return new Promise((resolve, reject) => {
    // Get the file (cmd) name
    const name = path.parse(cmdPath).name;
    // Command exists in our Collection already
    if (client.commands.has(name)) {
      logger.debug(`Flushing ${name} command`);
      utils.removeCommand(client, name, cmdPath);
    }
    // Load the command
    logger.debug(`Loading command: '${name}'`);
    try {
      const cmd = require(cmdPath);
      // Set name from file name. Used in cmds command
      cmd.name = name;
      // Add command to Collection
      client.commands.set(name, cmd);
      // Add any command aliases to the alias Collection
      if (cmd.info.aliases) {
        cmd.info.aliases.forEach(a => {
          client.aliases.set(a, cmd);
        });
      }
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};