'use strict'
exports.info = {
  desc: 'Post statistics about this process/system/client.',
  usage: '',
  aliases: [],
  hidden: true,
  permissions: ['SEND_MESSAGES'],
}

const moment = require('moment')
const os = require('os')
const pusage = require('pidusage')
const getos = require('getos')
const logger = require('winston')

// Get os detail on launch
let thisOS
getos((e, o) => {
  if (e) return logger.error(e)
  thisOS = o.os
  return null
})

exports.run = (client, msg) =>
  new Promise((resolve, reject) => {
    const nodeUp = moment.duration(process.uptime() * 1000)
    const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0)
    const freeMem = (os.freemem() / 1024 / 1024).toFixed(0)
    const load = os.loadavg().map((x) => (x * 100).toFixed(3))
    const osUp = moment.duration(os.uptime() * 1000)
    const cpuData = os.cpus()
    const usedRam = (totalMem - freeMem).toFixed(0)
    let msgPm
    let cmdPm
    let twitchPm

    if (nodeUp.asHours() > 1) {
      msgPm = (client.count.messages / nodeUp.asHours()).toFixed(0)
    } else {
      msgPm = client.count.messages
    }
    if (nodeUp.asDays() > 1) {
      cmdPm = (client.count.commands / nodeUp.asDays()).toFixed(0)
      twitchPm = (client.count.twitch / nodeUp.asDays()).toFixed(0)
    } else {
      cmdPm = client.count.commands
      twitchPm = client.count.twitch
    }

    const totalMembers = client.guilds.cache.reduce(
      (a, b) => a + b.members.cache.size,
      0,
    )
    const uniqueMembers = new client.Discord.Collection()
    client.guilds.cache.forEach((guild) => {
      guild.members.cache.forEach((member) => {
        if (!uniqueMembers.has(member.id)) {
          uniqueMembers.set(member.id, member)
        }
      })
    })

    pusage(process.pid, (err, stat) => {
      let cpu
      if (err) {
        client.logger.error(err)
        cpu = '--'
      } else {
        cpu = stat.cpu.toFixed(3)

        let str = '--Bot Stats--\n'
        str +=
          `Name: '${client.user.username} #${client.user.discriminator}' ` +
          `(ID: ${client.user.id})\n`
        str += `Uptime: ${client.utils.formatDuration(nodeUp)}\n`
        str += `RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
          2,
        )}MB\n`
        str += `CPU: ${cpu}%\n`
        str += `Guilds: ${client.guilds.cache.size}\n`
        str += `Channels: ${
          client.channels.cache.filter((c) => c.type === 'text').size
        } text`
        str += ` / ${
          client.channels.cache.filter((c) => c.type === 'voice').size
        } voice\n`
        str += `Members: ${uniqueMembers.size} unique / ${totalMembers} total\n`
        str += `Discord.js: ${client.Discord.version}\n`

        str += '\n--System Stats--\n'
        str += `OS: '${client.utils.capitalize(
          os.type().replace('_NT', ''),
        )} - ${os.release()}`
        if (os.platform() === 'linux') {
          str += ` - ${client.utils.capitalize(thisOS)}`
        }
        str += "'\n"
        str += `Core: '${cpuData[0].model}' (${cpuData.length}x)\n`
        str += `Uptime: ${client.utils.formatDuration(osUp)}\n`
        str += `RAM: ${usedRam}MB/${totalMem}MB (${(
          (usedRam / totalMem) *
          100
        ).toFixed(2)}%)\n`
        str += `CPU: ${load[0]}%\n`

        str += '\n--Twitch Stats--\n'
        str += `Users: ${client.utils.get(['twitch', 'users'], client) || 0}\n`
        str += `Channels: ${
          client.utils.get(['twitch', 'channels'], client) || 0
        }\n`

        str += '\n--Session Stats--\n'
        str += `Messages: ${client.count.messages} (${msgPm}/hr)\n`
        str += `Commands: ${client.count.commands} (${cmdPm}/day)\n`
        str += `Twitch: ${client.count.twitch} (${twitchPm}/day)\n`

        msg.channel.send(str, { code: 'qml' }).then(resolve).catch(reject)
      }
    })
  })
