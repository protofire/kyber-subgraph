import {
  User,
  Token,
  Order,
  FullTrade,
  Network,
  Reserve,
  ReserveTrade,
  TradingPair,
  TotalTradeVolume,
  ReserveTradeVolume,
  NetworkTradeVolume
} from "../../generated/schema";
import { ERC20 } from "../../generated/KyberNetworkProxy/ERC20";
import { Address, EthereumEvent, BigInt, log } from "@graphprotocol/graph-ts";
import { DEFAULT_DECIMALS, toDecimal } from "./decimals";
import {
  ZERO_ADDRESS,
  ETH_ADDRESS,
  INITIAL_NETWORK,
  BIGINT_ZERO,
  BIGDECIMAL_ZERO,
  SAI_ADDRESS,
  MKR_ADDRESS
} from "./constants";

export function getIdForTradeExecute(event: EthereumEvent): string {
  return event.block.number
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toHexString());
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
    token.address = tokenAddress;

    if (addressString == ZERO_ADDRESS) {
      token.address = null;
      token.decimals = DEFAULT_DECIMALS;
      token.name = "Unknown Asset";
      token.symbol = "";
    } else if (addressString == SAI_ADDRESS) {
      token.decimals = 18;
      token.name = "Sai Stablecoin v1.0";
      token.symbol = "SAI";
    } else if (addressString == MKR_ADDRESS) {
      token.decimals = 18;
      token.name = "Maker Token";
      token.symbol = "MKR";
    } else if (addressString == ETH_ADDRESS) {
      token.decimals = 18;
      token.name = "Ether";
      token.symbol = "ETH";
    } else {
      let erc20Token = ERC20.bind(tokenAddress);

      let tokenDecimals = erc20Token.try_decimals();
      let tokenName = erc20Token.try_name();
      let tokenSymbol = erc20Token.try_symbol();

      token.decimals = !tokenDecimals.reverted
        ? tokenDecimals.value
        : DEFAULT_DECIMALS;
      token.name = !tokenName.reverted ? tokenName.value : "";
      token.symbol = !tokenSymbol.reverted ? tokenSymbol.value : "";
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

export function getOrCreateReserveTrade(tradeId: String): ReserveTrade {
  let trade = ReserveTrade.load(tradeId);

  if (trade == null) {
    trade = new ReserveTrade(tradeId);
  }

  return trade as ReserveTrade;
}

export function checkAndInstantiateInitialNetwork(): void {
  let network = Network.load(INITIAL_NETWORK);

  if (network == null) {
    network = getOrCreateNetwork(INITIAL_NETWORK);
    network.isCurrentNetwork = true;
    network.isEnabled = false;
    network.save();
  }
}

export function getOrCreateReserve(
  id: String,
  createIfNotFound: boolean = true
): Reserve {
  let reserve = Reserve.load(id);

  if (reserve == null && createIfNotFound) {
    reserve = new Reserve(id);
    reserve.tradesAmount = BIGINT_ZERO;
  }

  return reserve as Reserve;
}

export function getOrCreateNetwork(
  id: String,
  createIfNotFound: boolean = true
): Network {
  let network = Network.load(id);

  if (network == null && createIfNotFound) {
    network = new Network(id);
    network.reservesAmount = BIGINT_ZERO;
    network.tradesAmount = BIGINT_ZERO;
    network.permissionlessReservesAmount = BIGINT_ZERO;
    network.isCurrentNetwork = false;
    network.isEnabled = false;
  }

  return network as Network;
}

export function getOrCreateTradingPair(
  id: String,
  createIfNotFound: boolean = true
): TradingPair {
  let tradingPair = TradingPair.load(id);

  if (tradingPair == null && createIfNotFound) {
    tradingPair = new TradingPair(id);
  }

  return tradingPair as TradingPair;
}

function getOrCreateReserveTradeVolume(id: String): ReserveTradeVolume {
  let tradeVolume = ReserveTradeVolume.load(id);

  if (tradeVolume == null) {
    tradeVolume = new ReserveTradeVolume(id);
    tradeVolume.rawTotalVolume = BIGINT_ZERO;
    tradeVolume.rawAmountSold = BIGINT_ZERO;
    tradeVolume.rawAmountBought = BIGINT_ZERO;
    tradeVolume.actualTotalVolume = BIGDECIMAL_ZERO;
    tradeVolume.actualAmountSold = BIGDECIMAL_ZERO;
    tradeVolume.actualAmountBought = BIGDECIMAL_ZERO;
  }

  return tradeVolume as ReserveTradeVolume;
}

function getOrCreateNetworkTradeVolume(id: String): NetworkTradeVolume {
  let tradeVolume = NetworkTradeVolume.load(id);

  if (tradeVolume == null) {
    tradeVolume = new NetworkTradeVolume(id);
    tradeVolume.rawTotalVolume = BIGINT_ZERO;
    tradeVolume.rawAmountSold = BIGINT_ZERO;
    tradeVolume.rawAmountBought = BIGINT_ZERO;
    tradeVolume.actualTotalVolume = BIGDECIMAL_ZERO;
    tradeVolume.actualAmountSold = BIGDECIMAL_ZERO;
    tradeVolume.actualAmountBought = BIGDECIMAL_ZERO;
  }

  return tradeVolume as NetworkTradeVolume;
}

function getOrCreateTotalTradeVolume(id: String): TotalTradeVolume {
  let tradeVolume = TotalTradeVolume.load(id);

  if (tradeVolume == null) {
    tradeVolume = new TotalTradeVolume(id);
    tradeVolume.rawTotalVolume = BIGINT_ZERO;
    tradeVolume.rawAmountSold = BIGINT_ZERO;
    tradeVolume.rawAmountBought = BIGINT_ZERO;
    tradeVolume.actualTotalVolume = BIGDECIMAL_ZERO;
    tradeVolume.actualAmountSold = BIGDECIMAL_ZERO;
    tradeVolume.actualAmountBought = BIGDECIMAL_ZERO;
  }

  return tradeVolume as TotalTradeVolume;
}

function getTradeVolumeId(prefix: String, tokenAddress: String): String {
  let id = prefix.concat("-").concat(tokenAddress);
  return id;
}

export function getTradingPairId(
  reserveAddress: String,
  srcAddress: String,
  destAddress: String
): String {
  let id = reserveAddress
    .concat("-")
    .concat(srcAddress)
    .concat("-")
    .concat(destAddress);
  return id;
}

export function aggregateVolumeTrackingReserveData(
  reserveId: String,
  srcToken: Token,
  destToken: Token,
  srcAmount: BigInt,
  destAmount: BigInt
): void {
  let srcTradeVolumeId = getTradeVolumeId(reserveId, srcToken.id);
  let destTradeVolumeId = getTradeVolumeId(reserveId, destToken.id);
  let srcTradeVolume = getOrCreateReserveTradeVolume(srcTradeVolumeId);
  let destTradeVolume = getOrCreateReserveTradeVolume(destTradeVolumeId);

  let actualSrcAmount = toDecimal(srcAmount, srcToken.decimals);
  let actualDestAmount = toDecimal(destAmount, destToken.decimals);

  srcTradeVolume.reserve = reserveId;
  destTradeVolume.reserve = reserveId;
  srcTradeVolume.token = srcToken.id;
  destTradeVolume.token = destToken.id;

  srcTradeVolume.rawTotalVolume = srcTradeVolume.rawTotalVolume + srcAmount;
  srcTradeVolume.rawAmountSold = srcTradeVolume.rawAmountSold + srcAmount;
  srcTradeVolume.actualTotalVolume =
    srcTradeVolume.actualTotalVolume + actualSrcAmount;
  srcTradeVolume.actualAmountSold =
    srcTradeVolume.actualAmountSold + actualSrcAmount;

  destTradeVolume.rawTotalVolume = destTradeVolume.rawTotalVolume + destAmount;
  destTradeVolume.rawAmountBought =
    destTradeVolume.rawAmountBought + destAmount;
  destTradeVolume.actualTotalVolume =
    destTradeVolume.actualTotalVolume + actualDestAmount;
  destTradeVolume.actualAmountBought =
    destTradeVolume.actualAmountBought + actualDestAmount;

  srcTradeVolume.save();
  destTradeVolume.save();
}

export function aggregateVolumeTrackingNetworkData(
  networkId: String,
  srcToken: Token,
  destToken: Token,
  srcAmount: BigInt,
  destAmount: BigInt
): void {
  let srcNetworkTradeVolumeId = getTradeVolumeId(networkId, srcToken.id);
  let destNetworkTradeVolumeId = getTradeVolumeId(networkId, destToken.id);

  let srcNetworkTradeVolume = getOrCreateNetworkTradeVolume(
    srcNetworkTradeVolumeId
  );
  let destNetworkTradeVolume = getOrCreateNetworkTradeVolume(
    destNetworkTradeVolumeId
  );
  let srcTotalTradeVolume = getOrCreateTotalTradeVolume(srcToken.id);
  let destTotalTradeVolume = getOrCreateTotalTradeVolume(destToken.id);

  srcNetworkTradeVolume.network = networkId;
  destNetworkTradeVolume.network = networkId;

  srcNetworkTradeVolume.token = srcToken.id;
  destNetworkTradeVolume.token = destToken.id;
  srcTotalTradeVolume.token = srcToken.id;
  destTotalTradeVolume.token = destToken.id;

  let actualSrcAmount = toDecimal(srcAmount, srcToken.decimals);
  let actualDestAmount = toDecimal(destAmount, destToken.decimals);

  srcTotalTradeVolume.rawTotalVolume =
    srcTotalTradeVolume.rawTotalVolume + srcAmount;
  srcTotalTradeVolume.rawAmountSold =
    srcTotalTradeVolume.rawAmountSold + srcAmount;
  srcTotalTradeVolume.actualTotalVolume =
    srcTotalTradeVolume.actualTotalVolume + actualSrcAmount;
  srcTotalTradeVolume.actualAmountSold =
    srcTotalTradeVolume.actualAmountSold + actualSrcAmount;

  destTotalTradeVolume.rawTotalVolume =
    destTotalTradeVolume.rawTotalVolume + destAmount;
  destTotalTradeVolume.rawAmountBought =
    destTotalTradeVolume.rawAmountBought + destAmount;
  destTotalTradeVolume.actualTotalVolume =
    destTotalTradeVolume.actualTotalVolume + actualDestAmount;
  destTotalTradeVolume.actualAmountBought =
    destTotalTradeVolume.actualAmountBought + actualDestAmount;

  srcNetworkTradeVolume.rawTotalVolume =
    srcNetworkTradeVolume.rawTotalVolume + srcAmount;
  srcNetworkTradeVolume.rawAmountSold =
    srcNetworkTradeVolume.rawAmountSold + srcAmount;
  srcNetworkTradeVolume.actualTotalVolume =
    srcNetworkTradeVolume.actualTotalVolume + actualSrcAmount;
  srcNetworkTradeVolume.actualAmountSold =
    srcNetworkTradeVolume.actualAmountSold + actualSrcAmount;

  destNetworkTradeVolume.rawTotalVolume =
    destNetworkTradeVolume.rawTotalVolume + destAmount;
  destNetworkTradeVolume.rawAmountBought =
    destNetworkTradeVolume.rawAmountBought + destAmount;
  destNetworkTradeVolume.actualTotalVolume =
    destNetworkTradeVolume.actualTotalVolume + actualDestAmount;
  destNetworkTradeVolume.actualAmountBought =
    destNetworkTradeVolume.actualAmountBought + actualDestAmount;

  srcTotalTradeVolume.save();
  destTotalTradeVolume.save();
  srcNetworkTradeVolume.save();
  destNetworkTradeVolume.save();
}
