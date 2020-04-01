import { log } from "@graphprotocol/graph-ts";
import {
  AddReserveToNetwork,
  AddReserveToNetwork1,
  RemoveReserveFromNetwork,
  KyberNetworkSetEnable,
  ListReservePairs,
  ListReservePairs1,
  KyberTrade,
  ExecuteTrade as KyberTradeV1,
  KyberTrade1 as KyberTradeV2
} from "../generated/templates/KyberNetwork/KyberNetwork";
import {
  KyberNetwork,
  MergedKyberReserve as KyberReserve
} from "../generated/templates";
import {
  getOrCreateToken,
  getOrCreateFullTrade,
  getIdForTradeExecute,
  getOrCreateUser,
  checkAndInstantiateInitialNetwork,
  getOrCreateReserve,
  getOrCreateNetwork,
  getOrCreateTradingPair,
  getTradingPairId,
  aggregateVolumeTrackingNetworkData
} from "./utils/helpers";
import {
  ZERO_ADDRESS,
  ETH_ADDRESS,
  INITIAL_NETWORK,
  BIGINT_ONE
} from "./utils/constants";
import { toDecimal } from "./utils/decimals";

export function handleKyberNetworkSetEnable(
  event: KyberNetworkSetEnable
): void {
  let id = event.address.toHexString();
  let network = getOrCreateNetwork(id, false);
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
  let reserve = getOrCreateReserve(id);
  let networkId = event.address.toHexString();
  let network = getOrCreateNetwork(networkId, false);
  reserve.network = networkId;
  reserve.isPermissionless = event.params.isPermissionless;
  reserve.isRemoved = false;
  reserve.isTradeEnabled = true;
  reserve.createdAtBlockNumber = event.block.number;
  reserve.createdAtLogIndex = event.logIndex;
  reserve.createdAtBlockTimestamp = event.block.timestamp;
  reserve.createdAtTransactionHash = event.transaction.hash.toHexString();
  reserve.save();

  if (network != null) {
    network.reservesAmount = network.reservesAmount + BIGINT_ONE;
    if (event.params.isPermissionless) {
      network.permissionlessReservesAmount =
        network.permissionlessReservesAmount + BIGINT_ONE;
    }
    network.save();
  } else {
    log.warning(
      "ADD TO NETWORK NEW. Network with id {} is null on add reserve with id {}",
      [networkId, id]
    );
  }

  KyberReserve.create(event.params.reserve);
}

export function handleAddReserveToNetworkV1(event: AddReserveToNetwork1): void {
  // Do not continue if reserve was not added successfully
  if (event.params.add == false) return;

  if (event.address.toHexString() == INITIAL_NETWORK) {
    checkAndInstantiateInitialNetwork();
  }

  let id = event.params.reserve.toHexString();
  let reserve = getOrCreateReserve(id);
  let networkId = event.address.toHexString();
  let network = getOrCreateNetwork(networkId, false);
  reserve.network = networkId;
  reserve.isPermissionless = false;
  reserve.isRemoved = false;
  reserve.isTradeEnabled = true;
  reserve.createdAtBlockNumber = event.block.number;
  reserve.createdAtLogIndex = event.logIndex;
  reserve.createdAtBlockTimestamp = event.block.timestamp;
  reserve.createdAtTransactionHash = event.transaction.hash.toHexString();
  reserve.save();

  if (network != null) {
    network.reservesAmount = network.reservesAmount + BIGINT_ONE;
    network.save();
  } else {
    log.warning(
      "ADD TO NETWORK V1. Network with id {} is null on add reserve with id {}",
      [networkId, id]
    );
  }

  KyberReserve.create(event.params.reserve);
}

export function handleRemoveReserveFromNetwork(
  event: RemoveReserveFromNetwork
): void {
  let networkId = event.address.toHexString();
  let id = event.params.reserve.toHexString();
  let reserve = getOrCreateReserve(id, false);
  let network = getOrCreateNetwork(networkId, false);
  if (reserve == null) {
    log.warning("Could not load removed reserve. {}", [id]);
    return;
  } else {
    reserve.isRemoved = true;
    reserve.save();
    if (network == null) {
      log.warning("Could not load network. {}", [networkId]);
    } else {
      network.reservesAmount = network.reservesAmount - BIGINT_ONE;
      if (reserve.isPermissionless) {
        network.permissionlessReservesAmount =
          network.permissionlessReservesAmount - BIGINT_ONE;
      }
      network.save();
    }
  }
}

export function handleListReservePairs(event: ListReservePairs): void {
  let reserve = getOrCreateReserve(event.params.reserve.toHexString(), false);
  if (reserve == null) {
    log.warning("Could not load reserve for trading pair. {}", [
      event.params.reserve.toHexString()
    ]);
    // return;
  }

  let id = getTradingPairId(
    event.params.reserve.toHexString(),
    event.params.src.toHexString(),
    event.params.dest.toHexString()
  );
  let tradingPair = getOrCreateTradingPair(id);
  tradingPair.reserve = event.params.reserve.toHexString();
  tradingPair.src = event.params.src.toHexString();
  tradingPair.dest = event.params.dest.toHexString();
  tradingPair.isTradingPairEnabled = event.params.add;
  tradingPair.save();

  getOrCreateToken(event.params.src);
  getOrCreateToken(event.params.dest);
}

export function handleListReservePairsV1(event: ListReservePairs1): void {
  let reserve = getOrCreateReserve(event.params.reserve.toHexString(), false);
  if (reserve == null) {
    log.warning("Could not load reserve for trading pair. {}", [
      event.params.reserve.toHexString()
    ]);
    // return
  }

  let id = getTradingPairId(
    event.params.reserve.toHexString(),
    event.params.src.toHexString(),
    event.params.dest.toHexString()
  );
  let tradingPair = getOrCreateTradingPair(id);
  tradingPair.reserve = event.params.reserve.toHexString();
  tradingPair.src = event.params.src.toHexString();
  tradingPair.dest = event.params.dest.toHexString();
  tradingPair.isTradingPairEnabled = event.params.add;
  tradingPair.save();

  getOrCreateToken(event.params.src);
  getOrCreateToken(event.params.dest);
}

export function handleKyberTradeV1(event: KyberTradeV1): void {
  let id = getIdForTradeExecute(event);
  let trade = getOrCreateFullTrade(id);
  let user = getOrCreateUser(event.params.sender);
  let srcToken = getOrCreateToken(event.params.src);
  let destToken = getOrCreateToken(event.params.dest);

  aggregateVolumeTrackingNetworkData(
    event.address.toHexString(),
    srcToken,
    destToken,
    event.params.actualSrcAmount,
    event.params.actualDestAmount
  );

  trade.trader = user.id;
  trade.src = event.params.src.toHexString();
  trade.dest = event.params.dest.toHexString();
  trade.rawSrcAmount = event.params.actualSrcAmount;
  trade.rawDestAmount = event.params.actualDestAmount;
  trade.actualSrcAmount = toDecimal(
    event.params.actualSrcAmount,
    srcToken.decimals
  );
  trade.actualDestAmount = toDecimal(
    event.params.actualDestAmount,
    destToken.decimals
  );

  trade.createdAtBlockTimestamp = event.block.timestamp;
  trade.createdAtBlockNumber = event.block.number;
  trade.createdAtLogIndex = event.logIndex;
  trade.createdAtTransactionHash = event.transaction.hash.toHexString();
  trade.save();

  let networkId = event.address.toHexString();
  let network = getOrCreateNetwork(networkId, false);
  if (network != null) {
    network.tradesAmount = network.tradesAmount + BIGINT_ONE;
    network.save();
  }
}

export function handleKyberTradeV2(event: KyberTradeV2): void {
  let id = getIdForTradeExecute(event);
  let trade = getOrCreateFullTrade(id);
  let user = getOrCreateUser(event.params.srcAddress);
  let srcToken = getOrCreateToken(event.params.srcToken);
  let destToken = getOrCreateToken(event.params.destToken);

  aggregateVolumeTrackingNetworkData(
    event.address.toHexString(),
    srcToken,
    destToken,
    event.params.srcAmount,
    event.params.destAmount
  );

  trade.trader = user.id;
  trade.src = event.params.srcToken.toHexString();
  trade.dest = event.params.destToken.toHexString();
  trade.rawSrcAmount = event.params.srcAmount;
  trade.rawDestAmount = event.params.destAmount;
  trade.actualSrcAmount = toDecimal(event.params.srcAmount, srcToken.decimals);
  trade.actualDestAmount = toDecimal(
    event.params.destAmount,
    destToken.decimals
  );

  trade.createdAtBlockTimestamp = event.block.timestamp;
  trade.createdAtBlockNumber = event.block.number;
  trade.createdAtLogIndex = event.logIndex;
  trade.createdAtTransactionHash = event.transaction.hash.toHexString();
  trade.save();

  let networkId = event.address.toHexString();
  let network = getOrCreateNetwork(networkId, false);
  if (network != null) {
    network.tradesAmount = network.tradesAmount + BIGINT_ONE;
    network.save();
  }
}

export function handleKyberTrade(event: KyberTrade): void {
  let id = getIdForTradeExecute(event);
  let trade = getOrCreateFullTrade(id);
  let user = getOrCreateUser(event.params.trader);
  let srcToken = getOrCreateToken(event.params.src);
  let destToken = getOrCreateToken(event.params.dest);

  aggregateVolumeTrackingNetworkData(
    event.address.toHexString(),
    srcToken,
    destToken,
    event.params.srcAmount,
    event.params.dstAmount
  );

  trade.trader = user.id;
  trade.src = event.params.src.toHexString();
  trade.dest = event.params.dest.toHexString();
  trade.rawSrcAmount = event.params.srcAmount;
  trade.rawDestAmount = event.params.dstAmount;
  trade.actualSrcAmount = toDecimal(event.params.srcAmount, srcToken.decimals);
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

  let networkId = event.address.toHexString();
  let network = getOrCreateNetwork(networkId, false);
  if (network != null) {
    network.tradesAmount = network.tradesAmount + BIGINT_ONE;
    network.save();
  }
}
