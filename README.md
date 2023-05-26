# Usage

This guide is available here: https://github.com/ShelbyJenkins/tatum-demo-env

* Install dependencies:
  * VSCode + Dev Containers Extension
  * Docker Desktop
* Clone this repo
* Open dev container from folder
* `npm install` to install remaining dependencies

Neat.

# About Tatum

## Who

Shelby is a solutions engineer on the team at Tatum.

## Why

Tatum is fanatical about the developer experience. Our goal is to enable developers to quickly build and scale web3 apps.

Conceptually, a blockchain is just a special kind of database. Call it a decentralized database or an open ledger or a public DB. Ultimately, in the web3 tech stack, the blockchain functions as a database. This is a revolutionary new way to build, but building with the blockchain doesn't have to require a revolution in a developer's life.

The Tatum platform abstracts away the challenges of working with blockchains, and lets developers treat the blockchain just like any other traditional database in their tech stack. We do this by providing coverage for the core technical requirements of blockchain use cases. By abstracting away the specifics of blockchain development, devs are able to build their revolutionary new web3 app and scale to the enterprise level.

## How

Tatum as a platform consists of:

* An SDK
  * Open Source
  * JS/TS, C#, and PHP
  * Unified interfaces across all protocols
    * So an open-source project made with Tatum can be forked by anyone building on an EVM
* An API
  * Feature-rich (600+ endpoints!)
  
* Data Infrastructure
  * RPC nodes with elastic scalability, redundancy, and global distribution
  * Archive nodes with full functionality
  * Indexed and cached blockchain historical data for quick and economical retrieval

## What

Tatum [Supports:](https://docs.tatum.io/introduction/supported-blockchains)

`Algorand, Arbitrum, Aurora, Avalanche, Bitcoin, Bitcoin Cash, BNB Beacon Chain, BNB Smart Chain, Cardano, Celo, Cronos, Dogecoin, Elrond, EOS.IO, Ethereum, Fantom, Flow, Gnosis, Harmony, Klaytn, KuCoin, Kusama, Lisk, Litecoin, NEAR, Neo, Oasis Network, Optimism, Palm, Polkadot, Polygon, Ripple, RSK, Solana, Stellar, Tezos, Tron, VeChain, XDC Network, ZCash, Zilliqa`

* 41 blockchain protocols
* 75 networks including mainnets and testnets

Tatum is Free
* No credit cards required
* No features gated behind a paywall

Now, to the demo.

# The Tatum API
* Free and permissionless API and RPC Access.
  * From five requests per second to five thousand.
## Make an API Call 
Make CURL calls with 
* Terminal
* Postman -> https://www.postman.com/blockchainnow/workspace/tatum-io/overview
* VSCode REST Client extension -> https://marketplace.visualstudio.com/items?itemName=humao.rest-client

# The Tatum SDK  

## Installing
[Full install and getting started notes](https://docs.tatum.com/sdk/javascript-typescript-sdk)

or run 

`npm install @tatumcom/js`

`yarn add @tatumcom/js`

`pnpm install @tatumcom/js`

## Demo
### RPC
https://docs.tatum.com/docs/rpc-api-reference

JSON-RPC
  * Easy to start

SDK RPC
* Unified interface across chain allows for composability and templatization

### Notifications
https://docs.tatum.com/docs/notifications

* https://webhook.site/
* run code and wait

## A note about SDK versions
Tatum is currently migrating to the v3 version of the SDK. It focuses on simplifying development by unifying the interfaces used to interact with blockchains.

This new SDK is the current live version on GitHub and is supported by the docs at tatum.com.

Currently, not all features from the v2 SDK are implemented in the new SDK. If you're interested in a feature documented in the tatum.io docs, you may consider using the v2 SDK for the time being.

# Tatum Blockchain Building Blocks
## Get an API Key
[Free one-click access with your Google or GitHub account](https://tatum.com/)


## Data-API
### Notifications
### Data
### Estimate Fees

## NFTs and Smart Contracts
### NFT Express
### Marketplaces and Exchanges

## Account Management
### KMS
### Gas Pump
### Virtual Accounts

# Connect with Tatum!
[Discord](https://discord.gg/tatum)

[Github](https://github.com/tatumio)

[Twitter](https://twitter.com/tatum_io)

[Linkedin](https://www.linkedin.com/company/tatumio)

[Youtube](https://www.youtube.com/@TatumWeb3)

# Notes and Resources
## Tatum Links:
[Tatum.com v3 SDK docs](https://docs.tatum.com/)

[Tatum.io API docs](https://apidoc.tatum.io/)

[Tatum.io docs](https://docs.tatum.io/)

[Tatum v3 SDK docs](https://github.com/tatumio/tatum-js)
[Tatum v2 SDK docs](https://github.com/tatumio/tatum-js/tree/v2)

[Tatum Supported Networks](https://github.com/tatumio/tatum-js/blob/master/src/dto/Network.ts)

https://explorer.celo.org/mainnet/