import { Address, BigInt, Bytes, Value, log } from "@graphprotocol/graph-ts";
import {
  Network,
  Reserve,
  ReserveTokenBalance,
  Token,
  ReserveTrade,
  TradingPair,
  User,
  ReserveTokenBalance,
  Order
} from "../generated/schema";
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
  getIdForTradeExecute
} from "./utils/helpers";
import {
  ZERO_ADDRESS,
  ETH_ADDRESS,
  ORDERBOOK_RESERVE,
  KYBER_RESERVE
} from "./utils/constants";
import { toDecimal } from "./utils/decimals";

// Reserves
export function handleDepositToken(event: DepositToken): void {
  let id = event.address
    .toHexString()
    .concat("-")
    .concat(event.params.token.toHexString());
  let reserveTokenBalance = ReserveTokenBalance.load(id);
  if (reserveTokenBalance == null) {
    reserveTokenBalance = new ReserveTokenBalance(id);
    reserveTokenBalance.amount = BigInt.fromI32(0);
    reserveTokenBalance.reserve = event.address.toHexString();
    reserveTokenBalance.token = event.params.token.toHexString();
  }

  reserveTokenBalance.amount = reserveTokenBalance.amount.plus(
    event.params.amount
  );
  reserveTokenBalance.save();

  getOrCreateToken(event.params.token);
}

export function handleWithdrawFunds(event: WithdrawFunds): void {
  let id = event.address
    .toHexString()
    .concat("-")
    .concat(event.params.token.toHexString());
  let reserveTokenBalance = ReserveTokenBalance.load(id);
  if (reserveTokenBalance == null) {
    log.error("Reserve token balance not found for WithdrawFunds. {}", [id]);
    return;
  }
  reserveTokenBalance.amount = reserveTokenBalance.amount.minus(
    event.params.amount
  );
  if (reserveTokenBalance.amount.lt(BigInt.fromI32(0)))
    log.error("Negative reserve token balance after WithdrawFunds {}", [id]);
  reserveTokenBalance.save();
}

export function handleEtherWithdraw(event: EtherWithdraw): void {
  let id = event.address
    .toHexString()
    .concat("-")
    .concat(ETH_ADDRESS);
  let reserveTokenBalance = ReserveTokenBalance.load(id);
  if (reserveTokenBalance == null) {
    log.error("Reserve token balance not found for EtherWithdraw. {}", [id]);
    return;
  }
  reserveTokenBalance.amount = reserveTokenBalance.amount.minus(
    event.params.amount
  );
  if (reserveTokenBalance.amount.lt(BigInt.fromI32(0)))
    log.error("Negative reserve token balance after EtherWithdraw {}", [id]);
  reserveTokenBalance.save();
}

export function handleTokenWithdraw(event: TokenWithdraw): void {
  let id = event.address
    .toHexString()
    .concat("-")
    .concat(event.params.token.toHexString());
  let reserveTokenBalance = ReserveTokenBalance.load(id);
  if (reserveTokenBalance == null) {
    log.error("Reserve token balance not found for TokenWithdraw. {}", [id]);
    return;
  }
  reserveTokenBalance.amount = reserveTokenBalance.amount.minus(
    event.params.amount
  );
  if (reserveTokenBalance.amount.lt(BigInt.fromI32(0)))
    log.error("Negative reserve token balance after TokenWithdraw {}", [id]);
  reserveTokenBalance.save();
}

export function handleTradeExecuteReserve(event: TradeExecute): void {
  let id = getIdForTradeExecute(event);
  let trade = ReserveTrade.load(id);
  if (trade == null) {
    trade = new ReserveTrade(id);
  }

  let reserve = Reserve.load(event.address.toHexString());
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

  /* Update Reserve Token Balances */

  let src_id = event.address
    .toHexString()
    .concat("-")
    .concat(event.params.src.toHexString());
  let src_reserveTokenBalance = ReserveTokenBalance.load(src_id);
  if (src_reserveTokenBalance == null) {
    src_reserveTokenBalance = new ReserveTokenBalance(src_id);
    src_reserveTokenBalance.amount = BigInt.fromI32(0);
    src_reserveTokenBalance.reserve = event.address.toHexString();
    src_reserveTokenBalance.token = event.params.src.toHexString();
  }

  src_reserveTokenBalance.amount = src_reserveTokenBalance.amount.plus(
    event.params.srcAmount
  );
  src_reserveTokenBalance.save();

  let dest_id = event.address
    .toHexString()
    .concat("-")
    .concat(event.params.destToken.toHexString());
  let dest_reserveTokenBalance = ReserveTokenBalance.load(dest_id);
  if (dest_reserveTokenBalance == null) {
    dest_reserveTokenBalance = new ReserveTokenBalance(dest_id);
    dest_reserveTokenBalance.amount = BigInt.fromI32(0);
    dest_reserveTokenBalance.reserve = event.address.toHexString();
    dest_reserveTokenBalance.token = event.params.destToken.toHexString();
  }

  dest_reserveTokenBalance.amount = dest_reserveTokenBalance.amount.minus(
    event.params.destAmount
  );
  if (dest_reserveTokenBalance.amount.lt(BigInt.fromI32(0)))
    log.error("Negative reserve token balance after trade. {}", [dest_id]);
  dest_reserveTokenBalance.save();
}

export function handleTradeEnabled(event: TradeEnabled): void {
  let id = event.address.toHexString();
  let reserve = Reserve.load(id);
  if (reserve == null) {
    log.error("Could not load reserve with trade enabled. {}", [id]);
    return;
  }
  reserve.isTradeEnabled = event.params.enable;
  reserve.save();
}

export function handleSetContractAddresses(event: SetContractAddresses): void {
  let id = event.address.toHexString();
  let reserve = Reserve.load(id);
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

  let reserve = Reserve.load(event.address.toHexString());
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
  let trade = ReserveTrade.load(id);
  if (trade == null) {
    trade = new ReserveTrade(id);
  }
  let reserve = Reserve.load(event.address.toHexString());
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
