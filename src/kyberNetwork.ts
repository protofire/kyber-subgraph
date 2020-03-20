import { log } from "@graphprotocol/graph-ts";
import {
  AddReserveToNetwork,
  AddReserveToNetwork1,
  RemoveReserveFromNetwork,
  KyberNetworkSetEnable,
  ListReservePairs,
  ListReservePairs1,
  KyberTrade
} from "../generated/templates/KyberNetwork/KyberNetwork";
import { Network, Reserve, TradingPair, FullTrade } from "../generated/schema";
import {
  KyberNetwork,
  MergedKyberReserve as KyberReserve
} from "../generated/templates";
import {
  getOrCreateToken,
  getOrCreateFullTrade,
  getIdForTradeExecute,
  getOrCreateUser
} from "./utils/helpers";
import { ZERO_ADDRESS, ETH_ADDRESS } from "./utils/constants";
import { toDecimal } from "./utils/decimals";

export function handleKyberNetworkSetEnable(
  event: KyberNetworkSetEnable
): void {
  let id = event.address.toHexString();
  let network = Network.load(id);
  if (network == null) {
    log.error("Could not load network {}", [id]);
  }
  network.isEnabled = event.params.isEnabled;
  network.save();
}

export function handleAddReserveToNetwork(event: AddReserveToNetwork): void {
  // Do not continue if reserve was not added successfully
  if (event.params.add == false) return;

  let id = event.params.reserve.toHexString();
  let reserve = Reserve.load(id);
  if (reserve == null) {
    reserve = new Reserve(id);
    reserve.network = event.address.toHexString();
    reserve.isPermissionless = event.params.isPermissionless;
    reserve.isRemoved = false;
    reserve.isTradeEnabled = true;
    reserve.createdAtBlockNumber = event.block.number;
    reserve.createdAtLogIndex = event.logIndex;
    reserve.createdAtBlockTimestamp = event.block.timestamp;
    reserve.createdAtTransactionHash = event.transaction.hash.toHexString();
    reserve.save();

    KyberReserve.create(event.params.reserve);
  }
}

export function handleAddReserveToNetworkV1(event: AddReserveToNetwork1): void {
  // Do not continue if reserve was not added successfully
  if (event.params.add == false) return;

  let id = event.params.reserve.toHexString();
  let reserve = Reserve.load(id);
  if (reserve == null) {
    reserve = new Reserve(id);
    reserve.network = event.address.toHexString();
    reserve.isPermissionless = false;
    reserve.isRemoved = false;
    reserve.isTradeEnabled = true;
    reserve.createdAtBlockNumber = event.block.number;
    reserve.createdAtLogIndex = event.logIndex;
    reserve.createdAtBlockTimestamp = event.block.timestamp;
    reserve.createdAtTransactionHash = event.transaction.hash.toHexString();
    reserve.save();

    KyberReserve.create(event.params.reserve);
  }
}

export function handleRemoveReserveFromNetwork(
  event: RemoveReserveFromNetwork
): void {
  let id = event.params.reserve.toHexString();
  let reserve = Reserve.load(id);
  if (reserve == null) {
    log.warning("Could not load removed reserve. {}", [id]);
    return;
  } else {
    reserve.isRemoved = true;
    reserve.save();
  }
}

export function handleListReservePairs(event: ListReservePairs): void {
  let reserve = Reserve.load(event.params.reserve.toHexString());
  if (reserve == null) {
    log.warning("Could not load reserve for trading pair. {}", [
      event.params.reserve.toHexString()
    ]);
    // return;
  }

  let id = event.params.reserve
    .toHexString()
    .concat("-")
    .concat(event.params.src.toHexString())
    .concat("-")
    .concat(event.params.dest.toHexString());
  let tradingPair = TradingPair.load(id);
  if (tradingPair == null) {
    tradingPair = new TradingPair(id);
  }
  tradingPair.reserve = event.params.reserve.toHexString();
  tradingPair.src = event.params.src.toHexString();
  tradingPair.dest = event.params.dest.toHexString();
  tradingPair.isTradingPairEnabled = event.params.add;
  tradingPair.save();

  getOrCreateToken(event.params.src);
  getOrCreateToken(event.params.dest);
}

export function handleListReservePairsV1(event: ListReservePairs1): void {
  let reserve = Reserve.load(event.params.reserve.toHexString());
  if (reserve == null) {
    log.warning("Could not load reserve for trading pair. {}", [
      event.params.reserve.toHexString()
    ]);
    // return
  }

  let id = event.params.reserve
    .toHexString()
    .concat("-")
    .concat(event.params.src.toHexString())
    .concat("-")
    .concat(event.params.dest.toHexString());
  let tradingPair = TradingPair.load(id);
  if (tradingPair == null) {
    tradingPair = new TradingPair(id);
  }
  tradingPair.reserve = event.params.reserve.toHexString();
  tradingPair.src = event.params.src.toHexString();
  tradingPair.dest = event.params.dest.toHexString();
  tradingPair.isTradingPairEnabled = event.params.add;
  tradingPair.save();

  getOrCreateToken(event.params.src);
  getOrCreateToken(event.params.dest);
}

export function handleKyberTrade(event: KyberTrade): void {
  let id = getIdForTradeExecute(event);
  let trade = getOrCreateFullTrade(id);
  let user = getOrCreateUser(event.params.trader);
  let srcToken = getOrCreateToken(event.params.src);
  let destToken = getOrCreateToken(event.params.dest);

  trade.trader = user.id;
  trade.src = event.params.src.toHexString();
  trade.dest = event.params.dest.toHexString();
  trade.rawSrcAmount = event.params.srcAmount;
  trade.rawDestAmount = event.params.dstAmount;
  trade.actualSrcAmount = toDecimal(
    event.params.srcAmount,
    srcToken.decimals
  );
  trade.actualDestAmount = toDecimal(
    event.params.dstAmount,
    destToken.decimals
  );
  trade.reserveSrcToEth = event.params.reserve1.toHexString();
  trade.reserveEthToDest = event.params.reserve2.toHexString();
  trade.ethWeiValue = event.params.ethWeiValue;
  trade.createdAtBlockTimestamp = event.block.timestamp;
  trade.createdAtBlockNumber = event.block.number;
  trade.createdAtLogIndex = event.logIndex;
  trade.createdAtTransactionHash = event.transaction.hash.toHexString();
  trade.save();
}
