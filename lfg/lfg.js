const redis = require('redis')
const client = redis.createClient()
const lfg = module.exports

lfg.addGame = (name, maxMembers) => {
    return new Promise((resolve, reject) => {
        client.hmset(`games:${name}`, `queue`, '[]', 'max', maxMembers, (err, reply) => {
            if (err) {
                reject(err)
                return
            }
            resolve(reply)
        })
    })
}

lfg.addPartyMember = (partyID, member) => {
    return new Promise(async (resolve, reject) => {
        let party = await this._promiseScan(`games:*:queues:${partyID}`)
            .catch(err => {
                reject(err)
            })
        if (!party) return
        party = party[1]
        if (party.length == 0) {
            reject('Error: Party does not exist.')
            return
        }
        let { members } = await this._promiseHgetAll(party[0])
        membersArray = JSON.parse(members)
        membersArray.push(member)
        client.hmset(party[0], `members`, JSON.stringify(membersArray), (err, reply) => {
            if (err) {
                reject(err)
                return
            }
            resolve(reply)
        })
    })
}

//i dont know where we should handle max members to a queue
lfg.createParty = (game, mode, leaderMember) => {
    return new Promise(async (resolve, reject) => {
        let uniqueID = await this._makeUniquePartyID().catch(err => {
            reject(err)
        })
        if (!uniqueID) return
        client.hmset(`games:${game}:queues:${uniqueID}`, `leader`, JSON.stringify(leaderMember), `members`, JSON.stringify([leaderMember]), `mode`, mode, (err, reply) => {
            if (err) {
                reject(err)
                return
            }
            resolve(uniqueID)
        })
    })
}

lfg.destroyParty = id => {
    return new Promise(async (resolve, reject) => {
        let targetQueue = await this._promiseScan(`games:*:queues:${id}`)
            .catch(err => {
                reject(err)
            })
        if (!targetQueue) return
        client.del(targetQueue[1], (err, reply) => {
            if (err) {
                reject(err)
                return
            }
            resolve(reply)
        })
    })
}

lfg.getGames = () => {
    return new Promise((resolve, reject) => {
        client.scan('0', 'MATCH', 'games:*', (err, rep) => {
            if (err) {
                reject(err)
                return
            }
            resolve(rep[1].map(game => game.replace(/games:/, '')))
        })
    })
}

lfg.listParties = (game = undefined) => {
    return new Promise((resolve, reject) => {
        client.scan('0', 'MATCH', `games:${game ? game : '*'}:queues:*`, async (err, reply) => {
            if (err) {
                reject(err)
                return
            }
            let arrayOfQueues = []
            for (let queue of reply[1]) {
                let queueInfo = await this._promiseHgetAll(queue)
                if (queueInfo) {
                    arrayOfQueues.push(Object.assign(queueInfo, { id: queue.replace(/^(games:[aA-zZ0-9]*:queues:)([0-9]*)$/, '$2') }))
                }
            }
            resolve(arrayOfQueues)
        })
    })
}

lfg._makeUniquePartyID = () => {
    return new Promise(async (resolve, reject) => {
        let keepLooping = true
        while (keepLooping) {
            let uniqueID = Math.floor(100000 + Math.random() * 900000)
            let duplicateIDs = await this._promiseScan('games:*:queues:*')
                .catch(err => {
                    reject(err)
                })
            if (!duplicateIDs) return
            duplicateIDs = duplicateIDs[1].map(id => {
                return id.replace(/^(games:[aA-zZ0-9]*:queues:)([0-9]*)$/, '$2')
            }).filter(id => {
                return id == uniqueID
            })
            if (duplicateIDs.length == 0) {
                resolve(uniqueID)
                keepLooping = false
            }
        }
    })
}

lfg._promiseHgetAll = search => {
    return new Promise((resolve, reject) => {
        client.hgetall(search, (err, reply) => {
            if (err) {
                reject(err)
                return
            }
            resolve(reply)
        })
    })
}

lfg._promiseScan = search => {
    return new Promise((resolve, reject) => {
        client.scan('0', 'MATCH', search, (err, rep) => {
            if (err) {
                reject(err)
                return
            }
            resolve(rep)
        })
    })
}