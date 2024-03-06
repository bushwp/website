import { useEffect, useState } from 'react'
import { Lucid, UTxO } from 'lucid-cardano'

interface WalletOption {
  name: string
  api: any
}
const BWP_ASSET_ID = "5dc56fd1ce4335f8be2020f3f836cd11022dfbbf462e198a93e9912662757368776966706c616e6573"

function App() {
  const [availableWallets, setAvailableWallets] = useState<WalletOption[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<WalletOption | undefined>(undefined);
  const [lucid, setLucid] = useState<Lucid | undefined>(undefined)
  const [bwp, setBwp] = useState<bigint>(0n)

  useEffect(() => {
    Lucid.new(undefined, "Mainnet")
      .then(setLucid)
  }, [])

  useEffect(() => {
    const wallets = Object.keys(window.cardano)
    .map(key => ({
      name: key,
      api: window.cardano[key],
    } as WalletOption))
    .filter(wallet => !["enable", "isEnabled"].includes(wallet.name));
    setAvailableWallets(wallets);
  }, []);

  const connectWallet = async (walletName: string) => {
    try {
      const wallet = window.cardano[walletName];
      if (wallet) {
        const enabledWalletAPI = await wallet.enable();
        setConnectedWallet({
          name: walletName,
          api: enabledWalletAPI
        });

        if (lucid) {
          lucid.selectWallet(enabledWalletAPI)
          const utxos = await lucid.wallet.getUtxos()
          const numBwp = utxos.reduce((acc: bigint, cur: UTxO) => {
            const amount = cur.assets[BWP_ASSET_ID] ? cur.assets[BWP_ASSET_ID] : 0n
            return acc + amount
          }, 0n)

          setBwp(numBwp)
          console.log(numBwp)
        }
      }

    } catch (error) {
      console.error(`Error connecting to ${walletName}`, error);
    }
  }

  return (
    <>
      <div>bushwifplanes website</div>



      <div>
        {connectedWallet && connectedWallet.name ? (
          <div>
            <p>Connected to {connectedWallet.name}</p>
            <p>You have {Intl.NumberFormat().format(Number(bwp))} bwp</p>
          </div>
        ) : (
          <div>
            {availableWallets.map(({ name }) => (
              <button
                key={name}
                onClick={() => connectWallet(name)}
              >
                Connect to {name}
              </button>
            ))}
          </div>
        )}


      </div>
    </>
  )
}

export default App
