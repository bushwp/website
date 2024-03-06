import {  Data, Lucid, UTxO, fromText, toUnit } from "lucid-cardano"
import { useEffect, useState } from "react"
import { WalletOption } from "../App"
import { BwpExchangeMint } from "../contracts/types"

export type WalletConnectedViewProps = {
    lucid: Lucid,
    connectedWallet: WalletOption
}


const BWP_POLICY = "5dc56fd1ce4335f8be2020f3f836cd11022dfbbf462e198a93e99126"
const BWP_ASSET_NAME = fromText("bushwifplanes")
const BWP_ASSET_ID = `${BWP_POLICY}${BWP_ASSET_NAME}`
const admins = ["ad1b43b5f71f8acbd70fe0cbdfeb39a3257cf9f0a649a3b068959832"]
const tierCosts = [2n, 3n, 4n]
const RFTMintingPolicy = new BwpExchangeMint(BWP_POLICY, BWP_ASSET_NAME, admins, tierCosts)

export function WalletConnectedView(props: WalletConnectedViewProps) {
    const { lucid } = props
    const [bwp, setBwp] = useState<bigint>(0n)
    const [isBwpLoading, setIsBwpLoading] = useState<boolean>(false)
    const [pkh, setPkh] = useState<string>("")
    const [isPkhLoading, setIsPkhLoading] = useState<boolean>(false)
    const [isMintLoading, setIsMintLoading] = useState<boolean>(false)
    const [isMintSubmitted, setIsMintSubmitted] = useState<boolean>(false)
    const [mintError, setMintError] = useState<string | undefined>(undefined)

    const mintRFT = async (lucid: Lucid, tier: number) => {
        setIsMintLoading(true)
        setIsMintSubmitted(false)
        setMintError(undefined)

        try {
            const RFTPolicyScriptHash = lucid.utils.validatorToScriptHash(RFTMintingPolicy)
            const RFTPolicyContractAddress = lucid.utils.validatorToAddress(RFTMintingPolicy)
        
            const RFTAssetName = toUnit(RFTPolicyScriptHash, fromText("BushWifPlanesTier" + tier), 444)
        
            const mintRFTTx = await lucid.newTx()
                .attachSpendingValidator(RFTMintingPolicy)
                .mintAssets({
                    [RFTAssetName]: 1n
                }, Data.to({ "MintBushWifPlanesRFT": [BigInt(tier)] }, BwpExchangeMint.redeemer))
                .payToContract(RFTPolicyContractAddress, {
                    inline: Data.void()
                }, {
                    [BWP_ASSET_ID]: tierCosts[tier - 1]
                })
                .complete()
            
            const signed = await mintRFTTx.sign().complete()
            await signed.submit()
            
            setIsMintSubmitted(true)
            // notify the user it was submitted
        } catch(e) {
            setIsMintSubmitted(false)
            setMintError("Unable to submit transaction. Check your browser console for details.")
            console.log(e)
        } finally {
            setIsMintLoading(false)
        }
    }

    useEffect(() => {
        setIsBwpLoading(true)
        setIsPkhLoading(true)

        lucid.wallet.getUtxos()
            .then((innerUtxos) => {
                const numBwp = innerUtxos.reduce((acc: bigint, cur: UTxO) => {
                    const amount = cur.assets[BWP_ASSET_ID] ? cur.assets[BWP_ASSET_ID] : 0n
                    return acc + amount
                }, 0n)
                setBwp(numBwp)
            })
            .finally(() => {
                setIsBwpLoading(false)
            })
        
        lucid.wallet.address()
            .then((address: string) => {
                setPkh(lucid.utils.getAddressDetails(address).paymentCredential?.hash || "")
            })
            .finally(() => {
                setIsPkhLoading(false)
            })

    }, [lucid])

    const mintErrorView = (<div className='error-container'>{mintError}</div>)

    const defaultView = (
        <div className='tier-select-container'>
            {/*<p>Connected to {connectedWallet?.name || "(Unknown Wallet)"}</p>*/}
            <p className='bwp-display'>You have <span className='bwp-numbers'>{isBwpLoading ? "(Loading...)" : Intl.NumberFormat().format(Number(bwp))}</span> $BWP</p>
            <p>public key hash: {isPkhLoading ? "(Loading...)" : pkh}</p>

            {isMintLoading ? <p>Waiting for transaction signature...</p> : <span></span>}
            {isMintSubmitted && !mintError ? <p>Successfully minted. Another?</p> : <span></span>}

            <div>
                <h2>Tier 1</h2>
                <button
                    disabled={tierCosts[0] > bwp || isMintLoading}
                    className="button-primary"
                    onClick={() => mintRFT(lucid, 1)}
                >Burn {tierCosts[0].toString()} $BWP</button>
            </div>
            <div>
                <h2>Tier 2</h2>
                <button
                    disabled={tierCosts[1] > bwp || isMintLoading}
                    className="button-primary"
                    onClick={() => mintRFT(lucid, 2)}
                >Burn {tierCosts[1].toString()} $BWP</button>
            </div>
            <div>
                <h2>Tier 3</h2>
                <button
                    disabled={tierCosts[2] > bwp || isMintLoading}
                    className="button-primary"
                    onClick={() => mintRFT(lucid, 3)}
                >Burn {tierCosts[2].toString()} $BWP</button>
            </div>
        </div>
    )

    return (
        <div>
            <div>
            {mintError ? mintErrorView : <span></span>}
            {
                defaultView
            }
            </div>
        </div>
    )
}