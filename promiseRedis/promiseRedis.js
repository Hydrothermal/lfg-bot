const client = require('redis').createClient().select(12)

const promiseRedis = module.exports

promiseRedis.del = key => {
    return new Promise((resolve, reject) => {
        client.del(key, (err, reply) => {
            if (err) {
                reject(err)
                return
            }
            resolve(reply)
        })
    })
}

promiseRedis.get = key => {
    return new Promise((resolve, reject) => {
        client.get(key, (err, reply) => {
            if (err) {
                reject(err)
                return
            }
            resolve(reply)
        })
    })
}

promiseRedis.hgetall = search => {
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

promiseRedis.hmset = args => {
    return new Promise((resolve, reject) => {
        client.hmset(args, (err, reply) => {
            if (err) {
                reject(err)
                return
            }
            resolve(reply)
        })
    })
}

promiseRedis.keyLength = () => {
    return new Promise((resolve, reject) => {
        client.info('keyspace', (err, reply) => {
            if (err) {
                reject(err)
                return
            }
            resolve(reply.replace(/.*(keys=)([0-9]*).*/gms, '$2'))
        })
    })
}

promiseRedis.set = args => {
    return new Promise((resolve, reject) => {
        client.set(...args, (err, reply) => {
            if (err) {
                reject(err)
                return
            }
            resolve(reply)
        })
    })
}

promiseRedis.scan = search => {
    return new Promise(async (resolve, reject) => {
        let keyLength = 999999
        try {
            keyLength = await this.keyLength()
        } catch (err) {
            console.warn("Redis scan failed", err)
        }
        client.scan('0', 'MATCH', search, 'COUNT', keyLength, (err, reply) => {
            if (err) {
                reject(err)
            }
            resolve(reply)
        })
    })
}