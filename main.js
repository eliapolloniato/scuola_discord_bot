// DISCORD
const Discord = require('discord.js')
const client = new Discord.Client()

// DEBUG E TESTING
var debug = false
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
    debug = true
}

// DATABASE
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./database/db.json')
const db = low(adapter)

// FETCH
const axios = require('axios')
const covid_italia = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-andamento-nazionale-latest.json'
const moment = require('moment')

db.defaults({ gifBlacklistChannels: [], moderation: { kick: 0, ban: 0 }, annoy: [] })
    .write()

const dbHandler = {
    get: function(name) {
        return new Promise((resolve, reject) => {
            let result = db.get(name).value()
            if (result != undefined) resolve(result)
            else reject('Proprietà non esistente')
        })
    },
    set: function(name, value, type, action) {
        return new Promise((resolve, reject) => {
            let result = db.get(name)
            if (result.value() != undefined) {
                if (type === 'array') {
                    let data
                    try {
                        switch (action) {
                            case 'add':
                                result.push(value).write()
                                break
                            case 'remove':
                                result.pull(value).write()
                                break

                            default:
                                throw new Error(`invalid action for ${type}`)
                        }
                    } catch (err) {
                        reject(err)
                    }
                    if (data) resolve(data)
                    else resolve('done')
                } else if (type === 'string') {
                    let data
                    try {
                        switch (action) {
                            case 'add':
                                result.set(value).write()
                                break
                            case 'remove':
                                result.unset(value).write()
                                break

                            default:
                                throw new Error(`invalid action for ${type}`)
                        }
                    } catch (err) {
                        reject(err)
                    }
                    if (data) resolve(data)
                    else resolve('done')
                } else {
                    reject('no type given')
                }
            } else reject('invalid name')
        })
    }
}

// EMBED
function createEmbed(type, description, avatarUrl, author) {
    let result
    switch (type) {
        case 'ban':
            result = new Discord.MessageEmbed()
                .setAuthor('LiotardoBot', avatarUrl)
                .setTitle('Sei stato bannato dal server Scuola')
                .addFields({ name: 'Autore', value: author }, { name: 'Motivo', value: description })
                .setFooter('eliapolloniato')
                .setColor(0xf54242) //red
            break

        case 'kick':
            result = new Discord.MessageEmbed()
                .setAuthor('LiotardoBot', avatarUrl)
                .setTitle('Sei stato kickato dal server Scuola')
                .addFields({ name: 'Autore', value: author }, { name: 'Motivo', value: description })
                .setFooter('eliapolloniato')
                .setColor(0xffb752) //orange
            break
            break

        default:
            return false
    }
    return result
}

// DELAY PER KICK E BAN
const notificationDelay = 500
const delay = (msec) => new Promise((resolve) => setTimeout(resolve, msec))


// ERRORI
class BotError {
    constructor(error, type) {
        this.error = error
        this.text = config.error.defaultError.replace('{{type}}', type).replace('{{error}}', error)
    }
    sendError(messageToReply) {
        messageToReply.reply(this.text)
    }
}

// CONFIGURAZIONE ESTERNA
const config = require('./database/config.json')
if (debug) console.log('File di configurazione caricato')

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


    //Google Meet links parsing
    if (message.content.includes('meet.google.com') && message.content.includes('?')) {
        let link = message.content.split('?')[0]
        message.delete()
        message.channel.send(link)
    }


    //Se le gif sono sono state disattivate, elimininale
    if (message.content.includes('tenor')) {
        dbHandler.get('gifBlacklistChannels')
            .catch((err) => {
                new BotError(err, 'db').sendError(message)
                return
            })
            .then((blackList) => {
                if (blackList.includes(message.channel.id)) {
                    message.delete().catch(err => new BotError(err, 'delete').sendError(message))
                    if (debug) console.log('Eliminato un messaggio:', message.content)
                }
            })

    }


    //Comandi
    if (message.content.startsWith(config.prefix)) {
        args = message.content.split(' ')
    }


    //Comando: elimina
    if (args[0] == config.prefix + 'elimina') {

        if (message.member.roles.cache.some(role => role.name === config.permittedRole)) {

            //Se l'utente ha il ruolo permesso, può eliminare fino a 80 msg
            var n = parseInt(args[1], 10) + 1
            if (n == undefined || n == null || n > 80 || n < 1) {
                message.reply('Il massimo di messaggi che puoi eliminare è 80')
                return
            }

        } else {

            //Se l'utente non ha il ruolo permesso è limitato a 10 msg
            var n = parseInt(args[1], 10) + 1
            if (n == undefined || n == null || n > 11 || n < 1) {
                message.reply('Il massimo di messaggi che puoi eliminare è 10')
                return
            }
        }
        message.react(config.emoji.gotIt)

        //Elimina n messaggi
        message.channel.messages.fetch({ limit: n }).then(listMessages => {
            message.channel.bulkDelete(listMessages).catch(err => new BotError(err, 'delete').sendError(message))
        })
    }

    //Comando gif
    if (args[0] == config.prefix + 'gif') {
        if (message.member.roles.cache.some(role => role.name === config.permittedRole)) {
            let newGifStatus = args[1]
            if (newGifStatus == undefined || newGifStatus == null) {
                new BotError('nessuno stato specificato', 'state').sendError(message)
                return
            }
            blackList = dbHandler.get('gifBlacklistChannels')
                .catch((err) => {
                    new BotError(err, 'db').sendError(message)
                    return
                })
                .then((blackList) => {
                    if (newGifStatus == 'on') {
                        if (blackList.includes(message.channel.id)) {
                            dbHandler.set('gifBlacklistChannels', message.channel.id, 'array', 'remove')
                                .catch((err) => {
                                    new BotError(err, 'db').sendError(message)
                                    return
                                })
                            message.channel.send(`Ora le gif sono permesse in <#${message.channel.id}>`)
                        } else {
                            message.reply(`Il canale <#${message.channel.id}> non è presente all'interno della blacklist.`)
                        }
                    } else if (newGifStatus == 'off') {
                        if (!blackList.includes(message.channel.id)) {
                            dbHandler.set('gifBlacklistChannels', message.channel.id, 'array', 'add')
                                .catch((err) => {
                                    new BotError(err, 'db').sendError(message)
                                    return
                                })
                            message.channel.send(`Ora le gif non sono permesse in <#${message.channel.id}>`)
                        } else {
                            message.reply(`Il canale <#${message.channel.id}> è già presente nella blacklist.`)
                        }

                    } else {
                        new BotError('Stato non valido', 'state').sendError(message)
                        return
                    }
                })

        } else {
            message.reply(config.permissions.insufficient.replace('{{role}}', config.permittedRole))
            return
        }
    }


    //Comando gifstatus
    if (args[0] == config.prefix + 'statogif') {
        dbHandler.get('gifBlacklistChannels').catch((err) => {
                new BotError(err, 'db').sendError(message)
                return
            })
            .then((status) => {
                message.reply(`in questo canale le gif sono ${status.includes(message.channel.id) ? 'disabilitate' : 'abilitate'}`)
            })

    }

    //Moderazione
    //ban
    if (args[0] == config.prefix + 'ban') {
        if (message.member.roles.cache.some(role => role.name === config.permittedRole)) {
            const user = message.mentions.users.first()
            let reason
            if (args.length > 2) reason = args.slice(2).join(' ')
            if (user) {
                const member = message.guild.member(user)
                if (member) {
                    if (member.bannable) {
                        member.send(createEmbed('ban', reason ? reason : 'Il moderatore non ha specificato il motivo', client.user.avatarURL(), message.author.tag.toString()))
                        await delay(notificationDelay)
                        member
                            .ban({
                                reason: reason ? reason : config.moderation.banReason.message.replace('{{moderator}}', message.author.tag),
                            })
                            .then(() => {
                                message.reply(config.moderation.botResponses.ban.success.replace('{{user}}', user.tag))
                            })
                            .catch(err => {
                                new BotError(err, 'ban').sendError(message)
                            })
                    } else {
                        message.reply(config.moderation.botResponses.ban.notBannable)
                    }
                } else {
                    message.reply(config.moderation.botResponses.ban.notInServer)
                }
            } else {
                message.reply(config.moderation.botResponses.ban.userNotSpecified)
            }
        } else {
            message.reply(config.permissions.insufficient.replace('{{role}}', config.permittedRole))
            return
        }
    }

    //kick
    if (args[0] == config.prefix + 'kick') {
        if (message.member.roles.cache.some(role => role.name === config.permittedRole)) {
            const user = message.mentions.users.first()
            let reason
            if (args.length > 2) reason = args.slice(2).join(' ')
            if (user) {
                const member = message.guild.member(user)
                if (member) {
                    if (member.kickable) {
                        member.send(createEmbed('kick', reason ? reason : 'Il moderatore non ha specificato il motivo', client.user.avatarURL(), message.author.tag.toString()))
                        await delay(notificationDelay)
                        member
                            .kick()
                            .then(() => {
                                message.reply(config.moderation.botResponses.kick.success.replace('{{user}}', user.tag))
                            })
                            .catch(err => {
                                new BotError(err, 'kick').sendError(message)
                            })
                    } else {
                        message.reply(config.moderation.botResponses.kick.notKickable)
                    }
                } else {
                    message.reply(config.moderation.botResponses.kick.notInServer)
                }
            } else {
                message.reply(config.moderation.botResponses.kick.userNotSpecified)
            }
        } else {
            message.reply(config.permissions.insufficient.replace('{{role}}', config.permittedRole))
            return
        }
    }

    //COVID-19
    if (args[0] == config.prefix + 'covid') {
        axios.get(covid_italia)
            .catch((err) => {
                new BotError(err, 'fetch-covid').sendError(message)
            })
            .then((res) => {
                let casi = res.data[0]
                let risposta = new Discord.MessageEmbed()
                    .setFooter(`Dati aggiornati a ${moment(casi.data).locale('it').format('lll')}`)
                    .setTitle('Dati Covid19 Italia')
                    .setDescription(`Casi totali: ${casi.totale_casi}\nNuovi positivi: ${casi.nuovi_positivi}\nDeceduti: ${casi.deceduti}`)
                    .setColor('#aaf542')
                    .setThumbnail('https://phil.cdc.gov//PHIL_Images/23311/23311_lores.jpg')
                message.reply(risposta)
            })
    }
})



client.login(process.env.BOT_TOKEN)
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })