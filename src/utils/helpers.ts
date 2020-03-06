import { Address, log } from "@graphprotocol/graph-ts";
import { ExecuteTrade } from "../../generated/KyberNetworkProxy/KyberNetworkProxy";
import { TradeExecute } from "../../generated/templates/KyberReserve/KyberReserve";
import { User, Token } from "../../generated/schema";

export function getIdForExecuteTrade(event: ExecuteTrade): string {
  return event.block.number.toHexString().concat(event.logIndex.toHexString());
}

export function getIdForTradeExecute(event: TradeExecute): string {
  return event.block.number.toHexString().concat(event.logIndex.toHexString());
}

export function getToken(address: Address): string {
  let id = address.toHexString();
  let token = Token.load(id);
  if (token === null) {
    token = new Token(id);
    token.save();
  }
  return token.id;
}

export function getUser(address: Address): string {
  let user = User.load(address.toHexString());
  if (user === null) {
    user = new User(address.toHexString());
    user.save();
  }
  return user.id;
}
