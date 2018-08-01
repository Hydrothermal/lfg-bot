const redis = require('redis')
const client = redis.createClient()
const lfg = module.exports

lfg.getGames = () => {
    return new Promise((resolve, reject) => {
        client.scan('0', 'MATCH', 'games:*', (err, rep) => {
            if (err) {
                reject(err)
            }
            resolve(rep[1].map(game => game.replace(/games:/, '')))
        })
    })
}

lfg.addGame = (name, maxMembers) => {
    return new Promise((resolve, reject) => {
        client.hmset(`games:${name}`, `queue`, '[]', 'max', maxMembers, (err, reply) => {
            if (err) {
                reject(err)
            }
            resolve(reply)
        })
    })
}