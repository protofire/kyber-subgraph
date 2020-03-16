import { log } from "@graphprotocol/graph-ts";
import {
  OrderbookReserve,
  ReserveTokenBalance,
  Order,
  OrderbookTrade,
} from "../generated/schema";
import {
  TokenDeposited,
  EtherDeposited,
  NewLimitOrder,
  OrderUpdated,
  OrderCanceled,
  FullOrderTaken,
  PartialOrderTaken,
  OrderbookReserveTrade
} from "../generated/templates/OrderbookReserve/OrderbookReserve";
import { getOrCreateOrder, getIdForTradeExecute } from "./utils/helpers";
import { ZERO_ADDRESS, ETH_ADDRESS } from "./utils/constants";

export function handleNewLimitOrder(event: NewLimitOrder): void {
  let orderId = event.address.toHexString().concat('-').concat(event.params.orderId.toString())
  let order = getOrCreateOrder(orderId, event.address.toHexString())
  order.creator = event.params.maker
  order.srcAmount = event.params.srcAmount
  order.destAmount = event.params.dstAmount
  order.isEthToToken = event.params.isEthToToken
  order.save()
}

export function handleOrderbookTrade(event: OrderbookReserveTrade): void {
  let id = getIdForTradeExecute(event);
  let trade = OrderbookTrade.load(id);
  if (trade == null) {
    trade = new OrderbookTrade(id);
  }

  trade.src = event.params.srcToken.toHexString();
  trade.dest = event.params.dstToken.toHexString();
  trade.srcAmount = event.params.srcAmount;
  trade.destAmount = event.params.dstAmount;
  trade.reserve = event.address.toHexString();
  trade.createdAtBlockTimestamp = event.block.timestamp;
  trade.createdAtBlockNumber = event.block.number;
  trade.createdAtLogIndex = event.logIndex;
  trade.createdAtTransactionHash = event.transaction.hash.toHexString();
  trade.save();
}

export function handlePartialOrderTaken(event: PartialOrderTaken): void {
  let orderId = event.address.toHexString().concat('-').concat(event.params.orderId.toString())
  let order = getOrCreateOrder(orderId, event.address.toHexString())

  order.isRemoved = event.params.isRemoved;
  order.save()

  //probably check with function call the src and dest amounts remaining if not removed
}

export function handleFullOrderTaken(event: FullOrderTaken): void {
  let orderId = event.address.toHexString().concat('-').concat(event.params.orderId.toString())
  let order = getOrCreateOrder(orderId, event.address.toHexString())

  order.isRemoved = true;
  order.save()
}

export function handleOrderUpdated(event: OrderUpdated): void {
  let orderId = event.address.toHexString().concat('-').concat(event.params.orderId.toString())
  let order = getOrCreateOrder(orderId, event.address.toHexString())

  order.creator = event.params.maker
  order.srcAmount = event.params.srcAmount
  order.destAmount = event.params.dstAmount
  order.isEthToToken = event.params.isEthToToken
  order.save()
}

export function handleOrderCanceled(event: OrderCanceled): void {
  let orderId = event.address.toHexString().concat('-').concat(event.params.orderId.toString())
  let order = getOrCreateOrder(orderId, event.address.toHexString())

  order.isCancelled = true;
  order.save()
}

export function handleTokenDeposited(event: TokenDeposited): void {
  log.warning("TokenDeposited Orderbook", []);
}

export function handleEtherDeposited(event: EtherDeposited): void {
  log.warning("EtherDeposited Orderbook", []);
}
