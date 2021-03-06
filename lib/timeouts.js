const moment = require('moment')

let client

async function init(_client) {
  // store client to a global variable
  client = _client
  // get all timeout entries from the database
  const entries = await client.mongo.timeouts.find()
  // loop through entries and restart the timer for each one
  entries.forEach((entry) => {
    // get the duration until expiry in milliseconds
    const duration = moment.duration(moment(entry.expiresAt).diff(moment()))
    startTimeout(entry.discordId, duration.asMilliseconds())
  })
}

async function removeTimeout(id) {
  if (!id) return
  // get any existing database info
  const entry = await client.mongo.timeouts.findOne({ discordId: id })
  // target string will hold the name of the target from whatever source we can get it from; Discord or Database
  let targetString
  // try to get the target from discord itself
  const target = client.guilds.cache
    .get('84764735832068096')
    .members.cache.get(id)
  if (target) {
    // target found; use structured name in case the username has changed since its addition
    targetString = `**${target.user.username}#${target.user.discriminator}** (${target.user.id})`
  } else if (entry) {
    // if no target, the user might of left any guilds the client is in
    // so we will use the stored username string from the database
    targetString = entry.username
  } else {
    // no discord user found and no entry was stored; this is likely due to an error
    // so we will just post the id
    targetString = id
  }
  // remove the role if we have a user target
  if (target) target.roles.remove('706906565784895509').catch()
  // send a message to #mod-logs with info about the timeout expiration
  client.guilds.cache
    .get('84764735832068096')
    .channels.cache.get('252275732628242432')
    .send(`The timeout has ended for ${targetString}`)
    .catch()
  // delete the database entry if existing
  try {
    if (entry) entry.remove()
  } catch (e) {
    // Do Nothing
  }
}

function startTimeout(id, ms) {
  setTimeout(() => {
    removeTimeout(id).catch()
  }, ms)
}

module.exports = {
  init,
  startTimeout,
}
