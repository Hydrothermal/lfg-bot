require('dotenv').config()

const lfg = require('../lfg/lfg.js')

const Discord = require('discord.js')
const bot = new Discord.Client()

const prefix = 'l!'

let databaseBusy = false

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

                let [checkMemberGame, checkGameExists] = await Promise.all([lfg.getMember(message.author.id), lfg.getGameInfo(game)])

                if (checkMemberGame) {
                    message.reply('You cannot create a party while in one.')
                    return
                }
                if (!checkGameExists) {
                    message.reply('Please choose an existing game.')
                    return
                }

                message.reply({ embed: createBasicEmbed(`What game mode would you like to play?`) })

                try {
                    let gameMode = await message.channel.awaitMessages(filter(message), awaitObj)
                    let mode = gameMode.first().content.toLowerCase()

                    message.channel.send(`How many players are you looking for (excluding you)?`)

                    let partySize = await message.channel.awaitMessages(filter(message, true), awaitObj)
                    let size = partySize.first().content

                    try {
                        let partyID = await lfg.createParty(game, mode, size, message.member)

                        message.reply({ embed: createBasicEmbed(`You are now in a party for ${game}, waiting for ${size - 1} more members. Your party ID is **${partyID}**`) })

                    } catch (err) {
                        message.reply(err.toString())
                    }

                } catch (err) {

                    message.reply(`After not responding for 1 minute, your queue options have expired.`)

                }
            } else {

                message.channel.send('You must specify a game (`!lfg [game name]`).')

            }
            break


        case prefix + 'leaveparty':
                try {
                    let lfgMember = await lfg.getMember(message.author.id)
                    await lfg.removePartyMember(message.author.id)
                    message.reply(`You have left you party: **${lfgMember.game.name}**.`)
                } catch (err) {
                    message.reply(err.toString())
                }
            break

        case prefix + 'help':
            message.author.send({
                embed: createBasicEmbed(
                    '**Here are a list of commands:** \n\n \
                **createparty [game]**: Create a party given game. \n \
                **status**: See your current queue status.'
                )
            })
            break


        case prefix + 'status':
            try {
                let memberInfo = await lfg.getMember(message.author.id)
                if (!memberInfo) {
                    message.reply('You are not in any queues right now.')
                } else {
                    message.reply(`You are currently in a queue for ${memberInfo.game.name}`)
                }
            } catch (err) { }
            break

    }
})

bot.login(process.env.LFG_TOKEN)


const createBasicEmbed = (text, color = 0xffffff) => {
    let embed = new Discord.RichEmbed()
        .setColor(color)
        .setDescription(text)
        .setFooter(`LFG-Bot`)
        .setTimestamp()
    return embed
}


const filter = (message, size = false) => {
    if (!size) {
        return m => {
            return m.member.id == message.member.id
        }
    } else {
        return m => {
            return m.member.id == message.member.id && Number(m.content)
        }
    }
}

const awaitObj = { max: 1, time: 60 * 1000, errors: ['time'] }