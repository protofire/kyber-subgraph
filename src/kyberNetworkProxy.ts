import { Address, BigInt, Bytes, Value, log } from "@graphprotocol/graph-ts";
import {
  ExecuteTrade,
  KyberNetworkSet,
  TokenWithdraw,
  KyberNetworkProxy
} from "../generated/KyberNetworkProxy/KyberNetworkProxy";
import {
  KyberNetwork,
  MergedKyberReserve as KyberReserve
} from "../generated/templates";
import {
  getIdForTradeExecute,
  getOrCreateUser,
  getOrCreateNetwork
} from "./utils/helpers";
import { ZERO_ADDRESS, ETH_ADDRESS, INITIAL_NETWORK } from "./utils/constants";

export function handleKyberNetworkSet(event: KyberNetworkSet): void {
  let new_id = event.params.newNetworkContract.toHexString();
  let new_network = getOrCreateNetwork(new_id);
  new_network.proxy = event.address.toHexString();
  new_network.isCurrentNetwork = true;
  new_network.isEnabled = false;
  new_network.save();

  KyberNetwork.create(event.params.newNetworkContract);

  let old_id = event.params.oldNetworkContract.toHexString();

  let old_network = getOrCreateNetwork(old_id, false);
  if (old_network == null) {
    log.warning(
      "Old network not already initialized, assuming v1 network with address: {}, actual address received: {}",
      [INITIAL_NETWORK, old_id]
    );

    if (old_id == ZERO_ADDRESS || old_id == INITIAL_NETWORK) {
      let initial_network = getOrCreateNetwork(INITIAL_NETWORK);
      initial_network.isCurrentNetwork = false;
      initial_network.isEnabled = false;
      initial_network.save();
    }

    return;
  }
  old_network.isCurrentNetwork = false;
  old_network.save();
}
