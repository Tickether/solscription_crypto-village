import './App.css';
import cryptoVillageSolscriptionJson from './CryptoVillageSolscription.json';
import { ethers, BigNumber } from "ethers";
import { useState } from 'react';
import usdcJson from './USDC.json';
import Web3Modal from "web3modal";
import axios from 'axios'

const providerOptions = {
  /*
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: "8231230ce0b44ec29c8682c1e47319f9" // required
    }
  },
  coinbasewallet: {
    package: CoinbaseWalletSDK, // required
    options: {
      infuraId: "8231230ce0b44ec29c8682c1e47319f9" // required
    }
  }
  */
};

const cryptoVillageSolscriptionAddress = '0xE0Be388Ab81c47B0f098D2030a1c9Ef190691a8A'; //  Boss Logic ETH MAINNET
const usdcAddress = '0x07865c6E87B9F70255377e024ace6630C1Eaa37F';




function App() {

  const [web3Provider, setWeb3Provider] = useState(null)
  
  const [Address, setAddress] = useState(null)
  const [CryptoVillageSolscriptionContract, setCryptoVillageSolscriptionContract] = useState(null)
  const [CryptoVillageSolscriptionTokenOwned, setCryptoVillageSolscriptionTokenOwned] = useState(null)
  const [subsMonth, setSubsMonth] = useState(1); // 1877 Total AirDrop Amount
  const [UserOf, setUserOf] = useState(null)
  const [UserExpires, setUserExpires] = useState(null)
  

  const connectAccount = async () => { 
    try {
      const web3Modal = new Web3Modal({
        cacheProvider: false, // optional
        providerOptions // required
      });
      const instance = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      console.log(provider)
      const signer = provider.getSigner();
      const address = (await signer.getAddress()).toLowerCase();
      console.log(address)
      if(provider) {
        setWeb3Provider(provider)
      }
      const cryptoVillageSolscriptionURL = await axios.get(
        `https://api-goerli.etherscan.io/api
          ?module=account
          &action=tokennfttx
          &contractaddress=${cryptoVillageSolscriptionAddress}
          &address=${address}
          &page=1&
          offset=100
          &startblock=0
          &endblock=99999999
          &sort=asc
          &apikey=${process.env.ETHERSCAN_KEY}
        `
      )
      console.log(cryptoVillageSolscriptionURL.data)
      if (address === cryptoVillageSolscriptionURL.data.result[0]['to']) {

        setAddress(cryptoVillageSolscriptionURL.data.result[0]['to'])
        
        const cryptoVillageSolscriptionTokenOwned = cryptoVillageSolscriptionURL.data.result[0]['tokenID'];
        console.log(cryptoVillageSolscriptionTokenOwned)
        setCryptoVillageSolscriptionTokenOwned(cryptoVillageSolscriptionTokenOwned)

        const cryptoVillageSolscriptionContract = new ethers.Contract(cryptoVillageSolscriptionAddress, cryptoVillageSolscriptionJson.output.abi, provider);
        setCryptoVillageSolscriptionContract(cryptoVillageSolscriptionContract)

        let userOf = await cryptoVillageSolscriptionContract.ownerOf(cryptoVillageSolscriptionTokenOwned)
        console.log(userOf)
        setUserOf(userOf)

        let userExpires = await cryptoVillageSolscriptionContract.ownerOf(cryptoVillageSolscriptionTokenOwned)
        console.log(userExpires)
        setUserExpires(userExpires)
      }
    } catch (err) {
      
    }
  }

  const handleDecrement = () => {
    if (subsMonth <= 1) return;
    setSubsMonth(subsMonth - 1 );
  };

  const handleIncrement = () => {
      if (subsMonth >= 12 ) return;
      setSubsMonth(subsMonth + 1);
  };

  async function approveERC20Spend() {
    const usdcContract = new ethers.Contract(usdcAddress, usdcJson.output.abi, web3Provider);
    
    try {
      const maxApproval = await CryptoVillageSolscriptionContract.subscriptionFee();
      let res = await usdcContract.allowance(Address, cryptoVillageSolscriptionAddress);
      console.log('res: ', res)
      const allowance = BigNumber.from(res._hex).toNumber()
      if (allowance < maxApproval){
        let response = await usdcContract.approve(cryptoVillageSolscriptionAddress, maxApproval);
        console.log('response: ', response)
        const transactionHash = response['hash']
        const txReceipt = []
        do {
        let txr = await web3Provider.getTransactionReceipt(transactionHash)
        txReceipt[0]=txr
        console.log('confirming...')
        } while (txReceipt[0] == null) ;
        
        console.log(txReceipt[0])
      }
    } 
    catch (err) {
      console.log('error', err )
    }
  }

  async function setSubsERC20() {
    try {
      await approveERC20Spend();
      let response = await CryptoVillageSolscriptionContract.setUserNative(CryptoVillageSolscriptionTokenOwned, Address, subsMonth);
      console.log('response: ', response)
      const transactionHash = response['hash']
      const txReceipt = []
      do {
      let txr = await web3Provider.getTransactionReceipt(transactionHash)
      txReceipt[0]=txr
      console.log('confirming...')
      } while (txReceipt[0] == null) ;
      
      console.log(txReceipt[0])
    } catch (err) {
      
    }
  }

  async function setSubsNative() {
    try {
      let response = await CryptoVillageSolscriptionContract.setUserNative(CryptoVillageSolscriptionTokenOwned, Address, subsMonth);
      console.log('response: ', response)
      const transactionHash = response['hash']
      const txReceipt = []
      do {
      let txr = await web3Provider.getTransactionReceipt(transactionHash)
      txReceipt[0]=txr
      console.log('confirming...')
      } while (txReceipt[0] == null) ;
      
      console.log(txReceipt[0])
    } catch (err) {
      console.log('error', err )
    }
  }

  async function getSubsToken() {
    try {
      let response = await CryptoVillageSolscriptionContract.getSubscriptionToken();
      console.log('response: ', response)
      const transactionHash = response['hash']
      const txReceipt = []
      do {
      let txr = await web3Provider.getTransactionReceipt(transactionHash)
      txReceipt[0]=txr
      console.log('confirming...')
      } while (txReceipt[0] == null) ;
      
      console.log(txReceipt[0])
    } catch (err) {
      console.log('error', err )
    }
  }


  return (
    <div className="App">
      {web3Provider === null ? (

          <div className='connectDiv'>
            <div className='btnDiv'>
              <button onClick={connectAccount}>
                Connect
              </button>
            </div>
          </div>
          
        ) : (

          <div className='connectedDiv'>
            <span className='welcome'> 
              Welcome to Crypto Village Solscription! You're Connected!!!
            </span>

            <div>
              {(Address === null) && (
                <div>
                  <p>Looks like you dont have a membership token. Click the button to get one for free</p>
                  <button onClick={getSubsToken}>Get Membership</button>
                </div>
              )}
            </div>

            <div>
              {(Address != null) && (UserOf.toLowerCase() !== Address) && (
                <div>
                  <p>Your have a membership but either you're not yet activated your subscription or it has Expired. Ps: Check below for fee </p>
                  <div>
                    <button
                      onClick={handleDecrement}>-
                    </button>
                    <input 
                      readOnly
                      type='number' 
                      value={subsMonth}/>
                    <button
                      onClick={handleIncrement}>+
                    </button>
                  </div>
                  <p> 
                  <span>{}</span> You're Ready for subscription!
                  </p>
                  <div>
                    <button onClick={setSubsERC20}>subscribe in dollars</button>
                    <button onClick={setSubsNative}>subscribe in eth</button>
                  </div>
                </div>
              )}
            </div>

            <div>
              {(Address != null) && (UserOf.toLowerCase() === Address) && (
                <div>
                  <p>Congratulations You're Subscribed</p>
                  <p>Your Token {CryptoVillageSolscriptionTokenOwned} expires on {UserExpires}</p>
                </div>
              )}
            </div>
            
            
            
          </div>
        )
      }
    </div>
  );
}

export default App;
