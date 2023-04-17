import { useState } from "react";
import { ethers } from "ethers";
import Web3 from "web3";
import { abi as erc20Abi } from "../abi/erc20.json";
import { abi as uniswapAbi } from "../abi/uniswap.json";

export default function Home() {
  const [inputToken, setInputToken] = useState("");
  const [outputToken, setOutputToken] = useState("");

  async function handleSwap() {
    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
    const accounts = await web3.eth.getAccounts();
    const signer = new ethers.providers.Web3Provider(
      window.ethereum
    ).getSigner();

    const inputTokenAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
    const outputTokenAddress = "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"; // TODO
    const inputTokenAmount = "1000000000000000000"; // TODO
    const outputTokenAmount = "1000000000000000000"; // TODO

    const inputTokenContract = new ethers.Contract(
      inputTokenAddress,
      erc20Abi,
      signer
    );
    const outputTokenContract = new ethers.Contract(
      outputTokenAddress,
      erc20Abi,
      signer
    );
    const uniswapContract = new ethers.Contract("", uniswapAbi, signer); // TODO: Add Uniswap contract address

    const inputTokenBalance = await inputTokenContract.balanceOf(accounts[0]);
    if (inputTokenBalance.lt(inputTokenAmount)) {
      alert("Insufficient input token balance");
      return;
    }

    const inputTokenAllowance = await inputTokenContract.allowance(
      accounts[0],
      uniswapContract.address
    );
    if (inputTokenAllowance.lt(inputTokenAmount)) {
      const approveTx = await inputTokenContract.approve(
        uniswapContract.address,
        inputTokenAmount
      );
      await approveTx.wait();
    }

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
    const amounts = await uniswapContract.swapExactTokensForETH(
      inputTokenAmount,
      outputTokenAmount,
      [inputTokenAddress, outputTokenAddress],
      accounts[0],
      deadline,
      { value: ethers.utils.parseEther("0.1") }
    );
  }

  return (
    <div>
      <h1>Simple Dex</h1>
      <label htmlFor="inputToken">Input Token:</label>
      <input
        id="inputToken"
        type="text"
        value={inputToken}
        onChange={(e) => setInputToken(e.target.value)}
      />
      <br />
      <label htmlFor="outputToken">Output Token:</label>
      <input
        id="outputToken"
        type="text"
        value={outputToken}
        onChange={(e) => setOutputToken(e.target.value)}
      />
      <br />
      <button onClick={handleSwap}>Swap</button>
      <style jsx>{`
        label {
          display: block;
          margin-bottom: 0.5rem;
        }
        input {
          display: block;
          margin-bottom: 1rem;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 3px;
          width: 100%;
        }
        button {
          padding: 0.5rem 1rem;
          background-color: #4caf50;
          color: #fff;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
