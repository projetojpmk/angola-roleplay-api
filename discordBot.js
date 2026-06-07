import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once("ready", () => {
    console.log("🤖 Discord Bot ONLINE!");
});

export function sendVIPCode(discordId, code) {
    try {
        const user = client.users.cache.get(discordId);

        if (user) {
            user.send(`🔥 VIP APROVADO!\n🔑 Código: ${code}`);
        } else {
            console.log("Usuário não encontrado no cache");
        }
    } catch (err) {
        console.log("Erro Discord:", err);
    }
}