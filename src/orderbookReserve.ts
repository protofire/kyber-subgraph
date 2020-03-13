import { Address, BigInt, Bytes, Value, log } from "@graphprotocol/graph-ts";
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
import { getOrCreateOrder } from "./utils/helpers";
import { ZERO_ADDRESS, ETH_ADDRESS } from "./utils/constants";

export function handleNewLimitOrder(event: NewLimitOrder) {
  let orderId = event.address.concat('-').concat(event.params.orderId.toString())
  let order = getOrCreateOrder(orderId, event.address)
  order.creator = event.params.maker
  order.srcAmount = event.params.srcAmount
  order.destAmount = event.params.destAmount
  order.isEthToToken = event.params.isEthToToken
  order.save()
}

export function handleOrderbookTrade(event: OrderbookReserveTrade) {
  let id = getIdForTradeExecute(event);
  let trade = OrderbookTrade.load(id);
  if (trade == null) {
    trade = new OrderbookTrade(id);
  }

  trade.src = event.params.src.toHexString();
  trade.dest = event.params.destToken.toHexString();
  trade.srcAmount = event.params.srcAmount;
  trade.destAmount = event.params.destAmount;
  trade.reserve = event.address.toHexString();
  trade.createdAtBlockTimestamp = event.block.timestamp;
  trade.createdAtBlockNumber = event.block.number;
  trade.createdAtLogIndex = event.logIndex;
  trade.createdAtTransactionHash = event.transaction.hash.toHexString();
  trade.save();
}

export function handlePartialOrderTaken(event: PartialOrderTaken) {
  let orderId = event.address.concat('-').concat(event.params.orderId.toString())
  let order = getOrCreateOrder(orderId, event.address)

  order.isRemoved = event.params.isRemoved;
  order.save()

  //probably check with function call the src and dest amounts remaining if not removed
}

export function handleFullOrderTaken(event: FullOrderTaken) {
  let orderId = event.address.concat('-').concat(event.params.orderId.toString())
  let order = getOrCreateOrder(orderId, event.address)

  order.isRemoved = true;
  order.save()
}

export function handleOrderUpdated(event: OrderUpdated) {
  let orderId = event.address.concat('-').concat(event.params.orderId.toString())
  let order = getOrCreateOrder(orderId, event.address)

  order.creator = event.params.maker
  order.srcAmount = event.params.srcAmount
  order.destAmount = event.params.destAmount
  order.isEthToToken = event.params.isEthToToken
  order.save()
}

export function handleOrderCanceled(event: OrderCanceled) {
  let orderId = event.address.concat('-').concat(event.params.orderId.toString())
  let order = getOrCreateOrder(orderId, event.address)

  order.isCancelled = true;
  order.save()
}

export function handleTokenDeposited(event: TokenDeposited) {
  log.warning("TokenDeposited Orderbook", []);
}

export function handleEtherDeposited(event: EtherDeposited) {
  log.warning("EtherDeposited Orderbook", []);
}
