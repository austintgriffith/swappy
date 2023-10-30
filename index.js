import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { loadAbiAndCache } from "./loadAbiAndCache.js";
import "dotenv/config";

export const UNISWAP_DAI_ETH_ADDRESS =
  "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11";

export const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const WETH_ABI = await loadAbiAndCache(WETH_ADDRESS);

export const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
export const DAI_ABI = await loadAbiAndCache(DAI_ADDRESS);

const UNISWAP_DAI_ETH_ABI = await loadAbiAndCache(UNISWAP_DAI_ETH_ADDRESS);

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const blockNumber = await client.getBlockNumber();

console.log("blockNumber", blockNumber);

export async function priceOfEthAtBlock(publicClient, blockNumber) {
  const balanceOfDAIInUniswapStart = await publicClient.readContract({
    address: DAI_ADDRESS,
    abi: DAI_ABI,
    functionName: "balanceOf",
    args: [UNISWAP_DAI_ETH_ADDRESS],
    blockNumber: blockNumber,
  });

  const balanceOfWethInUniswapStart = await publicClient.readContract({
    address: WETH_ADDRESS,
    abi: WETH_ABI,
    functionName: "balanceOf",
    args: [UNISWAP_DAI_ETH_ADDRESS],
    blockNumber: blockNumber,
  });
  const priceOfEth = balanceOfDAIInUniswapStart / balanceOfWethInUniswapStart;

  return Number(priceOfEth);
}

console.log("priceOfEthAtBlock", await priceOfEthAtBlock(client, blockNumber));
