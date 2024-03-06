import { useEffect, useState } from 'react'
import { Lucid } from 'lucid-cardano'
import { WalletConnectedView } from './views/WalletConnectedView';
import { setProtocolParameters } from './util/setProtocolParameters';
import "./App.css"

export interface WalletOption {
  name: string
  api: any
}

function App() {
  const [availableWallets, setAvailableWallets] = useState<WalletOption[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<WalletOption | undefined>(undefined)
  const [isWalletConnecting, setIsWalletConnecting] = useState<boolean>(false)
  const [walletError, setWalletError] = useState<string | undefined>(undefined)
  const [lucid, setLucid] = useState<Lucid | undefined>(undefined)


  useEffect(() => {
    Lucid.new(undefined, "Mainnet")
      .then(lucid => {
        setProtocolParameters(lucid)
        setLucid(lucid)
      })
  }, [])

  useEffect(() => {
    if (!window.cardano) {
      setWalletError("No Cardano wallet found in your browser.")
      return
    }
    
    const wallets = Object.keys(window.cardano)
    .map(key => ({
      name: key,
      api: window.cardano[key],
    } as WalletOption))
    .filter(wallet => !["enable", "isEnabled"].includes(wallet.name));

    if (wallets.length === 0) {
      setWalletError("No wallets found in this browser.")
    } else {
      setAvailableWallets(wallets)
    }
  }, [])

  const connectWallet = async (walletName: string) => {
    setIsWalletConnecting(true)
    setWalletError(undefined)

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
        }
      }

      document.body.style.backgroundImage = 'url("./bwpmeme3.png")'

    } catch (error) {
      setWalletError("Failed to connect to requested wallet. Refresh and try again.")
      console.error(`Error connecting to ${walletName}`, error);
    }

    setIsWalletConnecting(false)
  }

  const noWalletConnectedView = (
    <>
      {availableWallets.map(({ name }) => (
        <div className={"button-container"} key={name}>
          <button
            className='button-primary'
            onClick={() => connectWallet(name)}
          >
            Connect wif {name}
          </button>
        </div>
      ))}
    </>
  )

  const errorConnectingWalletView = (
    <div className='error-container'>
      {walletError}
    </div>
  )

  const whileWalletConnectingView = (
    <div>Waiting for wallet to connect...</div>
  )

  const walletConnectedView = lucid && connectedWallet ? <WalletConnectedView lucid={lucid!} connectedWallet={connectedWallet!}/> : <span></span>

  const isWalletConnected = connectedWallet && connectedWallet.name

  return (
    <div className={isWalletConnected ? 'app-container-logged-in' : 'app-container'}>
      <div className='title-heading fire burn'>bushwifplanes</div>

      <div>
        { walletError ? errorConnectingWalletView : <span></span>}
        { isWalletConnecting ? whileWalletConnectingView : (
          isWalletConnected  ? 
            walletConnectedView : noWalletConnectedView
          )
        }
      </div>
    </div>
  )
}

export default App
