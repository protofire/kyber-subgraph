import { User, Token, Order, FullTrade } from "../../generated/schema";
import { ERC20 } from '../../generated/KyberNetworkProxy/ERC20'
import { Address, EthereumEvent, log } from "@graphprotocol/graph-ts";
import { DEFAULT_DECIMALS } from "./decimals";
import { ZERO_ADDRESS } from "./constants";

export function getIdForTradeExecute(event: EthereumEvent): string {
  return event.block.number.toHexString().concat(event.logIndex.toHexString());
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
  }

  return order as Order;
}

export function getOrCreateToken(
  tokenAddress: Address,
  persist: boolean = true
): Token {
  let addressString = tokenAddress.toHexString();

  let token = Token.load(addressString);

  if (token == null) {
    token = new Token(addressString);

    if (tokenAddress.toHexString() == ZERO_ADDRESS) {
      token.address = null;
      token.decimals = DEFAULT_DECIMALS;
      token.name = "Unknown Asset";
      token.symbol = "";
    } else {
      token.address = tokenAddress;

      let erc20Token = ERC20.bind(tokenAddress);

      let tokenDecimals = erc20Token.try_decimals();
      let tokenName = erc20Token.try_name();
      let tokenSymbol = erc20Token.try_symbol();

      token.decimals = !tokenDecimals.reverted
        ? tokenDecimals.value
        : DEFAULT_DECIMALS;
      token.name = !tokenName.reverted ? tokenName.value : "";
      token.symbol = !tokenSymbol.reverted ? tokenSymbol.value : "";

      // Handle Single-Collateral Dai manually since isn't a detailed token
      if (
        token.address.toHexString() ==
        "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359"
      ) {
        token.decimals = 18;
        token.name = "Sai Stablecoin v1.0";
        token.symbol = "SAI";
      }

      // Handle ETH representation on kyber
      if (
        token.address.toHexString() ==
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ) {
        token.decimals = 18;
        token.name = "Ether";
        token.symbol = "ETH";
      }
    }

    if (persist) {
      token.save();
    }
  }

  return token as Token;
}

export function getOrCreateFullTrade(tradeId: String): FullTrade {
  let trade = FullTrade.load(tradeId);

  if (trade == null) {
    trade = new FullTrade(tradeId);
  }

  return trade as FullTrade;
}
