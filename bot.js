require("dotenv").config();

const Discord = require("discord.js");
const bot = new Discord.Client();


bot.on("ready", () => {
    console.log("Ready.");
    client.generateInvite(['SEND_MESSAGES', 'MANAGE_GUILD', 'MENTION_EVERYONE'])
        .then(link => {
            console.log(`Invite link: ${link}`);
        });
});

bot.on("message", message => {
    if (message.author.bot) { return; }

    let args = message.content.split(" ");
    let command = args[0];

    args = args.slice(1);

    switch (command) {
        case "!lfg":
            if (args.length > 0) {
                message.channel.send(`You are now looking for other players for **${args.join(" ")}**.`);
            } else {
                message.channel.send("You must specify a game (`!lfg [game name]`).");
            }
            break;
    }
});

bot.login(process.env.LFG_TOKEN);