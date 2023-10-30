import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { loadAbiAndCache } from "./loadAbiAndCache.js";
import "dotenv/config";

export const UNISWAP_DAI_ETH_ADDRESS =
  "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11";

export const UNISWAP_ROUTER_ADDRESS =
  "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
export const UNISWAP_ROUTER_ABI = await loadAbiAndCache(UNISWAP_ROUTER_ADDRESS);

export const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const WETH_ABI = await loadAbiAndCache(WETH_ADDRESS);

export const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
export const DAI_ABI = await loadAbiAndCache(DAI_ADDRESS);

const UNISWAP_DAI_ETH_ABI = await loadAbiAndCache(UNISWAP_DAI_ETH_ADDRESS);

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const blockNumber = await publicClient.getBlockNumber();

console.log("blockNumber", blockNumber);

const priceOfEthAtBlock = async (publicClient, blockNumber) => {
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
};
const priceOfEth = await priceOfEthAtBlock(publicClient, blockNumber);
console.log("priceOfEthAtBlock", priceOfEth);

const account = privateKeyToAccount(process.env.PRIVATE_KEY);

console.log("💾 loaded account ", account.address);
//function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;

const amountOfDAIOut = 10;

const ethNeededToGetDAI = (amountOfDAIOut * 110) / 100 / priceOfEth;

console.log("we need this much WETH: ethNeededToGetDAI", ethNeededToGetDAI);

const wethNeededAsBigNumber = parseEther("" + ethNeededToGetDAI);

console.log("wethNeededAsBigNumber", wethNeededAsBigNumber);

const walletClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
});

//get balance from WETH contract
const balanceOfWeth = await publicClient.readContract({
  address: WETH_ADDRESS,
  abi: WETH_ABI,
  functionName: "balanceOf",
  args: [account.address],
});

console.log("balanceOfWeth", balanceOfWeth);

if (balanceOfWeth < wethNeededAsBigNumber) {
  const amountOfWethNeeded = wethNeededAsBigNumber - balanceOfWeth;
  console.log("we need to get WETH:", amountOfWethNeeded);

  const { request } = await publicClient.simulateContract({
    address: WETH_ADDRESS,
    abi: WETH_ABI,
    functionName: "deposit",
    value: parseEther("" + ethNeededToGetDAI),
    account,
  });

  console.log("🔥 write contract to get weth from eth...");

  let writeResult = await walletClient.writeContract(request);
  console.log("writeResult", writeResult);
} else {
  console.log("we have enough WETH to get DAI....");
}

const toAddress = account.address;

console.log("let's try swapETHForExactTokens...");

//function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)

const path = [WETH_ADDRESS, DAI_ADDRESS];

console.log("path", path);

const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

const args = [
  parseEther("" + amountOfDAIOut), // uint amountOut
  path, // address[] calldata path
  toAddress, // address to,
  deadline,
];

console.log("⚙️ simulate on publicClient...");

const { request } = await publicClient.simulateContract({
  address: UNISWAP_ROUTER_ADDRESS,
  abi: UNISWAP_ROUTER_ABI,
  functionName: "swapETHForExactTokens",
  args: args,
  value: parseEther("" + ethNeededToGetDAI),
  account,
});

console.log("args", args);

console.log("🔥 write contract to swap from WETH to DAI...");

let result2 = await walletClient.writeContract(request);

console.log("your transaction hash ser:", result2);
