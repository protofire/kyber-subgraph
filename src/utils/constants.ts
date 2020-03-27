import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'


export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const INITIAL_NETWORK = "0x964f35fae36d75b1e72770e244f6595b68508cf5";
export const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export const MKR_ADDRESS = "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2";
export const SAI_ADDRESS = "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359";
export const KYBER_RESERVE = "KYBER_RESERVE";
export const ORDERBOOK_RESERVE = "ORDERBOOK_RESERVE";
export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGINT_ONE = BigInt.fromI32(1);
export let BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
