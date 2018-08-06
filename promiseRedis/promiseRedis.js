const redis = require('redis')
const client = redis.createClient()

const promiseRedis = module.exports

promiseRedis.del = key => {
    return new Promise((resolve, reject) => {
        client.del(key, (err, reply) => {
            if (err || !reply) {
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
            if (err || !reply) {
                reject(err)
                return
            }
            resolve(reply)
        })
    })
}

promiseRedis.hmset = args => {
    return new Promise((resolve, reject) => {
        console.log('hmset')
        client.hmset(args, (err, reply) => {
            if (err || !reply) {
                reject(err)
                return
            }
            resolve(reply)
        })
    })
}

promiseRedis.set = args => {
    return new Promise((resolve, reject) => {
        console.log('set')
        client.set(args, (err, reply) => {
            if (err || !reply) {
                reject(err)
                return
            }
            resolve(reply)
        })
    })
}

promiseRedis.scan = search => {
    return new Promise((resolve, reject) => {
        client.scan('0', 'MATCH', search, (err, reply) => {
            if (err || !reply) {
                reject(err)
            }
            resolve(reply)
        })
    })
}