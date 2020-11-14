// DISCORD
const Discord = require('discord.js')
const client = new Discord.Client()

// DEBUG E TESTING
var debug = false
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
    debug = true
}

// CONFIGURAZIONE ESTERNA

const config = require('./database/config.json')
if (debug) console.log('File di configurazione caricato')

// MODULES
const modules = require('./modules')

// AVVIO BOT
client.on('ready', () => {
    client.user.setActivity(config.botActivity.text, { type: config.botActivity.type })
    console.log('Bot avviato')
})

//Nuovo membro
client.on('guildMemberAdd', member => {
    var channel = member.guild.channels.cache.find(ch => ch.id === config.welcome.channelId)
    if (!channel) return
    if (debug) console.log('Nuovo membro:', member.toString())
    channel.send(config.welcome.text.replace('{{memberName}}', member))
})


client.on('message', async message => {

    var args = []

    //Controllo messaggi
    if (!message.guild) return
    if (message.author.bot) return

    client.user.setActivity(config.botActivity.text, { type: config.botActivity.type })

    modules(Discord, client, message)
        .catch((err) => {
            console.error(err)
        })
        .then((result) => {
            if (debug) console.log(result)
        })

})



client.login(process.env.BOT_TOKEN)
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })