const lfg = module.exports
const promiseRedis = require('../promiseRedis/promiseRedis.js')


const circularStringify = require('flatted/cjs').stringify

lfg.addGame = (name, maxMembers) => {
    return promiseRedis.hmset([`games:${name}`, `queue`, '[]', 'max', maxMembers])
}

//resolves true if party has found enough members
lfg.addPartyMember = (partyID, member) => {
    return new Promise(async (resolve, reject) => {
        try {

            let [, party] = await promiseRedis.scan(`games:*:queues:${partyID}`)
            if (party.length == 0) {
                reject('Party does not exist.')
            } else {
                let [, isMemberAlreadyInAParty] = await promiseRedis.scan(`games:*:queues:*:members:${member.user.id}`)

                if (isMemberAlreadyInAParty.length > 0) {
                    reject('You can only be in 1 party at a time.')
                }

                let getPartyMembers = promiseRedis.scan(`games:*:queues:${partyID}:members:*`)
                let getPartyInfo = this.getPartyInfo(partyID)
                let [[, allPartyMembers], partyInfo] = await Promise.all([getPartyMembers, getPartyInfo])
                if (allPartyMembers.length >= partyInfo.size) {
                    reject('Party is already full.')
                } else {
                    await promiseRedis.set([`${party[0]}:members:${member.user.id}`, circularStringify(member)])
                    if (partyInfo.size + 1 == allPartyMembers.length - 1) {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                }

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

            let [, isMemberAlreadyInAParty] = await promiseRedis.scan(`games:*:queues:*:members:${leaderMember.user.id}`)
            console.log(isMemberAlreadyInAParty)
            if (isMemberAlreadyInAParty.length > 0) {
                reject('You can only be in 1 party at a time.')
            } else {

                let uniqueID = await this._makeUniquePartyID()
                let addEntry = promiseRedis.hmset([`games:${game.toLowerCase()}:queues:${uniqueID}`, `mode`, mode.toLowerCase(), `size`, Number(size) + 1])
                let addLeader = this.addPartyMember(uniqueID, leaderMember)
                await Promise.all([addEntry, addLeader])
                resolve(uniqueID)

            }
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
            let gameInfo = await promiseRedis.hgetall(`games:${game.toLowerCase()}`)
            resolve(gameInfo)
        } catch (err) {
            reject(err)
        }
    })
}

lfg.getPartyInfo = id => {
    return new Promise(async (resolve, reject) => {
        try {
            let getPartyInfo = promiseRedis.scan(`games:*:queues:${id}`)
            let getPartyMembers = promiseRedis.scan(`games:*:queues:${id}:members:*`)
            let [[, partyEntry], [, partyMembers]] = await Promise.all([getPartyInfo, getPartyMembers])
            let partyInfo = await promiseRedis.hgetall(partyEntry[0])
            partyInfo.members = []
            for (let partyMember of partyMembers) {
                partyInfo.members.push(JSON.parse(await promiseRedis.get(partyMember)))
            }
            resolve(partyInfo)
        } catch (err) {
            reject(err)
        }
    })
}

lfg.getMemberGame = memberID => {
    return new Promise(async (resolve, reject) => {
        try {
            //games:overwatch:queues:108114:members:177019589010522112
            let [, memberEntry] = await promiseRedis.scan(`games:*:queues:*:members:${memberID}`)
            if (memberEntry.length == 0) {
                resolve(null)
            }
            let memberGame = memberEntry[0].replace(/^games:([a-z0-9]*):.*$/, '$1')
            resolve(memberGame)
        } catch (err) {
            reject(err)
        }
    })
}

lfg.listParties = (game = undefined) => {
    return new Promise(async (resolve, reject) => {
        try {
            let [, gameParties] = await promiseRedis.scan(`games:${game ? game.toLowerCase() : '*'}:queues:*`)
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

lfg.removePartyMember = memberID => {
    return new Promise(async (resolve, reject) => {
        try {
            let [, member] = await promiseRedis.scan(`games:*:queues:*:members:${memberID}`)
            resolve(await promiseRedis.del(member[0]))
        } catch (err) {
            reject(err)
        }
    })
}

lfg._makeUniquePartyID = () => {
    return new Promise(async (resolve, reject) => {
        let keepLooping = true
        let uniqueID = ''
        while (keepLooping) {
            try {
                uniqueID = Math.floor(100000 + Math.random() * 900000)
                let [, duplicateIDs] = await promiseRedis.scan('games:*:queues:*')
                duplicateIDs = duplicateIDs.map(id => {
                    return id.replace(/^(games:[aA-zZ0-9]*:queues:)([0-9]*)$/, '$2')
                }).filter(id => {
                    return id == uniqueID
                })
                if (duplicateIDs.length == 0) {
                    keepLooping = false
                }
            } catch (err) { }
        }
        resolve(uniqueID)
    })
}