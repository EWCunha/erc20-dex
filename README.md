# DEX Project
This a Decentralized Exchange (DEX) application with its smart contract deployed on Rinkeby and Goerli/Görli testnets. This DEX uses the order book algorithm. DAI stablecoin is the main trade token and it is used to trade the following tokens:
- REP
- BAT
- ZRX

## Live dApp
Please, check the live dApp [here](https://my-dex.herokuapp.com/), deployed on Heroku. After connecting your Metamask wallet (install Chrome extension [here](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)), set the wallet to Rinkeby or Goerli testnet and refresh the page.

Use the following faucets to get some fake ETH:
- Rinkeby: https://rinkebyfaucet.com/ or https://faucets.chain.link/rinkeby
- Goerli/Görli: https://goerlifaucet.com/ or https://faucets.chain.link/goerli

Then, go to [Uniswap](https://app.uniswap.org/) and swap some ETH to DAI, in order to test the live dApp. Just be sure that the wallet is connected to one of the testnets. 

Have fun!

## Run dApp locally
First, download this repository. After downloading, open the terminal and install Truffle:
```
npm install -g truffle
```

Go to the root folder of the project and run:
```
npm install
truffle develop
migrate --reset
```

This will install Truffle dependencies, initialize a local blockchain (Ganache) and deploy the smart contracts (DEX and token mocks) to this local blockchain. 

Then, open another terminal (don't close the other terminal, since the local blockchain is running on that), go to the `client` folder and run:
```
npm install
npm start
```

This will install the frontend dependecies and start the dApp. You will also need to add the local blockchain on your Metamask wallet.

Have fun!

## Guide
1. Send some DAI to the DEX
2. Create a Limit or Market order with any of the other tokens
3. If there is a match in the orders, they will be fulfilled
4. Withdraw DAI
