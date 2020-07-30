// LIBRERIE
const Discord = require('discord.js')
const client = new Discord.Client()
const nconf = require('nconf')
require('dotenv').config()

// DEBUG
var myArgs = process.argv.slice(2)
var debug = false
if (myArgs == 'debug') debug = true
if (debug) console.log('Debug:', debug)

// CONFIGURAZIONE ESTERNA
nconf.use('file', { file: './config.json' })
nconf.load()
if (debug) console.log('File di configurazione caricato')

// PREFISSO, RUOLO E GIF
var prefix = nconf.get('prefix')
if (debug) console.log('Prefix:', prefix)
var permittedRole = nconf.get('role')
if (debug) console.log('Ruolo:', permittedRole)
var gifBlacklistChannels = nconf.get('gifBlacklistChannels')
var gay = nconf.get('gay')

// REAZIONE
var emoji = '🏳️‍🌈'
var gotIt = '👌'

// AVVIO BOT
client.on('ready', () => {
    client.user.setActivity("la lenta estinzione della razza umana", { type: 'WATCHING' })
    console.log('In attesa di comandi')
})

//Nuovo membro
client.on('guildMemberAdd', member => {
    var channel = member.guild.channels.cache.find(ch => ch.id === '715128957732782151')
    if (!channel) return
    if (debug) console.log('Nuovo membro:', member.toString())
    channel.send(`Wella, un nuovo membro è entrato? ${member}, ricorda di usare il codice XIUDERONE nello shop.`)
})

/*
// ANDREA REAZIONE 
client.on('message', message => {
    if (!message.guild) return
    console.log('Tag:', message.author.tag, 'Id:', message.author.id)
    if (message.author.id === '556900696776245249') {
        message.react(emoji)
            .catch(console.error)
    }
}) */


// LOVATO REAZIONE
/*
client.on('message', message => {
    if (!message.guild) return
    if (message.author.id === '555395831432347649') {
        message.react(emoji)
            .catch(console.error)
    }
}) */


client.on('message', async message => {

    var args = []

    //Controllo messaggi
    if (!message.guild) return
    if (message.author.bot) return

    client.user.setActivity("la lenta estinzione della razza umana", { type: 'WATCHING' })


    //Google Meet links parsing
    if (message.content.includes('meet.google.com') && message.content.includes('?')) {
        let link = message.content.split('?')[0]
        message.delete()
        message.channel.send(link)
    }


    //Se le gif sono sono state disattivate, elimininale
    if (message.content.includes('tenor') && gifBlacklistChannels.includes(message.channel.id)) {
        message.delete().catch(err => message.reply('Errore, forse premessi insufficienti: ' + err))
        console.log('Eliminato un messaggio:', message.content)
        return
    }


    //Comandi
    if (message.content.startsWith(prefix)) {
        args = message.content.split(' ')
    }

    // ROTTO
    /*
    if (args[0] == prefix + 'gay') {
        if (args[2] == 'off' && gay.includes(message.mentions.users.first())) {
            let index = gay.indexOf(message.mentions.users.first())
            if (index > -1) {
                gay.splice(index, 1)
            }
            nconf.set('gay', gay)
            nconf.save((err) => {
                if (err) {
                    console.error(err)
                    return
                }
                if (debug) console.log('Configurazione salvata')
            })
            message.channel.send(`<${message.mentions.users.first()}> non è più gay`)
        } else {
            message.reply(`<${message.mentions.users.first()}> non è ancora gay`)
        }
    } else if (args[2] == 'on') {
        if (!gay.includes(message.mentions.users.first())) {
            gay.push(message.mentions.users.first())
            nconf.set('gay', gay)
            nconf.save((err) => {
                if (err) {
                    console.error(err)
                    return
                }
                if (debug) console.log('Configurazione salvata')
            })
            message.channel.send(`Ora <${message.mentions.users.first()}> è gay`)
        } else {
            message.reply(`<${message.mentions.users.first()}> è già gay`)
        }
        gay = nconf.get('gay')

    } else { message.reply('Stato gay non valido') }

} */


    //Comando: elimina
    if (args[0] == prefix + 'elimina') {

        if (message.member.roles.cache.some(role => role.name === permittedRole)) {

            //Se l'utente ha il ruolo permesso, può eliminare fino a 80 msg
            var n = parseInt(args[1], 10) + 1
            if (n == undefined || n == null || n > 80 || n < 1) return

        } else {

            //Se l'utente non ha il ruolo permesso è limitato a 10 msg
            var n = parseInt(args[1], 10) + 1
            if (n == undefined || n == null || n > 11) {
                message.reply('Il massimo di messaggi che puoi eliminare è 10')
                return
            }
        }
        message.react(gotIt)

        //Elimina n messaggi
        message.channel.messages.fetch({ limit: n }).then(listMessages => {
            message.channel.bulkDelete(listMessages).catch(err => message.reply('Errore, forse premessi: ' + err))
        })
    }

    //Comando gif
    if (args[0] == prefix + 'gif') {
        if (message.member.roles.cache.some(role => role.name === permittedRole)) {
            let newGifStatus = args[1]
            if (newGifStatus == undefined || newGifStatus == null) {
                message.reply('nessuno stato specificato.')
                return
            }
            if (newGifStatus == 'on') {
                if (gifBlacklistChannels.includes(message.channel.id)) {
                    let index = gifBlacklistChannels.indexOf(message.channel.id);
                    if (index > -1) {
                        gifBlacklistChannels.splice(index, 1);
                    }
                    nconf.set('gifBlacklistChannels', gifBlacklistChannels)
                    nconf.save((err) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                        if (debug) console.log('Configurazione salvata')
                    })
                    message.channel.send(`Ora le gif sono permesse in <#${message.channel.id}>`)
                } else {
                    message.reply(`Il canale <#${message.channel.id}> non è presente all'interno della blacklist.`)
                }
            } else if (newGifStatus == 'off') {
                if (!gifBlacklistChannels.includes(message.channel.id)) {
                    gifBlacklistChannels.push(message.channel.id)
                    nconf.set('gifBlacklistChannels', gifBlacklistChannels)
                    nconf.save((err) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                        if (debug) console.log('Configurazione salvata')
                    })
                    message.channel.send(`Ora le gif non sono permesse in <#${message.channel.id}>`)
                } else {
                    message.reply(`Il canale <#${message.channel.id}> è già presente nella blacklist.`)
                }

            } else { message.reply('Stato non valido o nuovo canale') }

            gifStatus = nconf.get('gifBlacklistChannels')
        } else {
            message.reply(`non hai il permesso di utilizzare questo comando, chiedi ad un utente con ruolo ${permittedRole}.`)
            return
        }
    }


    //Comando gifstatus
    if (args[0] == prefix + 'statogif') {
        let status = gifBlacklistChannels.includes(message.channel.id) ? 'disabilitate' : 'abilitate'
        message.reply(`in questo canale le gif sono ${status}`)
    }


    //Comando: prefisso
    if (args[0] == prefix + 'prefisso') {
        if (message.member.roles.cache.some(role => role.name === permittedRole)) {
            let newPrefix = args[1]
            if (newPrefix == undefined || newPrefix == null) {
                message.reply('nessun prefisso specificato.')
                return
            }
            if (newPrefix.length >= 5) {
                message.reply('il prefisso specificato supera i 5 caratteri consentiti.')
                return
            }
            if (debug) console.log('Prefisso modificato in', newPrefix)
            nconf.set('prefix', newPrefix)
            nconf.save((err) => {
                if (err) {
                    console.error(err)
                    return
                }
                if (debug) console.log('Configurazione salvata')

            })
            prefix = nconf.get('prefix')
            message.reply(`prefisso modificato in ${prefix}.`)
        } else {
            message.reply(`non hai il permesso di utilizzare questo comando, chiedi ad un utente con ruolo ${permittedRole}.`)
            return
        }
    }


    //Comando: ruolo
    if (args[0] == prefix + 'ruolo') {
        if (message.member.roles.cache.some(role => role.name === permittedRole)) {
            let newRole = args[1]
            if (newRole == undefined || newRole == null) {
                message.reply('nessun ruolo specificato.')
                return
            }
            let roleArray = []
            message.guild.roles.cache.forEach(role => roleArray.push(role.name))
            if (!roleArray.includes(newRole)) {
                message.reply(`il ruolo ${newRole} non esiste.`)
                return
            }

            if (debug) console.log('Ruolo modificato in', newRole)
            nconf.set('role', newRole)
            nconf.save((err) => {
                if (err) {
                    console.error(err)
                    return
                }
                if (debug) console.log('Configurazione salvata')

            })
            permittedRole = nconf.get('role')
            message.reply(`ruolo modificato in ${permittedRole}.`)
        } else {
            message.reply(`non hai il permesso di utilizzare questo comando, chiedi ad un utente con ruolo ${permittedRole}.`)
            return
        }
    }
})

client.login(process.env.TOKEN)