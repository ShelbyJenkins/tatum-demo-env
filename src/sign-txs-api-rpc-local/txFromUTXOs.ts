import fetch from 'node-fetch';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

// Pick a wallet "0", "1", "3"
const sender = 1;
const receiver  = 2;
// amount to send
const totalValue: number = 0.0001


let senderAddress: string;
let senderPrivateKey: string; 
let receiverAddress: string; 

async function readWalletsFile() {
    try {
        const fileContent = await fs.readFile('dist/wallets.json', 'utf-8');
        const parsedContent = JSON.parse(fileContent);
        

        const senderWallet = parsedContent.wallets[sender];
        const receiverWallet = parsedContent.wallets[receiver ];

        senderAddress = senderWallet.address;
        senderPrivateKey = senderWallet.privateKey;
        receiverAddress = receiverWallet.address;

        console.log('Sender Address:', senderAddress);
        console.log('Sender Private Key:', senderPrivateKey);
        console.log('Receiver Address:', receiverAddress);
    } catch (error) {
        console.error('Error reading or parsing wallets.json:', error);
    }
  }

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
    Medium: number;
    medium: number;
    fast: number;
}

async function estimateBaseFee(): Promise<number> {
    const query = 'BTC';
    const baseFeeResponse = await fetch(
        `https://api.tatum.io/v3/blockchain/fee/${query}`,
        {
            method: 'GET',
            headers: {
                'x-api-key': process.env.APIKEY ?? '<>',
            }
        }
    );
    const baseFeeResponseJson = await baseFeeResponse.json() as FeesResponse;
    return baseFeeResponseJson.medium;
}

async function getUtxos(baseFee: number): Promise<UtxosItem[]> {
    const estimatedBaseCost: number = totalValue + baseFee;
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
                'x-api-key': process.env.APIKEY ?? '<>',
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
        value,
    }));

    return utxos;
}

async function estimateFee(filteredUtxoTxHashes): Promise<number> {
    const feesResponse = await fetch(
        'https://api.tatum.io/v3/blockchain/estimate',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.APIKEY ?? '<>',
            },
            body: JSON.stringify({
                chain: 'BTC',
                type: 'TRANSFER',
                fromUTXO: filteredUtxoTxHashes,
                to: [
                    {
                        address: receiverAddress,
                        value: totalValue,
                    },
                ],
            }),
        },
    );
    if (!feesResponse.ok) {
        throw new Error(`Error creating raw transaction: ${feesResponse.statusText}`);
    }
    const feesResponseJson = await feesResponse.json() as FeesResponse;
    return feesResponseJson.medium;
}

async function createRawTransaction(utxos: UtxosItem[], fee: number, totalInputAmount: number): Promise<string> {
    const inputs = utxos.map(({ txHash, index }) => ({
        txid: txHash,
        vout: index,
    }));
    
    const change = Number((totalInputAmount - totalValue - fee).toFixed(8));
    const outputs = {
        [receiverAddress]: Number(totalValue.toFixed(8)),
        [senderAddress]: change,
    };
    
    console.log("inputs:", inputs, "outputs:", outputs, "fee:", fee)

    const response = await fetch('https://api.tatum.io/v3/blockchain/node/BTC', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.APIKEY ?? '<>',
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

async function signTransaction(rawTransaction: string): Promise<SignedTransactionResponse> {
    const response = await fetch('https://api.tatum.io/v3/blockchain/node/BTC', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.APIKEY ?? '<>',
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
      'x-api-key': process.env.APIKEY ?? '<>',
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
  console.log("Received result:", result);

  // Updated check for errors in the result
  if (result?.result?.errors !== undefined && result.result.errors.length > 0) {
    console.error("Error(s) occurred during broadcasting:");
    
    // Updated console statement
    console.error(result.result.errors);
    throw new Error("Error(s) occurred during broadcasting");
  }
}
  


async function main() {
    readWalletsFile();
    
    // Estimate base fee to use and add create a totalValue + base fee
    const baseFee: number = await estimateBaseFee() / 100000; // This doesn't seem to be estimating the fees correctly due to volitality.
    console.log("baseFee: ", baseFee)

    // Get UTXOs to send
    const utxos = await getUtxos(baseFee);
    
    // Find minumum number of UTXOs suitable for transfer OR a single that meets minimum needed for tx.
    const suitableUtxo = utxos.find(utxo => utxo.value >= +totalValue + +baseFee);
    const totalInputAmount = suitableUtxo?.value ?? utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    const filteredUtxos = suitableUtxo ? [suitableUtxo] : utxos;
    console.log("UTXOs for input: ", filteredUtxos);

    // Estimate fee with suitable UTXO(s).
    const feeMedium = await estimateFee(filteredUtxos);

    // Calculate change to return to sender
    const totalRequired = +totalValue + +feeMedium;
    const change = +totalInputAmount - +totalRequired;

    console.log("Total to send:", totalValue);
    console.log("Fees:", feeMedium);
    console.log("Total required:", totalRequired);
    console.log(`TotalInputAmount from UTXOs: ${totalInputAmount}`);
    console.log("Difference:", change);

    if (change > 0) {
        // Create and sign the transaction
        const rawTransaction = await createRawTransaction(filteredUtxos, feeMedium, totalInputAmount);
        console.log('Raw transaction:', JSON.stringify(rawTransaction, null, 2));
        const signedTransactionResponse = await signTransaction(rawTransaction) as SignedTransactionResponse;
        const signedTransaction = signedTransactionResponse.result.hex;
        console.log('Signed transaction:', signedTransaction);
        console.log(signedTransactionResponse.result.complete);

        // Broadcast the transaction
        await broadcastTransaction(signedTransaction);
        console.log('Transaction broadcasted successfully.');

    } else {
        console.log('Unable to create a transaction with enough btc from UTXOs:');
        console.log(JSON.stringify(filteredUtxos, null, 2));
    }
}


main().catch((error) => console.error(error));
