import fetch from 'node-fetch';
import dotenv from 'dotenv';
import sb from 'satoshi-bitcoin';

// Need a library to convert values to satoshis

// Amount to send
const totalToSendinBTC: number = 0.0001;
// Select fast, medium, or slow
const feeType = "slow";

const totalSendValue: number = sb.toSatoshi(totalToSendinBTC);

// Load wallets to play with
dotenv.config();
function getEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    console.log(`Last six characters of ${key}: ${value.slice(-6)}`);
    return value;
  }

// Pick a wallet "0", "1", "2"
const senderAddress: string = getEnv('WALLET_1_ADDRESS');
const senderPrivateKey: string = getEnv('WALLET_1_PRIVATEKEY');
const receiverAddress: string = getEnv('WALLET_2_ADDRESS');
const apiKey: string = getEnv('TATUMIO_TESTNET_API_KEY');

// Define Interfaces
interface UtxosItem {
    txHash: string;
    index: number;
    value: number;
}
interface SignedTransactionResponse {
  result: {
    hex: string;
    complete: boolean;
  };
}
interface BroadcastTransactionResponse {
    result?: {
      hex?: string;
      errors?: string[];
    };
}
interface FeesResponse {
    fast: number;
    medium: number;
    slow: number;
}


async function estimateTransactionFeeInitial(): Promise<number> {
  // Estimates fee by scraping sender's UTXOs just like the fromUTXOs endpoint we'll use to build the tx
  // This means there is a potential for this fee to be higher than needed
  // So we'll estimate again after we have UTXOs for the transaction
  const feesResponse = await fetch(
    `https://api.tatum.io/v3/blockchain/estimate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey ?? '<>',
      },
      body: JSON.stringify({
        chain: 'BTC',
        type: 'TRANSFER',
        fromAddress: [
          senderAddress
        ],
        to: [
          {
            address: receiverAddress,
            value: totalSendValue
          }
        ]
      })
    }
  );

  if (!feesResponse.ok) {
      throw new Error(`Error creating raw transaction: ${feesResponse.statusText}`);
  }
  const feesResponseJson = await feesResponse.json() as FeesResponse;
  return  sb.toSatoshi(feesResponseJson[feeType]);
}

async function getUtxos(feeInitial: number): Promise<UtxosItem[]> {
    const estimatedBaseCost: number = sb.toBitcoin(totalSendValue + feeInitial);
    const query = new URLSearchParams({
        chain: 'bitcoin-testnet',
        address: senderAddress,
        totalValue: estimatedBaseCost.toString()
    }).toString();

    const utxosResponse = await fetch(
        `https://api.tatum.io/v3/data/utxos?${query}`,
        {
            method: 'GET',
            headers: {
                'x-api-key': apiKey ?? '<>',
            }
        }
    );

    const utxoJson = await utxosResponse.json();

    if (!Array.isArray(utxoJson)) {
        throw new Error(`utxoJson is not an array. Received: ${JSON.stringify(utxoJson)}`);
    }

    const utxos: UtxosItem[] = utxoJson.map(({ txHash, index, value }) => ({
        txHash,
        index,
        value: sb.toSatoshi(value),
    }));

    return utxos;
}

async function estimateTotalTransactionFee(filteredUtxoTxHashes): Promise<number> {
    const feesResponse = await fetch(
        'https://api.tatum.io/v3/blockchain/estimate',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey ?? '<>',
            },
            body: JSON.stringify({
                chain: 'BTC',
                type: 'TRANSFER',
                fromUTXO: filteredUtxoTxHashes,
                to: [
                    {
                        address: receiverAddress,
                        value: totalSendValue,
                    },
                ],
            }),
        },
    );
    if (!feesResponse.ok) {
        throw new Error(`Error creating raw transaction: ${feesResponse.statusText}`);
    }
    const feesResponseJson = await feesResponse.json() as FeesResponse;
    return  sb.toSatoshi(feesResponseJson[feeType]);
  }

async function createRawTransaction(utxos: UtxosItem[], fee: number, totalInputAmount: number): Promise<string> {
    const inputs = utxos.map(({ txHash, index }) => ({
        txid: txHash,
        vout: index,
    }));
    
    const change = Number(sb.toBitcoin(totalInputAmount - totalSendValue - fee).toFixed(8));
    const outputs = {
        [receiverAddress]: Number(sb.toBitcoin(totalSendValue).toFixed(8)),
        [senderAddress]: change,
    };
    
    console.log("inputs:", inputs, "outputs:", outputs, "fee:", fee)

    const response = await fetch('https://api.tatum.io/v3/blockchain/node/BTC', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'createrawtransaction',
            params: [inputs, outputs],
        }),
    });

    if (!response.ok) {
        throw new Error(`Error creating raw transaction: ${response.statusText}`);
    }

    const { result } = await response.json() as { error?: { message: string }, result: string };
    return result;
}

// This is included as a test example. Please do not send private keys
async function signTransaction(rawTransaction: string): Promise<SignedTransactionResponse> {
    const response = await fetch('https://api.tatum.io/v3/blockchain/node/BTC', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey ?? '<>',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'signrawtransactionwithkey',
            params: [rawTransaction, [senderPrivateKey]],
        }),
    });

    if (!response.ok) {
        throw new Error(`Error signing transaction: ${response.statusText}`);
    }

    return await response.json() as SignedTransactionResponse;
}

async function broadcastTransaction(signedTransaction: string) {
  // 1. Add fetch call to make request to the endpoint
  const response = await fetch('https://api.tatum.io/v3/blockchain/node/BTC', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey ?? '<>',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sendrawtransaction',
      params: [signedTransaction],
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Error broadcasting transaction: ${response.statusText}`);
  }

  const result = await response.json() as BroadcastTransactionResponse;
  console.log('Transaction broadcasted successfully:', result);

  // Updated check for errors in the result
  if (result?.result?.errors !== undefined && result.result.errors.length > 0) {
    console.error("Error(s) occurred during broadcasting:");
    
    // Updated console statement
    console.error(result.result.errors);
    throw new Error("Error(s) occurred during broadcasting");
  }
}
  
async function main() {

    // Estimate initial fee to use
    const feeInitial: number = await estimateTransactionFeeInitial();

    // Get UTXOs to send with initial fee estimate and tx inputs
    const utxos = await getUtxos(feeInitial);
    
    // Find minumum number of UTXOs suitable for transfer OR a single that meets minimum needed for tx.
    const suitableUtxo = utxos.find(utxo => utxo.value >= +totalSendValue + +feeInitial);
    const totalInputAmount = suitableUtxo?.value ?? utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    const filteredUtxos = suitableUtxo ? [suitableUtxo] : utxos;
    console.log("UTXOs for input: ", filteredUtxos);

    // Estimate fee with suitable UTXO(s).
    const feeFinal = await estimateTotalTransactionFee(filteredUtxos);

    // Calculate change to return to sender
    const totalRequired = +totalSendValue + +feeFinal;
    const change = +totalInputAmount - +totalRequired;

    console.log("Total to send:", totalSendValue);
    console.log("Fees:", feeFinal);
    console.log("Total required:", totalRequired);
    console.log(`TotalInputAmount from UTXOs: ${totalInputAmount}`);
    console.log("Difference AKA 'change':", change);

    if (change > 0) {
        // Create and sign the transaction
        const rawTransaction = await createRawTransaction(filteredUtxos, feeFinal, totalInputAmount);
        console.log('Raw transaction:', JSON.stringify(rawTransaction, null, 2));

        // Example of using tatum api endpoint to sign tx
        // const signedTransactionResponse = await signTransaction(rawTransaction) as SignedTransactionResponse;
        const signedTransactionResponse = await signTransaction(rawTransaction) as SignedTransactionResponse;
        const signedTransaction = signedTransactionResponse.result.hex;
        console.log('Signed transaction:', signedTransaction);
        console.log(signedTransactionResponse.result.complete);

        // Broadcast the transaction
        await broadcastTransaction(signedTransaction);
        
    } else {
        console.log('Unable to create a transaction with enough btc from UTXOs:');
        console.log(JSON.stringify(filteredUtxos, null, 2));
    }
}


main().catch((error) => console.error(error));
