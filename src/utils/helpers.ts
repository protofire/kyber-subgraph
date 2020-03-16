import { User, Token, Order } from "../../generated/schema";
import { Address, EthereumEvent, log } from "@graphprotocol/graph-ts";

export function getIdForExecuteTrade(event: EthereumEvent): string {
  return event.block.number.toHexString().concat(event.logIndex.toHexString());
}

export function getIdForTradeExecute(event: EthereumEvent): string {
  return event.block.number.toHexString().concat(event.logIndex.toHexString());
}

export function getOrCrateToken(address: Address): Token {
  let id = address.toHexString();
  let token = Token.load(id);

  if (token == null) {
    token = new Token(id);
    token.save();
  }

  return token as Token;
}

export function getOrCreateUser(address: Address): User {
  let user = User.load(address.toHexString());

  if (user == null) {
    user = new User(address.toHexString());
    user.save();
  }

  return user as User;
}

export function getOrCreateOrder(orderId: String, reserveId: String): Order {
  let order = Order.load(orderId);

  if (order == null) {
    order = new Order(orderId);
    order.isCancelled = false;
    order.isRemoved = false;
    order.reserve = reserveId;
    order.save();
  }

  return order as Order;
}
