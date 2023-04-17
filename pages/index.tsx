import { useState, useEffect } from "react";
import Web3 from "web3";
import { ethers } from "ethers";
import { Client } from "@notionhq/client";

import { abi as erc20Abi } from "../abi/erc20.json";
import { abi as uniswapAbi } from "../abi/uniswap.json";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default function Home() {
  const [inputToken, setInputToken] = useState("");
  const [outputToken, setOutputToken] = useState("");
  const [outputMessage, setOutputMessage] = useState("");
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    fetch(`/api/get-user?name=${encodeURIComponent(name)}`)
      .then((response) => response.json())
      .then((data) => {
        setPoints(data.points);
        setHistory(data.history);
      });
  }, [name]);



  async function handleSwap() {
    const web3 = new Web3(Web3.givenProvider);
    const accounts = await web3.eth.getAccounts();
    const signer = new ethers.providers.Web3Provider(
      window.ethereum
    ).getSigner();
    const inputTokenAddress = ""; // TODO: Add input token address
    const outputTokenAddress = ""; // TODO: Add output token address
    const inputTokenAmount = ""; // TODO: Add input token amount
    const outputTokenAmount = ""; // TODO: Add output token amount

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
      setOutputMessage("Insufficient input token balance");
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

    setOutputMessage(
      `Swapped ${inputTokenAmount} ${inputToken} for ${outputTokenAmount} ${outputToken}. You earned ${points} points!`
    );
    handlePoints();

    const swapHistory = `${inputTokenAmount} ${inputToken} for ${outputTokenAmount} ${outputToken}`;
    setHistory([...history, swapHistory]);
    fetch(
      `/api/update-history?name=${encodeURIComponent(
        name
      )}&history=${encodeURIComponent(swapHistory)}`
    )
      .then((response) => response.json())
      .then((data) => console.log(data));
  }

  function handleNameChange(e) {
    setName(e.target.value);
  }

  function handlePoints() {
    const newPoints = points + 1;
    setPoints(newPoints);
    fetch(
      `/api/update-points?name=${encodeURIComponent(name)}&points=${newPoints}`
    )
      .then((response) => response.json())
      .then((data) => console.log(data));
  }

  function handleDarkMode() {
    const body = document.querySelector("body");
    body?.classList.toggle("dark-mode");
    // In dark mode the text cannot be seen, update text color for dark mode
    const container = document.querySelector(".container");
    container?.classList.toggle("dark-mode");

  }

  async function handleConnectWallet() {
    try {
      await window.ethereum.enable();
      setOutputMessage("Wallet connected successfully");
    } catch (error) {
      setOutputMessage("Error connecting wallet");
    }
  }

  return (
    <div className="container">
      <header>
        <h1 className="main-title">Simple DEX</h1>
        <>
          A work in progress simple dex, check the repo for abi and smart
          contract as we continue to build
        </>

        {/* Add an empty new line*/}
        <br />
        <br />
        <div className="header-buttons">
          <button
            className="button connect-wallet"
            onClick={handleConnectWallet}
          >
            Connect Wallet
          </button>
          <button className="button dark-mode" onClick={handleDarkMode}>
            Dark Mode
          </button>
        </div>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSwap();
        }}
      >
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={handleNameChange}
          className="form-input"
        />
        <label htmlFor="inputToken">Input Token:</label>
        <input
          id="inputToken"
          type="text"
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
          className="form-input"
        />
        <label htmlFor="outputToken">Output Token:</label>
        <input
          id="outputToken"
          type="text"
          value={outputToken}
          onChange={(e) => setOutputToken(e.target.value)}
          className="form-input"
        />
        <button type="submit" className="button swap-button">
          Swap
        </button>
      </form>
      {outputMessage && (
        <div className="output">
          <h2>Output Message:</h2>
          <p>{outputMessage}</p>
        </div>
      )}
      <div className="points">
        <h2>Points:</h2>
        <p>{points}</p>
      </div>
      <div className="history">
        <h2>History:</h2>
        <ul>
          {history.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
