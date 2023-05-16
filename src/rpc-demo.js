import tatumcom from '@tatumcom/js';
const { TatumSDK, Ethereum, Network } = tatumcom;

const tatum = await TatumSDK.init<Ethereum>({network: Network.ETHEREUM})

const latestBlock = await tatum.rpc.blockNumber()

console.log(latestBlock)
