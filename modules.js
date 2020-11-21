// DEBUG E TESTING
var debug = false
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
if (process.argv[2] == 'debug') {
    debug = true
}

// DISCORD
const Discord = require('discord.js')

// FETCH
const axios = require('axios')
const covid_italia = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-andamento-nazionale-latest.json'
const moment = require('moment')

// CONFIGURAZIONE ESTERNA
const config = require('./database/config.json')

// VERSION
var version
axios.get('https://api.github.com/repos/eliapolloniato/scuola_discord_bot/commits', {
    headers: {
        'Accept': ' application/vnd.github.groot-preview+json'
    }
}).then(({ data }) => {
    version = data[0].sha.slice(0, 7) || ''
    if (debug) {
        version = version + '_dev'
        console.log('Version: ', version)
    }
})

// EMBED
function createEmbed(type, description, avatarUrl, author) {
    let result
    switch (type) {
        case 'ban':
            result = new Discord.MessageEmbed()
                .setAuthor('LiotardoBot', avatarUrl)
                .setTitle('Sei stato bannato dal server Scuola')
                .addFields({ name: 'Autore', value: author }, { name: 'Motivo', value: description })
                .setFooter('Versione: ' + version)
                .setColor(0xf54242) //red
            break

        case 'kick':
            result = new Discord.MessageEmbed()
                .setAuthor('LiotardoBot', avatarUrl)
                .setTitle('Sei stato kickato dal server Scuola')
                .addFields({ name: 'Autore', value: author }, { name: 'Motivo', value: description })
                .setFooter('Versione: ' + version)
                .setColor(0xffb752) //orange
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

class CommandReport {
    constructor(messageAuthor, args) { // message.author.tag
        this.time = new Date
        this.author = messageAuthor
        this.module = args.length ? args[0].replace(config.prefix, '') : 'normal text'
        this.command = args.join(' ').length ? args.join(' ') : undefined
    }
    get report() {
        return {
            time: this.time, status: this.status, module: this.module, user: this.author, command: this.command
        }
    }
}

class CommandError extends CommandReport {
    constructor(messageAuthor, args) {
        super(messageAuthor, args)
        this.error = true
        this.status = 'error'
    }
}

class CommandDone extends CommandReport {
    constructor(messageAuthor, args) {
        super(messageAuthor, args)
        this.error = false
        this.status = 'done'
    }
}

// DATABASE
const db = require('./dbHandler')


const moduleHandler = function (client, message) {
    return new Promise((resolve, reject) => {

        //Google Meet links parsing
        if (message.content.includes('meet.google.com') && message.content.includes('?')) {
            let link = message.content.split('?')[0]
            message.delete()
            message.channel.send(link)
        }


        //Se le gif sono sono state disattivate, elimininale
        if (message.content.includes('tenor')) {
            db.get('gifBlacklistChannels')
                .catch((err) => {
                    new BotError(err, 'db').sendError(message)
                    reject(new CommandError(message.author.tag, args).report)
                    return
                })
                .then((blackList) => {
                    if (blackList.includes(message.channel.id)) {
                        message.delete().catch(err => new BotError(err, 'delete').sendError(message))
                        if (debug) console.log('Eliminato un messaggio:', message.content)
                    }
                })

        }

        var args = []

        //Comandi
        if (message.content.startsWith(config.prefix)) {
            args = message.content.split(' ')
        }

        //Comando: elimina
        if (args[0] == config.prefix + 'elimina') {

            if (message.member.roles.cache.some(role => role.name === config.permittedRole)) {

                //Se l'utente ha il ruolo permesso, può eliminare fino a 80 msg
                var n = parseInt(args[1], 10)
                if (n == undefined || n == null || n > 80 || n < 1) {
                    message.reply(config.error.elimina.replace('{{min}}', '1').replace('{{max}}', '80'))
                }
            } else {

                //Se l'utente non ha il ruolo permesso è limitato a 10 msg
                var n = parseInt(args[1], 10)
                if (n == undefined || n == null || n > 10 || n < 1) {
                    message.reply(config.error.elimina.replace('{{min}}', '1').replace('{{max}}', '10'))
                }
            }
            message.react(config.reaction.gotIt)

            //Elimina n messaggi
            message.channel.messages.fetch({ limit: n + 1 })
                .then(listMessages => message.channel.bulkDelete(listMessages))
                .catch(err => {
                    new BotError(err, 'delete').sendError(message)
                    reject(new CommandError(message.author.tag, args).report)
                    return
                })
        }

        //Comando gif
        if (args[0] == config.prefix + 'gif') {
            if (message.member.roles.cache.some(role => role.name === config.permittedRole)) {
                let newGifStatus = args[1]
                if (newGifStatus == undefined || newGifStatus == null) {
                    new BotError('nessuno stato specificato', 'state').sendError(message)
                    reject(new CommandError(message.author.tag, args).report)
                    return
                }
                blackList = db.get('gifBlacklistChannels')
                    .catch((err) => {
                        new BotError(err, 'db').sendError(message)
                        reject(new CommandError(message.author.tag, args).report)
                        return
                    })
                    .then((blackList) => {
                        if (newGifStatus == 'on') {
                            if (blackList.includes(message.channel.id)) {
                                db.set('gifBlacklistChannels', message.channel.id, 'array', 'remove')
                                    .catch((err) => {
                                        new BotError(err, 'db').sendError(message)
                                        reject(new CommandError(message.author.tag, args).report)
                                        return
                                    })
                                message.channel.send(config.gif.on.replace('{{channel}}', message.channel.id))
                            } else {
                                message.reply(config.gif.inBlacklist.false.replace('{{channel}}', message.channel.id))
                            }
                        } else if (newGifStatus == 'off') {
                            if (!blackList.includes(message.channel.id)) {
                                db.set('gifBlacklistChannels', message.channel.id, 'array', 'add')
                                    .catch((err) => {
                                        new BotError(err, 'db').sendError(message)
                                        reject(new CommandError(message.author.tag, args).report)
                                        return
                                    })
                                message.channel.send(config.gif.off.replace('{{channel}}', message.channel.id))
                            } else {
                                message.reply(config.gif.inBlacklist.true.replace('{{channel}}', message.channel.id))
                            }

                        } else {
                            new BotError('Stato non valido', 'state').sendError(message)
                            reject(new CommandError(message.author.tag, args).report)
                            return
                        }
                    })

            } else {
                message.reply(config.permissions.insufficient.replace('{{role}}', config.permittedRole))
                return
            }
        }


        //Comando statogif
        if (args[0] == config.prefix + 'statogif') {
            db.get('gifBlacklistChannels').catch((err) => {
                new BotError(err, 'db').sendError(message)
                reject(new CommandError(message.author.tag, args).report)
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
                            delay(notificationDelay).then(() => {
                                member
                                    .ban({
                                        reason: reason ? reason : config.moderation.banReason.message.replace('{{moderator}}', message.author.tag),
                                    })
                                    .then(() => {
                                        message.reply(config.moderation.botResponses.ban.success.replace('{{user}}', user.tag))
                                    })
                                    .catch(err => {
                                        new BotError(err, 'ban').sendError(message)
                                        reject(new CommandError(message.author.tag, args).report)
                                        return
                                    })
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
                            delay(notificationDelay).then(() => {
                                member
                                    .kick()
                                    .then(() => {
                                        message.reply(config.moderation.botResponses.kick.success.replace('{{user}}', user.tag))
                                    })
                                    .catch(err => {
                                        new BotError(err, 'kick').sendError(message)
                                        reject(new CommandError(message.author.tag, args).report)
                                        return
                                    })
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
                    reject(new CommandError(message.author.tag, args).report)
                    return
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

        resolve(new CommandDone(message.author.tag, args).report)
    })

}


module.exports = moduleHandler