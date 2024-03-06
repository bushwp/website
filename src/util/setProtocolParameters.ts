import { C, Lucid, ProtocolParameters, SLOT_CONFIG_NETWORK, createCostModels } from "lucid-cardano"
import pp from "../assets/protocol-parameters.json"

export function setProtocolParameters(lucid: Lucid) {
    const protocolParameters = pp as unknown as ProtocolParameters
    const slotConfig = SLOT_CONFIG_NETWORK["Mainnet"]

    lucid.txBuilderConfig = C.TransactionBuilderConfigBuilder.new()
        .coins_per_utxo_byte(
            C.BigNum.from_str(protocolParameters.coinsPerUtxoByte.toString()),
        )
        .fee_algo(
            C.LinearFee.new(
                C.BigNum.from_str(protocolParameters.minFeeA.toString()),
                C.BigNum.from_str(protocolParameters.minFeeB.toString()),
            ),
        )
        .key_deposit(
            C.BigNum.from_str(protocolParameters.keyDeposit.toString()),
        )
        .pool_deposit(
            C.BigNum.from_str(protocolParameters.poolDeposit.toString()),
        )
        .max_tx_size(protocolParameters.maxTxSize)
        .max_value_size(protocolParameters.maxValSize)
        .collateral_percentage(protocolParameters.collateralPercentage)
        .max_collateral_inputs(protocolParameters.maxCollateralInputs)
        .max_tx_ex_units(
            C.ExUnits.new(
                C.BigNum.from_str(protocolParameters.maxTxExMem.toString()),
                C.BigNum.from_str(protocolParameters.maxTxExSteps.toString()),
            ),
        )
        .ex_unit_prices(
            C.ExUnitPrices.from_float(
                protocolParameters.priceMem,
                protocolParameters.priceStep,
            ),
        )
        .slot_config(
            C.BigNum.from_str(slotConfig.zeroTime.toString()),
            C.BigNum.from_str(slotConfig.zeroSlot.toString()),
            slotConfig.slotLength,
        )
        .costmdls(createCostModels(protocolParameters.costModels))
        .build();
}