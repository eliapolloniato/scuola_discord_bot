// DISCORD
const Discord = require('discord.js')
const client = new Discord.Client()

// DEBUG E TESTING
var debug = false
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
if (process.argv[2] == 'debug') {
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
    console.log('BOT PRONTO')
})

//Nuovo membro

client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.find(ch => ch.id === config.welcome.channelId)
    if (!channel) return
    if (debug) console.log('Nuovo membro:', member.toString())
    channel.send(config.welcome.text.replace('{{memberName}}', member))
})


client.on('message', async message => {

    //Controllo messaggi
    if (!message.guild) return
    if (message.author.bot) return

    //Refresh botActivity
    client.user.setActivity(config.botActivity.text, { type: config.botActivity.type })

    modules(client, message)
        .catch(err => {
            console.error(err)
            return
        })
        .then(result => {
            if (debug && result != undefined) console.log(result)
        })

})



client.login(process.env.BOT_TOKEN)
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })