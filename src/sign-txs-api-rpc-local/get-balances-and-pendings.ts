import fetch from 'node-fetch';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();
const apiKey: string = getEnv('TATUMIO_TESTNET_API_KEY');
function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  console.log(`Last six characters of ${key}: ${value.slice(-6)}`);
  return value;
}

interface Wallet {
  name: string;
  address: string;
  incoming?: number;
  outgoing?: number;
  incomingPending?: number;
  outgoingPending?: number;
  balance?: number;
}


const walletFile = {
  wallets: [
    { name: "WALLET_0", address: "" },
    { name: "WALLET_1", address: "" },
    { name: "WALLET_2", address: "" },
  ],
};

interface DataItem {
  incoming: number;
  outgoing: number;
  incomingPending: number;
  outgoingPending: number;
}

// ...

async function main() {
  // Fill the addresses from environment variables
  walletFile.wallets.forEach((wallet) => {
    wallet.address = getEnv(`${wallet.name}_ADDRESS`);
  });

  const addresses = walletFile.wallets.map((wallet) => wallet.address).join(',');

  const query = new URLSearchParams({
    addresses: addresses,
  }).toString();

  const response = await fetch(
    `https://api.tatum.io/v3/bitcoin/address/balance/batch?${query}`,
    {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    }
  );

  const data: DataItem[] = await response.json() as DataItem[];

  // Logging requested information
  console.log('------------------------------------------');
  for (let index = 0; index < walletFile.wallets.length; index++) {
    const currentData = data[index];
    const wallet = walletFile.wallets[index];
    
    const balance = currentData.incoming - currentData.outgoing;
    const pendingBalance = currentData.incomingPending - currentData.outgoingPending;
    
    console.log(`Address: ${wallet.address}`);
    console.log(`Incoming: ${currentData.incoming}`);
    console.log(`Outgoing: ${currentData.outgoing}`);
    console.log(`Balance: ${balance}`);
    console.log(`Incoming Pending: ${currentData.incomingPending}`);
    console.log(`Outgoing Pending: ${currentData.outgoingPending}`);
    console.log(`Pending Balance: ${pendingBalance}`);
    console.log('------------------------------------------');
  }
}

main().catch((error) => console.error(error));