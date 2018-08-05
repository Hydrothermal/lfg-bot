const lfg = module.exports
const promiseRedis = require('../promiseRedis/promiseRedis.js')

lfg.addGame = (name, maxMembers) => {
    return promiseRedis.hmset([`games:${name}`, `queue`, '[]', 'max', maxMembers])
}

lfg.addPartyMember = (partyID, member) => {
    return new Promise(async (resolve, reject) => {
        try {
            let [, party] = await promiseRedis.scan(`games:*:queues:${partyID}`)
            if (party.length == 0) {
                reject('Error: Party does not exist.')
            } else {
                let { members } = await promiseRedis.hgetall(party[0])
                membersArray = JSON.parse(members)
                membersArray.push(member)
                resolve(await promiseRedis.hmset([party[0], `members`, JSON.stringify(membersArray)]))
            }
        } catch (err) {
            reject(err)
        }
    })
}

//i dont know where we should handle max members to a queue
lfg.createParty = (game, mode, size, leaderMember) => {
    return new Promise(async (resolve, reject) => {
        try {
            let uniqueID = await this._makeUniquePartyID()
            await promiseRedis.hmset([`games:${game}:queues:${uniqueID}`, `leader`, JSON.stringify(leaderMember), `members`, JSON.stringify([leaderMember]), `mode`, mode, `size`, size])
            resolve(uniqueID)
        } catch (err) {
            reject(err)
        }
    })
}

lfg.destroyParty = id => {
    return new Promise(async (resolve, reject) => {
        try {
            let [, targetQueue] = await promiseRedis.scan(`games:*:queues:${id}`)
            resolve(await promiseRedis.del(targetQueue[0]))
        } catch (err) {
            reject(err)
        }
    })
}

lfg.getGames = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let [, games] = await promiseRedis.scan('games:*')
            resolve(games.map(game => game.replace(/games:/, '')))
        } catch (err) {
            reject(err)
        }
    })
}

lfg.getGameInfo = game => {
    return new Promise(async (resolve, reject) => {
        try {
            let gameInfo = await promiseRedis.hgetall(`games:${game}`)
            resolve(gameInfo)
        } catch (err) {
            reject(err)
        }
    })
}

lfg.listParties = (game = undefined) => {
    return new Promise(async (resolve, reject) => {
        try {
            let [, gameParties] = await promiseRedis.scan(`games:${game ? game : '*'}:queues:*`)
            let gamePartiesArray = []
            for (let queue of gameParties) {
                let queueInfo = await promiseRedis.hgetall(queue)
                    .catch(() => { })
                gamePartiesArray.push(Object.assign(queueInfo, { id: queue.replace(/^(games:[aA-zZ0-9]*:queues:)([0-9]*)$/, '$2') }))
            }
            resolve(gamePartiesArray)
        } catch (err) {
            reject(err)
        }
    })
}

lfg._makeUniquePartyID = () => {
    return new Promise(async (resolve, reject) => {
        let keepLooping = true
        while (keepLooping) {
            try {
                let uniqueID = Math.floor(100000 + Math.random() * 900000)
                let [, duplicateIDs] = await promiseRedis.scan('games:*:queues:*')
                duplicateIDs = duplicateIDs.map(id => {
                    return id.replace(/^(games:[aA-zZ0-9]*:queues:)([0-9]*)$/, '$2')
                }).filter(id => {
                    return id == uniqueID
                })
                if (duplicateIDs.length == 0) {
                    resolve(uniqueID)
                    keepLooping = false
                }
            } catch (err) {}
        }
    })
}