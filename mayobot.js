import fetch from "node-fetch";
import dotenv from "dotenv"
dotenv.config();

import { Client, GatewayIntentBits, Partials } from "discord.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMessageReactions, 
        GatewayIntentBits.GuildMembers, 
    ],
    partials: [
        Partials.Message,
        Partials.Reaction,
        Partials.User
    ] // Needed to fetch uncached messages and reactions
});

// client.on("ready", () => {
//     console.log(`Logged in as ${client.user.tag}`);
// });

//Live Ping
// Twitch API Credentials (Replace with your values)
const twitchClientId = process.env.TWITCH_CLIENT_ID; //from twitch dev
const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET; //from twitch dev
const twitchUsername = process.env.TWITCH_USERNAME; // Your Twitch username
const discordChannelId = process.env.LIVE_CHANNEL_ID; // Channel where message is sent

const watcher = process.env.WATCHER_ROLE_ID

let isLive = false; // Track stream status

// Function to get Twitch Access Token
async function getTwitchToken() {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: twitchClientId,
            client_secret: twitchClientSecret,
            grant_type: "client_credentials"
        })
    });
    const data = await response.json();
    return data.access_token;
}

// Function to Check if Streamer is Live
async function checkTwitchLive() {
    const token = await getTwitchToken();

    const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${twitchUsername}`, {
        headers: {
            "Client-ID": twitchClientId,
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();
    const stream = data.data.length > 0 ? data.data[0] : null;
    
    //Live test
    //const stream = { title: "Test Stream", user_name: twitchUsername }; 
    
    if (stream) {
        if (!isLive) { // If not already marked as live
            isLive = true;
            const discordChannel = await client.channels.fetch(discordChannelId);
            discordChannel.send(`<@&${watcher}> **${twitchUsername} is now LIVE on Twitch! 🔴**\n Watch here: https://twitch.tv/${twitchUsername}`);
            console.log("✅ Live message sent to Discord.");
        }
    } else {
        isLive = false;
    }
}

// Run check every 5 minutes
setInterval(checkTwitchLive, 300000);

// Bot Login
client.once("ready", () => {
    checkTwitchLive(); // Run on startup
});

//Feet Locator
client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    if (message.content.includes("feet")) {
        message.reply("https://tenor.com/view/fuwamoco-mococo-fuwawa-dog-vtuber-gif-3765479108142934123");
    }
});

//Adding Roles through Reactions
client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    //console.log(`Logged in as ${member}`)
    
    // Role ID (replace with the actual role ID you want to assign)
    const mustard = process.env.MUSTARD_ROLE_ID;
    const webHookMessageId = process.env.WEBHOOOK_MESSAGE_ID;
    const allowedEmoji = "✅";
    
    // Check if the reaction is on the webhook message
    if (reaction.message.id === webHookMessageId) {
        const role = guild.roles.cache.get(mustard);
        //console.log(role)
        if (role) {
            await member.roles.add(role);
            console.log(`✅ Added role to ${user.tag}`);
        }
    }
});


client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);


    const liveWebhookMessageId = process.env.LIVE_WEBHOOK_MESSAGE_ID
    const allowedEmoji = "🔴";

    if (reaction.message.id === liveWebhookMessageId) {
        const role = guild.roles.cache.get(watcher);
        if (role) {
            await member.roles.add(role);
            console.log(`✅ Added role to ${user.tag}`);
        }
    }
})
client.login(process.env.BOT_TOKEN);