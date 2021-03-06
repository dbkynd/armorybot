'use strict'
exports.info = {
  desc: 'Evaluate a Javascript expression.',
  usage: '<expression>',
  aliases: [],
  hidden: true,
  permissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
}

const util = require('util')
const now = require('performance-now')

exports.run = (client, msg, params = []) =>
  new Promise(async (resolve, reject) => {
    // Only allowed for the bot owner regardless of other permissions
    if (msg.author.id !== client.config.owner_id) {
      msg
        .reply('Only the bot owner has permissions to use ``eval``.')
        .then(resolve)
        .catch(reject)
      return
    }
    // Exit if no expression was passed
    if (params.length === 0) {
      client.utils.usage(msg, exports.info).then(resolve).catch(reject)
      return
    }
    const q = params
      .join(' ')
      .trim()
      // Remove new lines
      .replace(/\\n/g, '')
      // Emoji code fix
      .replace(/<:((\D*):(\d*))>/, `$1`)
    const embed = new client.Discord.MessageEmbed()
    let duration
    const start = now()
    try {
      let result = eval(q)
      // Loop through promises and return the last
      while (result && result.then) {
        result = await result
      }
      duration = (now() - start).toFixed(6) * 1000
      let resultStr
      if (typeof result !== 'string')
        resultStr = util.inspect(result, { color: true, depth: 0 })
      resultStr = `\`\`\`js\n${resultStr}\`\`\``
      embed.addField('RESULT:', resultStr).setColor('#00ba25')
    } catch (err) {
      duration = (now() - start).toFixed(6) * 1000
      embed.addField('ERROR:', `\`\`\`js\n${err}\n\`\`\``).setColor('#bb3631')
    }
    embed.setFooter(
      `${duration}μs`,
      'https://nodejs.org/static/images/logo-hexagon.png',
    )
    msg.channel.send({ embed }).then(resolve).catch(reject)
  })
