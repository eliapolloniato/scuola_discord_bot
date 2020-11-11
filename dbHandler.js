const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./database/db.json')
const db = low(adapter)

db.defaults({ gifBlacklistChannels: [], moderation: { kick: 0, ban: 0 }, annoy: [] })
    .write()



const get = function (name) {
    return new Promise((resolve, reject) => {
        let result = db.get(name).value()
        if (result != undefined) resolve(result)
        else reject('Proprietà non esistente')
    })
}
const set = function (name, value, type, action) {
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

module.exports = {
    get,
    set
}