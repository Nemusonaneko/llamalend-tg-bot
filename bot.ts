import { Bot } from "grammy";
import express from "express";
import { ethers } from "ethers";
import { execute } from "./utils/sql";
import * as dotenv from "dotenv";
import { CronJob } from "cron";
import { NotifyUsers } from "./utils/NotifyUsers";
import { getLoans } from "./utils/GetLoans";
dotenv.config();

const bot = new Bot(process.env.TG_BOT_TOKEN || "no token");
const app = express();

console.log("Loading commands...");
bot.command("start", (ctx) =>
  ctx.reply("LlamaBankmanFried is ready to take your jpegs!")
);
bot.command("hello", async (ctx) => await ctx.reply("Hello!"));
bot.command("register", async (ctx) => {
  try {
    const id = (await ctx.getAuthor()).user.id;
    const address = ctx.match;
    if (address && ethers.utils.isAddress(address)) {
      await execute("INSERT INTO `telegram` VALUES (?, ?, ?)", [
        Date.now() / 1e3,
        id,
        address?.toLowerCase(),
      ]);
      await ctx.reply(`Added: ${address}`);
    } else {
      await ctx.reply(`Invalid address ${address}`);
    }
  } catch (err: any) {
    console.log(err);
    await ctx.reply(`Failed: ${err}`);
  }
});
bot.command("remove", async (ctx) => {
  try {
    const id = (await ctx.getAuthor()).user.id;
    const address = ctx.match;
    await execute("DELETE FROM `telegram` WHERE ID = (?) AND ADDRESS = (?)", [
      id,
      address?.toLowerCase(),
    ]);
    await ctx.reply(`Removed: ${address}`);
  } catch (err: any) {
    console.log(err);
    await ctx.reply(`Failed: ${err}`);
  }
});
bot.command("list", async (ctx) => {
  try {
    const id = (await ctx.getAuthor()).user.id;
    const addresses = await execute(
      `SELECT ADDRESS FROM telegram WHERE ID =?;`,
      [id]
    );
    let message = ``;
    (addresses[0] as any[]).map((address) => {
      message += `${address.ADDRESS}\n`;
    });
    if (message.length === 0) {
      message = "No addresses";
    }
    await ctx.reply(`${message}`);
  } catch (err: any) {
    console.log(err);
    await ctx.reply(`Failed: ${err}`);
  }
});
bot.command("loans", async (ctx) => {
  try {
    const id = (await ctx.getAuthor()).user.id;
    const now = Math.round(Date.now() / 1e3);
    const addressQuery = await execute(
      `SELECT ADDRESS FROM discord WHERE ID =?;`,
      [id]
    );
    const addresses: string[] = [];
    (addressQuery[0] as any[]).map((address) => {
      addresses.push(address.ADDRESS);
    });
    let message = "";
    for (let i = 0; i < addresses.length; i++) {
      const loans = await getLoans(addresses[i]);
      for (let j = 0; j < loans.length; j++) {
        const loan = loans[i];
        message += `${loan.pool.name} loan for NFT ID ${
          loan.nftId
        } will expire in ${((Number(loan.deadline) - now) / 86400).toFixed(
          2
        )} days\n`;
      }
    }
    message += "Go to https://llamalend.com/repay to repay your loans.";
    await ctx.reply(`${message}`);
  } catch (err: any) {
    console.log(err);
    await ctx.reply(`Failed: ${err}`);
  }
});
console.log("Commands loaded!");

console.log("Loading cron jobs");
const hourlyJob = new CronJob("0 * * * *", async function () {
  await NotifyUsers(bot, true);
});
const dailyJob = new CronJob("0 0 * * *", async function () {
  await NotifyUsers(bot, false);
});
hourlyJob.start();
dailyJob.start();
console.log("Cron jobs added!");

console.log("Starting bot...");
bot.start();
app.listen(process.env.PORT, () =>
  console.log(`Server started on port ${process.env.PORT}!`)
);
console.log("READY");
