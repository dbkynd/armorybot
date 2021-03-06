'use strict'
const moment = require('moment-timezone')

module.exports = function TwitchMessages(client) {
  if (!client.config.streamInfoLoc) return
  const modChannel =
    client.channels.cache.get('252275732628242432') ||
    client.channels.cache.get('373924698075037706')
  if (!modChannel) {
    client.utils.ownerError(
      'twitchMessages',
      client,
      'Unable to find Mod Channel',
    )
    return
  }
  const streamInfoSocket = require('socket.io-client')(
    `${client.config.streamInfoLoc.replace('http', 'ws')}`,
  )
  streamInfoSocket.on('connect', () => {
    client.logger.info('connected to streamInfo websocket')
  })
  streamInfoSocket.on('disconnect', () => {
    client.logger.warn('disconnected from streamInfo websocket')
  })
  streamInfoSocket.on('discord_ban_event', async (data) => {
    client.logger.debug(data)
    if (!data) return
    if (typeof data !== 'object') return
    if (Array.isArray(data)) return
    if (!modChannel) return
    client.logger.debug('discord_ban_event received')
    const messages = data.messages
      .sort(
        (a, b) =>
          parseInt(a.userstate['tmi-sent-ts']) -
          parseInt(b.userstate['tmi-sent-ts']),
      )
      .map((x) => {
        const time = moment(parseInt(x.userstate['tmi-sent-ts']))
        return `\`\`[${time
          .tz('America/Los_Angeles')
          .format('MM/DD/YY HH:mm:ss')}]\`\` ${x.message}`
      })
    const userData = await client.twitch.getKrakenUserData(data.banee_id)
    const userLogo =
      userData.logo ||
      'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_70x70.png'
    const now = new Date().valueOf()
    const createdAt = moment(userData.created_at).valueOf()
    const duration = moment.duration(createdAt - now)
    const registered = `Registered: ${duration.humanize(true)}`
    const embed = new client.Discord.MessageEmbed()
      .setAuthor(
        `${data.banee} (${data.banee_id})`,
        userLogo,
        `https://www.twitch.tv/${data.banee.toLowerCase()}`,
      )
      .setColor('DARK_ORANGE')
      .setDescription(`${registered}\n${messages.join('\n')}`)
      .setFooter(`Banned by ${data.banear}`)
      .setTimestamp(new Date(data.time))
    if (data.reason) embed.addField('Ban Reason:', data.reason)
    if (
      !['SEND_MESSAGES', 'EMBED_LINKS'].every((perm) =>
        modChannel.permissionsFor(client.user).has(perm),
      )
    ) {
      client.utils.ownerError(
        'twitchMessages',
        client,
        'Missing Channel Permissions',
      )
      return
    }
    modChannel.send({ embed }).catch((err) => {
      client.utils.ownerError('twitchMessages', client, err)
    })
  })

  streamInfoSocket.on('discord_unban_event', async (data) => {
    client.logger.debug(data)
    if (!data) return
    if (typeof data !== 'object') return
    if (Array.isArray(data)) return
    if (!modChannel) return
    client.logger.debug('discord_unban_event received')
    const embed = new client.Discord.MessageEmbed()
      .setAuthor(
        `${data.banee} (${data.banee_id})`,
        await client.twitch.getUserLogo(data.banee_id),
        `https://www.twitch.tv/${data.banee.toLowerCase()}`,
      )
      .setColor('DARK_BLUE')
      .setFooter(`Unbanned by ${data.banear}`)
      .setTimestamp(new Date(data.time))
    if (
      !['SEND_MESSAGES', 'EMBED_LINKS'].every((perm) =>
        modChannel.permissionsFor(client.user).has(perm),
      )
    ) {
      client.utils.ownerError(
        'twitchMessages',
        client,
        'Missing Channel Permissions',
      )
      return
    }
    modChannel.send({ embed }).catch((err) => {
      client.utils.ownerError('twitchMessages', client, err)
    })
  })

  streamInfoSocket.on('discord_report_ban', async (data) => {
    client.logger.debug(data)
    if (!data) return
    if (typeof data !== 'object') return
    if (Array.isArray(data)) return
    if (!modChannel) return
    client.logger.debug('discord_report_ban received')
    const duration = moment.duration(
      Date.now() - moment(data.created_at).valueOf(),
    )
    let name = data.username
    if (data.data && data.data.display_name) {
      if (
        data.data.login.toLowerCase() === data.data.display_name.toLowerCase()
      )
        name = data.data.display_name
    }
    const embed = new client.Discord.MessageEmbed()
      .setAuthor(
        `${name} (${data.data.id})`,
        await client.twitch.getUserLogo(data.data.id),
        `https://www.twitch.tv/${data.username.toLowerCase()}`,
      )
      .setColor('PURPLE')
      .setDescription(`Response Time: **${duration.humanize()}**`)
      .setFooter('Banned by Twitch')
      .setTimestamp(new Date())
    if (
      !['SEND_MESSAGES', 'EMBED_LINKS'].every((perm) =>
        modChannel.permissionsFor(client.user).has(perm),
      )
    ) {
      client.utils.ownerError(
        'twitchMessages',
        client,
        'Missing Channel Permissions',
      )
      return
    }
    modChannel.send({ embed }).catch((err) => {
      client.utils.ownerError('twitchMessages', client, err)
    })
  })
}
