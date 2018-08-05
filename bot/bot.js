require('dotenv').config()

const lfg = require('../lfg/lfg.js')

const Discord = require('discord.js')
const bot = new Discord.Client()

const prefix = 'l!'

bot.on('ready', () => {
    console.log('Ready.')

    bot.generateInvite(['SEND_MESSAGES', 'MANAGE_GUILD', 'MENTION_EVERYONE'])
        .then(link => {
            console.log(`Invite link: ${link}`)
        })
})

bot.on('message', async message => {
    if (message.author.bot) { return }

    let args = message.content.split(' ')
    let command = args[0].toLowerCase()

    args.shift()
    switch (command) {
        case prefix + 'createparty':
            if (args.length > 0) {
                let game = args[0].toLowerCase()
                try {
                    const filter = m => {
                        return m.member.id == message.member.id
                    }

                    message.channel.send(`What game mode would you like to play?`)

                    try {
                        let modeOptionsMessage = await message.channel.awaitMessages(filter, { max: 1, time: 60 * 1000, errors: ['time'] })
                        let mode = modeOptionsMessage.first().content.toLowerCase().split(' ')
                        mode = mode [1]

                        message.channel.send(`How many players are you looking for (excluding you)?`)
                        console.log('here')
                        let queueSizeMessage = await message.channel.awaitMessages(filter, { max: 1, time: 60 * 1000, errors: ['time'] })
                        console.log("never here")
                        let queueSize = queueSizeMessage.first().content.toLowerCase().split(' ')
                        queueSize = queueSize[0] //should make sure this is a number. tis a quest for another day
                        try {
                            let partyID = await lfg.createParty(game, mode, queueSize, message.member)
                        } catch (err) {
                            message.reply('Error interacting with queue database. Your queue has not been created.')
                        }

                    } catch (err) {
                        message.reply(`After not responding for 1 minute, your queue options have expired.`)
                    }


                } catch (err) {
                    message.reply("Please choose an existing game.")
                }
            } else {
                message.channel.send('You must specify a game (`!lfg [game name]`).')
            }
            break

    }
})

bot.login(process.env.LFG_TOKEN)