import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: ["CHANNEL"] // 🔥 necessário para DM funcionar
});

client.once("ready", () => {
    console.log("🤖 Discord Bot ONLINE!");
});

/**
 * 🔥 ENVIAR VIP PARA O CLIENTE (DM)
 */
export async function sendVIPCode(discordId, code, username, vipType) {
    try {
        const user = await client.users.fetch(discordId);

        if (!user) {
            console.log("Usuário não encontrado no Discord");
            return;
        }

        await user.send(
            `🔥 **VIP APROVADO ANGOLA RP**\n\n` +
            `👤 Nome: ${username}\n` +
            `💎 VIP: ${vipType}\n` +
            `🔑 Código: ${code}\n\n` +
            `🎮 Usa este código no jogo com /vipcode`
        );

        console.log("✔ VIP enviado por DM:", discordId);

    } catch (err) {
        console.log("❌ Erro ao enviar DM:", err);
    }
}