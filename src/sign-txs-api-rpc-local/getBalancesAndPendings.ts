import fetch from 'node-fetch';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

interface DataItem {
  incoming: number;
  outgoing: number;
  incomingPending: number;
  outgoingPending: number;
}

async function main() {
  const fileContent = await fs.readFile('dist/wallets.json', 'utf-8');
  const walletFile = JSON.parse(fileContent);

  const addresses = walletFile.wallets.map(wallet => wallet.address).join(',');

  const query = new URLSearchParams({
    addresses: addresses
  }).toString();
  
  const response = await fetch(
    `https://api.tatum.io/v3/bitcoin/address/balance/batch?${query}`,
    {
      method: 'GET',
      headers: {
        'x-api-key': process.env.APIKEY ?? '<>',
      }
    }
  );

  const data: DataItem[] = await response.json() as DataItem[];
  console.log("response:");
  console.log(JSON.stringify(data, null, 2));

  // Update wallets data (using a loop without forEach)
  for (let index = 0; index < walletFile.wallets.length; index++) {
    const currentData = data[index];
    
    walletFile.wallets[index] = {
      ...walletFile.wallets[index],
      incoming: currentData.incoming,
      outgoing: currentData.outgoing,
      incomingPending: currentData.incomingPending,
      outgoingPending: currentData.outgoingPending,
      balance: currentData.incoming - currentData.outgoing
    };
  }
  
  // Write the updated JSON data to the wallets.json file
  await fs.writeFile('dist/wallets.json', JSON.stringify(walletFile, null, 2));
}

main().catch((error) => console.error(error));
