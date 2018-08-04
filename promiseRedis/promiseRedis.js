const redis = require('redis')
const client = redis.createClient()

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

promiseRedis.scan = search => {
    return new Promise((resolve, reject) => {
        client.scan('0', 'MATCH', search, (err, rep) => {
            if (err) {
                reject(err)
            }
            resolve(rep)
        })
    })
}