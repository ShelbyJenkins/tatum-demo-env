
import { TatumSDK, Celo, Network } from '@tatumcom/js'

const tatum = await TatumSDK.init<Celo>({network: Network.CELO})

const latestBlock = await tatum.rpc.blockNumber()

console.log(latestBlock)