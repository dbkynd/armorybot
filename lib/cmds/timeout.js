'use strict'
const moment = require('moment')
const timeouts = require('../timeouts')

exports.info = {
  desc: 'Add a timeout to a user, giving them the Muted Role',
  usage: '<id> <minutes>',
  aliases: ['mute'],
  hidden: true,
  permissions: [],
}

exports.run = (client, msg, params = []) =>
  new Promise(async (resolve, reject) => {
    // command not allowed in DMs
    if (msg.channel.type === 'dm') {
      client.utils.dmDenied(msg).then(resolve).catch(reject)
      return
    }
    // delete any timeout command messages posted in ANY channel
    msg.delete()
    // allow command only from #mod-logs
    // this means only moderators can run this command
    // so no need to role check
    if (msg.channel.id !== '252275732628242432') return
    // return usage if not enough parameters are passed
    if (params.length < 2) {
      client.utils.usage(msg, exports.info).then(resolve).catch(reject)
      return
    }
    // extract the target id and the timeout duration
    const targetId = params[0]
    const duration = params[1]
    // get the target user
    const target = msg.guild.members.cache.get(targetId)
    // tell the author if the target is not found
    if (!target) {
      msg.channel
        .send('Nobody with that ID was found. Are you sure it is correct?')
        .then(resolve)
        .catch(reject)
      return
    }
    const minutes = parseInt(duration)
    // make sure the duration is an int
    if (isNaN(minutes)) {
      // tell the author if the duration is malformed
      msg.channel
        .send('The duration must be a whole number.')
        .then(resolve)
        .catch(reject)
      return
    }
    // give the muted role to the target user
    target.roles
      .add('706906565784895509')
      .then(() => {
        // notify the author that the role has been added
        const targetString = `**${target.user.username}#${target.user.discriminator}** (${target.user.id})`
        msg.channel.send(
          `${targetString} has been timed out for **${minutes}** minute(s) by ${msg.author.username}`,
        )
        // start the timer to remove the role later
        timeouts.startTimeout(target.id, 1000 * 60 * minutes)
        // create the database entry
        // eslint-disable-next-line new-cap
        const entry = new client.mongo.timeouts({
          discordId: targetId,
          expiresAt: moment().add(minutes, 'minutes'),
          username: targetString,
        })
        // save the entry to the database
        entry.save()
      })
      .catch(reject)
  })
