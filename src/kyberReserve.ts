import { Address, BigInt, Bytes, Value, log } from "@graphprotocol/graph-ts";
import {
  DepositToken,
  EtherWithdraw,
  SetContractAddresses,
  TokenWithdraw,
  TradeEnabled,
  TradeExecute,
  WithdrawFunds,
  TokenDeposited,
  EtherDeposited,
  NewLimitOrder,
  OrderUpdated,
  OrderCanceled,
  FullOrderTaken,
  PartialOrderTaken,
  OrderbookReserveTrade
} from "../generated/templates/MergedKyberReserve/MergedKyberReserve";
import {
  getIdForTradeExecute,
  getOrCreateToken,
  getOrCreateOrder,
  getIdForTradeExecute,
  getOrCreateReserveTrade,
  getOrCreateReserve,
  getOrCreateTradingPair,
  aggregateVolumeTrackingReserveData
} from "./utils/helpers";
import {
  ZERO_ADDRESS,
  ETH_ADDRESS,
  ORDERBOOK_RESERVE,
  KYBER_RESERVE
} from "./utils/constants";
import { toDecimal } from "./utils/decimals";

// Reserves
export function handleTradeExecuteReserve(event: TradeExecute): void {
  let id = getIdForTradeExecute(event);
  let trade = getOrCreateReserveTrade(id);

  let reserve = getOrCreateReserve(event.address.toHexString(), false);
  if (reserve == null) {
    log.warning("Reserve is null for address: {}", [
      event.address.toHexString()
    ]);
  }

  if (reserve.type == null) {
    reserve.type = KYBER_RESERVE;
    reserve.save();
  }

  let srcToken = getOrCreateToken(event.params.src);
  let destToken = getOrCreateToken(event.params.destToken);

  aggregateVolumeTrackingReserveData(
    event.address.toHexString(),
    srcToken,
    destToken,
    event.params.srcAmount,
    event.params.destAmount
  );

  trade.src = event.params.src.toHexString();
  trade.dest = event.params.destToken.toHexString();
  trade.rawSrcAmount = event.params.srcAmount;
  trade.rawDestAmount = event.params.destAmount;
  trade.actualSrcAmount = toDecimal(event.params.srcAmount, srcToken.decimals);
  trade.actualDestAmount = toDecimal(
    event.params.destAmount,
    destToken.decimals
  );
  trade.reserve = event.address.toHexString();
  trade.createdAtBlockTimestamp = event.block.timestamp;
  trade.createdAtBlockNumber = event.block.number;
  trade.createdAtLogIndex = event.logIndex;
  trade.createdAtTransactionHash = event.transaction.hash.toHexString();
  trade.save();
}

export function handleTradeEnabled(event: TradeEnabled): void {
  let id = event.address.toHexString();
  let reserve = getOrCreateReserve(id, false);
  if (reserve == null) {
    log.error("Could not load reserve with trade enabled. {}", [id]);
    return;
  }
  reserve.isTradeEnabled = event.params.enable;
  reserve.save();
}

export function handleSetContractAddresses(event: SetContractAddresses): void {
  let id = event.address.toHexString();
  let reserve = getOrCreateReserve(id, false);
  if (reserve == null) {
    log.error("Could not load reserve with handleSetContractAddresses. {}", [
      id
    ]);

    return;
  }
  reserve.network = event.params.network.toHexString();
  reserve.rateContract = event.params.rate.toHexString();
  reserve.sanityContract = event.params.sanity.toHexString();
  if (reserve.type == null) {
    reserve.type = KYBER_RESERVE;
  }
  reserve.save();
}

// Orderbooks

export function handleNewLimitOrder(event: NewLimitOrder): void {
  let orderId = event.address
    .toHexString()
    .concat("-")
    .concat(event.params.orderId.toString());
  let order = getOrCreateOrder(orderId, event.address.toHexString());

  let reserve = getOrCreateReserve(event.address.toHexString(), false);
  if (reserve == null) {
    log.warning("Reserve is null for address: {}", [
      event.address.toHexString()
    ]);
  }

  if (reserve.type == null) {
    reserve.type = ORDERBOOK_RESERVE;
    reserve.save();
  }

  order.creator = event.params.maker.toHexString();
  order.srcAmount = event.params.srcAmount;
  order.destAmount = event.params.dstAmount;
  order.isEthToToken = event.params.isEthToToken;
  order.createdAtBlockTimestamp = event.block.timestamp;
  order.createdAtBlockNumber = event.block.number;
  order.createdAtLogIndex = event.logIndex;
  order.createdAtTransactionHash = event.transaction.hash.toHexString();
  order.save();
}

export function handleOrderbookTrade(event: OrderbookReserveTrade): void {
  let id = getIdForTradeExecute(event);
  let trade = getOrCreateReserveTrade(id);
  let reserve = getOrCreateReserve(event.address.toHexString(), false);
  if (reserve == null) {
    log.warning("Reserve is null for address: {}", [
      event.address.toHexString()
    ]);
  }

  if (reserve.type == null) {
    reserve.type = ORDERBOOK_RESERVE;
    reserve.save();
  }

  let srcToken = getOrCreateToken(event.params.srcToken);
  let destToken = getOrCreateToken(event.params.dstToken);

  aggregateVolumeTrackingReserveData(
    event.address.toHexString(),
    srcToken,
    destToken,
    event.params.srcAmount,
    event.params.dstAmount
  );

  trade.src = event.params.srcToken.toHexString();
  trade.dest = event.params.dstToken.toHexString();
  trade.rawSrcAmount = event.params.srcAmount;
  trade.rawDestAmount = event.params.dstAmount;
  trade.actualSrcAmount = toDecimal(event.params.srcAmount, srcToken.decimals);
  trade.actualDestAmount = toDecimal(
    event.params.dstAmount,
    destToken.decimals
  );
  trade.reserve = event.address.toHexString();
  trade.createdAtBlockTimestamp = event.block.timestamp;
  trade.createdAtBlockNumber = event.block.number;
  trade.createdAtLogIndex = event.logIndex;
  trade.createdAtTransactionHash = event.transaction.hash.toHexString();
  trade.save();
}

export function handlePartialOrderTaken(event: PartialOrderTaken): void {
  let orderId = event.address
    .toHexString()
    .concat("-")
    .concat(event.params.orderId.toString());
  let order = getOrCreateOrder(orderId, event.address.toHexString());

  order.isRemoved = event.params.isRemoved;
  order.save();
}

export function handleFullOrderTaken(event: FullOrderTaken): void {
  let orderId = event.address
    .toHexString()
    .concat("-")
    .concat(event.params.orderId.toString());
  let order = getOrCreateOrder(orderId, event.address.toHexString());

  order.isRemoved = true;
  order.save();
}

export function handleOrderUpdated(event: OrderUpdated): void {
  let orderId = event.address
    .toHexString()
    .concat("-")
    .concat(event.params.orderId.toString());
  let order = getOrCreateOrder(orderId, event.address.toHexString());

  order.creator = event.params.maker.toHexString();
  order.srcAmount = event.params.srcAmount;
  order.destAmount = event.params.dstAmount;
  order.isEthToToken = event.params.isEthToToken;
  order.save();
}

export function handleOrderCanceled(event: OrderCanceled): void {
  let orderId = event.address
    .toHexString()
    .concat("-")
    .concat(event.params.orderId.toString());
  let order = getOrCreateOrder(orderId, event.address.toHexString());

  order.isCancelled = true;
  order.save();
}
