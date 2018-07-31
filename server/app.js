require('dotenv').config()

const express = require('express')
const app = express()

const cors = require('cors')

app.use(cors({
    origin: /(http:\/\/)?localhost:[0-9]{4}.*/,
    optionsSuccessStatus: 200
}))

const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

const redis = require('redis')
const client = redis.createClient()

app.get('/getGames', (req, res) => {
    client.scan('0', 'MATCH', 'games:*', (err, rep) => {
        if (err) {
            res.json({
                error: err
            })
            return
        }
        res.json(rep[1])
        return
    })
})

app.post('/addGame', (req, res) => {
    client.hmset(`games:${req.body.name}`, `queue`, '[]', 'max', '10', (err, reply) => {
        if (err) {
            res.json({
                error: err
            })
            return
        }
        res.json({
            success: true
        })
        return
    })
})

app.listen(process.env.PORT, () => {
    console.log(`Listening on ${process.env.PORT}`)
})

client.on('error', err => {
    console.log(`Error with redis database: ${err}`)
})