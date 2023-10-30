import { init } from "etherscan-api";
import fs from "fs";

const etherscan = init(process.env.ETHERSCAN_API_KEY);

try {
  fs.mkdirSync("./assets", { recursive: true });
} catch (e) {} // ^ make dir for cache

let knownProxies;
export async function loadAbiAndCache(address) {
  try {
    const abi = fs.readFileSync("./assets/" + address + "_abi.json", "utf-8");
    return JSON.parse(abi);
  } catch (e) {
    //console.log("error", e)
  }
  const abi = await etherscan.contract.getabi(address);
  fs.writeFileSync("./assets/" + address + "_abi.json", abi.result);
  return JSON.parse(abi.result);
}
