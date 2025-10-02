import { createBot } from "mineflayer";
import mcProtocol from 'minecraft-protocol';
import express from "express";
import 'dotenv/config';
// === CONFIGURATION ===
const { ping } = mcProtocol;

const SERVER_HOST = process.env.SERVER_HOST!;
const SERVER_PORT = parseInt(process.env.SERVER_PORT!);
const BOT_USERNAME = process.env.BOT_USERNAME!;
const BOT_LIFETIME = 1 * 60 * 1000; 

// === MINI WEB SERVER (optional UptimeRobot)
const app = express();
app.get("/", (_, res) => res.send("Bot is alive!"));
app.listen(3000, () => console.log("Web server is running"));

let bot: ReturnType<typeof createBot> | null = null;

// === CHECK IF SERVER IS EMPTY ===
function isServerEmpty(callback: (empty: boolean) => void) {
  ping({ host: SERVER_HOST, port: SERVER_PORT }, (err, result) => {
    if (err) {
      console.log(`[${new Date().toISOString()}] Server is unreachable.`);
      callback(false);
    } else {
        if ('players' in result) {
            const onlinePlayers = result.players.online;
            console.log(
              `[${new Date().toISOString()}] Server has ${onlinePlayers} player(s) online`
            );
            callback(onlinePlayers === 0);
          } else {
            console.log(`[${new Date().toISOString()}] Unexpected ping result format.`);
            callback(false);
          }
    }
  });
}

// === SPAWN BOT FUNCTION ===
function spawnBot() {
  console.log(`[${new Date().toISOString()}] Spawning bot...`);

  bot = createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: BOT_USERNAME,
    version: "1.21.8",
    keepAlive: true, // Keeps connection stable
    plugins: {
      digging: () => {}, // disable digging plugin
    },
    viewDistance: "tiny",
  });

  bot.on("spawn", () => {
    console.log(`[${new Date().toISOString()}] Bot joined the server!`);

    // Optional: Make the bot invisible, frozen, and invincible
    bot?.chat("/effect give @s minecraft:invisibility 999999 1 true");
bot?.chat("/effect give @s minecraft:resistance 999999 255 true");
bot?.chat("/effect give @s minecraft:slowness 999999 255 true");
bot?.chat("/effect give @s minecraft:mining_fatigue 999999 255 true");

    // Disconnect after BOT_LIFETIME
    setTimeout(() => {
      if (bot) {
        console.log(
          `[${new Date().toISOString()}] Time's up. Disconnecting bot.`
        );
        try {
          bot.quit();
        } catch (err) {
          console.error("Error during bot.quit():", err);
        } finally {
          process.exit(0);
        }
      }
    }, BOT_LIFETIME);
  });

  bot.on("end", () => {
    console.log(`[${new Date().toISOString()}] Bot disconnected.`);
    bot = null;
    process.exit(0);
  });

  bot.on("error", (err) => {
    console.error(`[${new Date().toISOString()}] Bot error: ${err.message}`);
    process.exit(1);
  });

  bot.on("kicked", (reason) => {
    console.warn(`[${new Date().toISOString()}] Bot was kicked: ${reason}`);
    process.exit(1);
  });
}

// === MAIN CHECK FUNCTION ===
function checkAndMaybeSpawnBot() {
  console.log(`[${new Date().toISOString()}] Checking server status...`);
  isServerEmpty((empty) => {
    if (empty) {
      console.log(
        `[${new Date().toISOString()}] Server is empty. Attempting to spawn bot...`
      );
      spawnBot();
    } else {
      console.log(
        `[${new Date().toISOString()}] Server not empty. Bot will not join.`
      );
      process.exit(0);
    }
  });
}

// === START SCRIPT ===
checkAndMaybeSpawnBot();
