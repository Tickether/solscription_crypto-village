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

const cryptoVillageSolscriptionAddress = '0x611Ea02425A83Ab6018e7149166ECf2E48D8F0CA'; //  Boss Logic ETH MAINNET
const usdcAddress = '0x07865c6E87B9F70255377e024ace6630C1Eaa37F';




function App() {

  const [web3Provider, setWeb3Provider] = useState(null)
  
  const [Address, setAddress] = useState(null)
  const [CryptoVillageSolscriptionContract, setCryptoVillageSolscriptionContract] = useState()
  const [CryptoVillageSolscriptionTokenOwned, setCryptoVillageSolscriptionTokenOwned] = useState(null)
  const [subsMonth, setSubsMonth] = useState(1); // 1877 Total AirDrop Amount
  const [UserOf, setUserOf] = useState(0x0000000000000000000000000000000000000000)
  const [UserExpires, setUserExpires] = useState()
  const [SubsPrice, setSubsPrice] = useState(null)
  const [SubsPriceNative, setSubsPriceNative] = useState(null)
  const [MaxMonthlySubs, setMaxMonthlySubs] = useState(null)
  const [txnURL, setTxnURL] = useState(null)
  

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
        `https://api-goerli.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${cryptoVillageSolscriptionAddress}&address=${address}&page=1&offset=100&startblock=0&endblock=99999999&sort=asc&apikey=H33B3XXI34JTD48FXA47IHP8B9SCRYDZXP`
      )
      console.log(cryptoVillageSolscriptionURL.data)

      const cryptoVillageSolscriptionContract = new ethers.Contract(cryptoVillageSolscriptionAddress, cryptoVillageSolscriptionJson.abi, signer);
      console.log(cryptoVillageSolscriptionContract)
      setCryptoVillageSolscriptionContract(cryptoVillageSolscriptionContract)

      // get prices erc20 and set
      let subsPrice = await cryptoVillageSolscriptionContract.subscriptionFee()
      if (subsPrice['_hex'] === "0x00") {
        subsPrice = parseInt(subsPrice['_hex'],16)
        console.log(subsPrice)
        setSubsPrice(subsPrice)
      } else {
        subsPrice = ethers.utils.formatEther(subsPriceNative)
        console.log(subsPrice)
        setSubsPrice(subsPrice)
      }
      
      // get prices native and set
      let subsPriceNative = await cryptoVillageSolscriptionContract.subscriptionFeeNative()
      subsPriceNative = ethers.utils.formatEther(subsPriceNative)
      console.log(subsPriceNative)
      setSubsPriceNative(subsPriceNative)

      //get max monthly and set
      let maxMonthlySubs = await cryptoVillageSolscriptionContract.maxMonthlySubs()
      console.log(parseInt(maxMonthlySubs['_hex'],16))
      setMaxMonthlySubs(parseInt(maxMonthlySubs['_hex'],16))

      if (address === cryptoVillageSolscriptionURL.data.result[0]['to']) {

        setAddress(cryptoVillageSolscriptionURL.data.result[0]['to'])
        
        const cryptoVillageSolscriptionTokenOwned = cryptoVillageSolscriptionURL.data.result[0]['tokenID'];
        console.log(cryptoVillageSolscriptionTokenOwned)
        setCryptoVillageSolscriptionTokenOwned(cryptoVillageSolscriptionTokenOwned)

        let userOf = await cryptoVillageSolscriptionContract.userOf(cryptoVillageSolscriptionTokenOwned)
        console.log(userOf)
        setUserOf(userOf.toLowerCase())

        let userExpires = await cryptoVillageSolscriptionContract.userExpires(cryptoVillageSolscriptionTokenOwned)
        if (userExpires['_hex'] === "0x0fee50b7025c36a0802f236d04753d5b48e7ffffffffffffff") {
          console.log(userExpires)
          setUserExpires(null)
        } else {
          userExpires = parseInt(userExpires['_hex'],16)
          
          userExpires = new Date(userExpires * 1000);
          console.log(userExpires.toUTCString())
          setUserExpires(userExpires.toUTCString())
        }
        
      }
    } catch (err) {
      
    }
  }

  const handleDecrement = () => {
    if (subsMonth <= 1) return;
    setSubsMonth(subsMonth - 1 );
  };

  const handleIncrement = () => {
      if (subsMonth >= MaxMonthlySubs ) return;
      setSubsMonth(subsMonth + 1);
  };


// tweaks and test due
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
// tweaks and test due
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

      let userOf = await CryptoVillageSolscriptionContract.userOf(CryptoVillageSolscriptionTokenOwned)
      console.log(userOf)
      setUserOf(userOf.toLowerCase())

      let userExpires = await CryptoVillageSolscriptionContract.userExpires(CryptoVillageSolscriptionTokenOwned)
      userExpires = parseInt(userExpires['_hex'],16)    
      userExpires = new Date(userExpires * 1000);
      console.log(userExpires.toUTCString())
      setUserExpires(userExpires.toUTCString())
      
      console.log(txReceipt[0])
    } catch (err) {
      
    }
  }

  async function setSubsNative() {
    try {
      let response = await CryptoVillageSolscriptionContract.setUserNative(CryptoVillageSolscriptionTokenOwned, Address, subsMonth, {value: ethers.utils.parseEther((SubsPriceNative * subsMonth).toString())});
      console.log('response: ', response)
      const transactionHash = response['hash']
      const txReceipt = []
      do {
      let txr = await web3Provider.getTransactionReceipt(transactionHash)
      txReceipt[0]=txr
      console.log('confirming...')
      } while (txReceipt[0] == null) ;
      
      let userOf = await CryptoVillageSolscriptionContract.userOf(CryptoVillageSolscriptionTokenOwned)
      console.log(userOf)
      setUserOf(userOf.toLowerCase())

      let userExpires = await CryptoVillageSolscriptionContract.userExpires(CryptoVillageSolscriptionTokenOwned)
      userExpires = parseInt(userExpires['_hex'],16)    
      userExpires = new Date(userExpires * 1000);
      console.log(userExpires.toUTCString())
      setUserExpires(userExpires.toUTCString())
      
      console.log(txReceipt[0])
    } catch (err) {
      console.log('error', err )
    }
  }
// done working fine
  async function getSubsToken() {
    try {
      let response = await CryptoVillageSolscriptionContract.getSubscriptionToken();
      console.log('response: ', response)
      const cryptoVillageSolscriptionURL = await axios.get(`https://api-goerli.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${cryptoVillageSolscriptionAddress}&address=${response.from}&page=1&offset=100&startblock=0&endblock=99999999&sort=asc&apikey=H33B3XXI34JTD48FXA47IHP8B9SCRYDZXP`)
      const transactionHash = response['hash']
      const txReceipt = []
      do {
      let txr = await web3Provider.getTransactionReceipt(transactionHash)
      txReceipt[0]=txr
      console.log('confirming...')
      } while (txReceipt[0] == null) ;

      
      
      console.log(txReceipt[0])
      console.log(response.from)
      setTxnURL(txReceipt[0])
      setAddress(response.from)
      setCryptoVillageSolscriptionContract(cryptoVillageSolscriptionURL.data.result[0]['tokenID'])
      // do checks and navigate to summary or subs page
    } catch (err) {
      console.log( err.error.message )
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
              {(Address != null) && (UserOf !== Address) && (
                <div>
                  <p>Your have a membership but either you've not yet activated your subscription or it has Expired. Ps: Check below for fee </p>
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
                    <button onClick={setSubsERC20}>subscribe in $$$</button>
                    <button onClick={setSubsNative}>subscribe in eth</button>
                  </div>
                </div>
              )}
            </div>

            <div>
              {(Address != null) && (UserOf === Address) && (
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
