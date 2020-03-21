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
  ReserveTrade,
  TradingPair,
  User
} from "../generated/schema";
import {
  KyberNetwork,
  MergedKyberReserve as KyberReserve
} from "../generated/templates";
import { getIdForTradeExecute, getOrCreateUser } from "./utils/helpers";
import { ZERO_ADDRESS, ETH_ADDRESS, INITIAL_NETWORK } from "./utils/constants";

export function handleKyberNetworkSet(event: KyberNetworkSet): void {
  let new_id = event.params.newNetworkContract.toHexString();
  log.warning("handleKyberNetworkSet, {}", [new_id]);
  let new_network = new Network(new_id);
  new_network.proxy = event.address.toHexString();
  new_network.isCurrentNetwork = true;
  new_network.isEnabled = false;
  new_network.save();

  KyberNetwork.create(event.params.newNetworkContract);

  let old_id = event.params.oldNetworkContract.toHexString();

  let old_network = Network.load(old_id);
  if (old_network == null) {
    log.warning(
      "Old network not already initialized, assuming v1 network with address: {}, actual address received: {}",
      [INITIAL_NETWORK, old_id]
    );

    if (old_id == ZERO_ADDRESS || old_id == INITIAL_NETWORK) {
      let initial_network = Network.load(INITIAL_NETWORK);
      if (initial_network == null) {
        initial_network = new Network(INITIAL_NETWORK);
        initial_network.isCurrentNetwork = false;
        initial_network.isEnabled = false;
        initial_network.save();
      }
    }

    return;
  }
  old_network.isCurrentNetwork = false;
  old_network.save();
}
//
// export function handleExecuteTradeProxy(event: ExecuteTrade): void {
//   let id = getIdForTradeExecute(event);
//   let trade = ProxyTrade.load(id);
//   if (trade == null) {
//     trade = new ProxyTrade(id);
//   }
//   let user = getOrCreateUser(event.params.trader);
//   let srcToken = getOrCreateToken(event.params.src);
//   let destToken = getOrCreateToken(event.params.dest);
//
//   trade.trader = user.id;
//   trade.src = event.params.src.toHexString();
//   trade.dest = event.params.dest.toHexString();
//   trade.rawSrcAmount = event.params.actualSrcAmount;
//   trade.rawDestAmount = event.params.actualDestAmount;
//   trade.actualSrcAmount = toDecimal(
//     event.params.actualSrcAmount,
//     srcToken.decimals
//   );
//   trade.actualDestAmount = toDecimal(
//     event.params.actualDestAmount,
//     destToken.decimals
//   );
//   trade.createdAtBlockTimestamp = event.block.timestamp;
//   trade.createdAtBlockNumber = event.block.number;
//   trade.createdAtLogIndex = event.logIndex;
//   trade.createdAtTransactionHash = event.transaction.hash.toHexString();
//   trade.save();
// }
