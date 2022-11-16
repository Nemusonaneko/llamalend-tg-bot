"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifyUsers = void 0;
const sql_1 = require("./sql");
const node_fetch_1 = __importDefault(require("node-fetch"));
const NotifyUsers = (bot, lastHour) => __awaiter(void 0, void 0, void 0, function* () {
    const now = Math.round(Date.now() / 1e3);
    const start = now;
    const end = lastHour ? now + 3600 * 1.5 : now + 25 * 3600;
    const loans = yield getLoansInDeadline(start, end);
    yield Promise.all(loans.map((loan) => __awaiter(void 0, void 0, void 0, function* () {
        const ids = yield (0, sql_1.execute)(`SELECT ADDRESS, ID FROM telegram WHERE address =?;`, [loan.owner.toLowerCase()]);
        yield Promise.all(ids[0].map((id) => {
            const message = `\n${lastHour
                ? "LlamaLend: 1hr till liquidation"
                : "LlamaLend: 24 hours till liquidation"}\nYour loan on LlamaLend in pool ${loan.pool.name} for NFT ${loan.nftId} will be liquidated in ${((Number(loan.deadline) - now) /
                60).toFixed(2)} minutes \nGo to https://llamalend.com/repay to repay the loan.`;
            bot.api.sendMessage(id.ID, message);
        }));
    })));
});
exports.NotifyUsers = NotifyUsers;
function getLoansInDeadline(start, end) {
    return __awaiter(this, void 0, void 0, function* () {
        const loanData = yield (0, node_fetch_1.default)("https://api.thegraph.com/subgraphs/name/0xngmi/llamalend", {
            method: "POST",
            body: JSON.stringify({
                query: `query getloan($start: BigInt, $end: BigInt){
      loans(where: {
          deadline_gte: $start,
          deadline_lte: $end,
      }){
          id
          owner
          nftId
          deadline
          pool{
              name
          }
      }
  }`,
                variables: {
                    start,
                    end,
                },
            }),
        }).then((r) => r.json());
        return loanData.data.loans.filter((loan) => loan.owner !== "0x0000000000000000000000000000000000000000");
    });
}
