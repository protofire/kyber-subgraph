import { Address, BigInt, Bytes, Value, log } from "@graphprotocol/graph-ts";
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
import {
  DepositToken,
  EtherWithdraw,
  SetContractAddresses,
  TokenWithdraw,
  TradeEnabled,
  TradeExecute,
  WithdrawFunds
} from "../generated/templates/KyberReserve/KyberReserve";
import { getIdForTradeExecute, getOrCrateToken } from "./utils/helpers";
import { ZERO_ADDRESS, ETH_ADDRESS } from "./utils/constants";

export function handleDepositToken(event: DepositToken): void {
  let id = event.address
    .toHexString()
    .concat("-")
    .concat(event.params.token.toHexString());
  let reserveTokenBalance = ReserveTokenBalance.load(id);
  if (reserveTokenBalance == null) {
    log.debug("handleDepositToken-{}", [id]);
    reserveTokenBalance = new ReserveTokenBalance(id);
    reserveTokenBalance.amount = BigInt.fromI32(0);
    reserveTokenBalance.reserve = event.address.toHexString();
    reserveTokenBalance.token = event.params.token.toHexString();
  }

  reserveTokenBalance.amount = reserveTokenBalance.amount.plus(
    event.params.amount
  );
  reserveTokenBalance.save();

  getOrCrateToken(event.params.token);
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
  // trade.trader = getUser(event.params.)
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
  // if (id == "0x63825c174ab367968ec60f061753d3bbd36a0d8f") {
  //   // Manually handling for reserve 0x63825c174ab367968ec60f061753d3bbd36a0d8f
  //   log.debug("Manually creating reserve 0x63825c174ab367968ec60f061753d3bbd36a0d8f.", [])
  //   KyberReserve.create(Address.fromString('0x63825c174ab367968ec60f061753d3bbd36a0d8f'));
  //   reserve = new Reserve(id)
  //   reserve.isPermissionless = false
  //   reserve.isRemoved = false
  //   reserve.isTradeEnabled = true
  //   reserve.createdAtBlockNumber = event.block.number
  //   reserve.createdAtLogIndex = event.logIndex
  //   reserve.createdAtBlockTimestamp = event.block.timestamp
  //   reserve.createdAtTransactionHash = event.transaction.hash.toHexString()
  //   KyberReserve.create(event.address)
  // }
  // else {
  //   log.error("Could not load reserve with handleSetContractAddresses. {}", [id])
  //   return
  // }
  // }
  reserve.network = event.params.network.toHexString();
  reserve.rateContract = event.params.rate.toHexString();
  reserve.sanityContract = event.params.sanity.toHexString();
  reserve.save();
}
