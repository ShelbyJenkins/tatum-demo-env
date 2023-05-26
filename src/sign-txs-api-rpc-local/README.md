### Use case

User wants to prepare and sign a UTXO transaction without the SDK or KMS.

Typically, the user would use the Tatum SDK to sign transactions, or they would use KMS (or both). In this case, neither option is available to the user.

The transaction will be prepared with UTXOs retrieved from the Tatum API, the transaction prepared via RPC, signed locally, and then broadcasted via RPC.

### Starting condition

Create three wallets and store their details in a ENV file.

`src/sign-txs-api-rpc-local/get-balances-and-pendings.ts` will update the balances using [`https://api.tatum.io/v3/bitcoin/address/balance/batch`](https://api.tatum.io/v3/bitcoin/address/balance/batch)

### Description of code:

This TypeScript code is a script that demonstrates how to programmatically create, sign, and broadcast a Bitcoin transaction using the Tatum API. Let's break down the code step by step:

1. **Importing required libraries:** The code imports `node-fetch`, `fs/promises`, and `dotenv`. These libraries are used for making HTTP requests, reading files, and managing environment variables, respectively.
2. **Loading environment variables:** The dotenv library is used to load environment variables from a `.env` file. The API key should be stored in this file.
3. **Reading wallets information:** The function `readWalletsFile()` reads the content of `dist/wallets.json`, which contains wallet information (address and private key) of the sender and receiver. Then it sets the values of the variables `senderAddress`, `senderPrivateKey`, and `receiverAddress`.
4. **Defining interfaces:** Various interfaces like `UtxosItem`, `SignedTransactionResponse`, `BroadcastTransactionResponse`, and `FeesResponse` are defined for better type checking and auto-completion.
5. **Estimating base fee:** The function `estimateTransactionFeeInitial()` fetches the medium base fee from the Tatum API. This is used for fetching UTXOs to be used in the transaction.
    1. [https://apidoc.tatum.io/tag/Blockchain-fees#operation/getBlockchainFee](https://apidoc.tatum.io/tag/Blockchain-fees#operation/getBlockchainFee)
6. **Fetching UTXOs:** The function `getUtxos(baseFee: number)` fetches unspent transaction outputs (UTXOs) of the sender, which will be used as inputs for the new transaction. These are filtered to find a single UTXO to cover the whole transaction or the minimum number of UTXOs that can complete the transaction.
    1. [https://apidoc.tatum.io/tag/Data-API#operation/GetUtxosByAddress](https://apidoc.tatum.io/tag/Data-API#operation/GetUtxosByAddress)
7. **Estimating fee:** The function `estimateTotalTransactionFee(filteredUtxoTxHashes)` calculates the estimated transaction fee based on filtered UTXO(s). This will be the actual fee used in the transaction.
    1. [https://apidoc.tatum.io/tag/Blockchain-fees#operation/EstimateFeeBlockchain](https://apidoc.tatum.io/tag/Blockchain-fees#operation/EstimateFeeBlockchain)
8. **Creating raw transaction:** The function `createRawTransaction(utxos: UtxosItem[], fee: number, totalInputAmount: number)` creates a raw Bitcoin transaction using the UTXOs, the fee, and the total input amount. It also returns the raw transaction string.
    1. [https://developer.bitcoin.org/reference/rpc/createrawtransaction.html](https://developer.bitcoin.org/reference/rpc/createrawtransaction.html)
9. **Signing the transaction:** The function `signTransaction(rawTransaction: string)` signs the raw transaction using the sender's private key and returns the `SignedTransactionResponse`.
    1. In real-world use, the transaction would be signed locally. This method is not for mainnet use as it requires sending the private key.
    2. [https://developer.bitcoin.org/reference/rpc/signrawtransactionwithkey.html](https://developer.bitcoin.org/reference/rpc/signrawtransactionwithkey.html)
10. **Broadcasting the transaction:** The function `broadcastTransaction(signedTransaction: string)` broadcasts the signed transaction to the Bitcoin network.
    1. [https://apidoc.tatum.io/tag/Bitcoin#operation/BtcBroadcast](https://apidoc.tatum.io/tag/Bitcoin#operation/BtcBroadcast)

In the `main()` function, these above-mentioned functions are called in sequence to read wallet information, estimate fees, get UTXOs, create, sign, and broadcast the transaction. If any error occurs during this process, it will be caught and logged to the console.