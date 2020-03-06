import { Address, BigInt, Bytes, Value, log } from "@graphprotocol/graph-ts";
import {
  ExecuteTrade,
  KyberNetworkSet,
  TokenWithdraw,
  KyberNetworkProxy
} from "../generated/KyberNetworkProxy/KyberNetworkProxy";
import {
  Network,
  Reserve,
  ReserveTokenBalance,
  Token,
  ProxyTrade,
  ReserveTrade,
  TradingPair,
  User
} from "../generated/schema";
import { KyberNetwork, KyberReserve } from "../generated/templates";
import { getIdForExecuteTrade, getUser } from "./utils/helpers";
import { ZERO_ADDRESS, ETH_ADDRESS } from "./utils/constants";

export function handleKyberNetworkSet(event: KyberNetworkSet): void {
  let new_id = event.params.newNetworkContract.toHexString();
  let new_network = new Network(new_id);
  new_network.proxy = event.address.toHexString();
  new_network.isCurrentNetwork = true;
  new_network.isEnabled = false;
  new_network.save();

  KyberNetwork.create(event.params.newNetworkContract);

  let old_id = event.params.oldNetworkContract.toHexString();

  let old_network = Network.load(old_id);
  if (old_network === null) {
    // Ignore initial setup case for old network
    if (old_id == ZERO_ADDRESS) return;

    log.error("Could not load network {}", [old_id]);
    return;
  }
  old_network.isCurrentNetwork = false;
  old_network.save();
}

export function handleExecuteTradeProxy(event: ExecuteTrade): void {
  let id = getIdForExecuteTrade(event);
  let trade = ProxyTrade.load(id);
  if (trade === null) {
    trade = new ProxyTrade(id);
  }
  trade.trader = getUser(event.params.trader);
  trade.src = event.params.src.toHexString();
  trade.dest = event.params.dest.toHexString();
  trade.actualSrcAmount = event.params.actualSrcAmount;
  trade.actualDestAmount = event.params.actualDestAmount;
  trade.createdAtBlockTimestamp = event.block.timestamp;
  trade.createdAtBlockNumber = event.block.number;
  trade.createdAtLogIndex = event.logIndex;
  trade.createdAtTransactionHash = event.transaction.hash.toHexString();
  trade.save();
}
