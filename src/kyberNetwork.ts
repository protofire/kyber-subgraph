import { log } from "@graphprotocol/graph-ts";
import {
  AddReserveToNetwork,
  AddReserveToNetwork1,
  RemoveReserveFromNetwork,
  KyberNetworkSetEnable,
  ListReservePairs,
  ListReservePairs1
} from "../generated/templates/KyberNetwork/KyberNetwork";
import { Network, Reserve, TradingPair } from "../generated/schema";
import { KyberNetwork, KyberReserve } from "../generated/templates";
import { getToken } from './utils/helpers'
import { ZERO_ADDRESS, ETH_ADDRESS } from "./utils/constants";

export function handleKyberNetworkSetEnable(
  event: KyberNetworkSetEnable
): void {
  let id = event.address.toHexString();
  let network = Network.load(id);
  if (network === null) {
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
  if (reserve === null) {
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
  if (reserve === null) {
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
  if (reserve === null) {
    log.warning("Could not load removed reserve. {}", [id]);
    return;
  }
  reserve.isRemoved = true;
  reserve.save();
}

export function handleListReservePairs(event: ListReservePairs): void {
  let reserve = Reserve.load(event.params.reserve.toHexString());
  if (reserve === null) {
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
  if (tradingPair === null) {
    tradingPair = new TradingPair(id);
  }
  tradingPair.reserve = event.params.reserve.toHexString();
  tradingPair.src = event.params.src.toHexString();
  tradingPair.dest = event.params.dest.toHexString();
  tradingPair.isTradingPairEnabled = event.params.add;
  tradingPair.save();

  getToken(event.params.src);
  getToken(event.params.dest);
}

export function handleListReservePairsV1(event: ListReservePairs1): void {
  let reserve = Reserve.load(event.params.reserve.toHexString());
  if (reserve === null) {
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
  if (tradingPair === null) {
    tradingPair = new TradingPair(id);
  }
  tradingPair.reserve = event.params.reserve.toHexString();
  tradingPair.src = event.params.src.toHexString();
  tradingPair.dest = event.params.dest.toHexString();
  tradingPair.isTradingPairEnabled = event.params.add;
  tradingPair.save();

  getToken(event.params.src);
  getToken(event.params.dest);
}
