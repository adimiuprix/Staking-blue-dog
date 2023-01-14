import Head from "next/head";
import styles from "../styles/Home.module.css";
import { BigNumber, Contract, providers, utils } from "ethers";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal, { getProviderInfo } from "web3modal";
import {
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  STAKING_CONTRACT_ADDRESS,
  STAKING_CONTRACT_ABI,
} from "../constants";
import { getDisplayName } from "next/dist/shared/lib/utils";
import { getJsonWalletAddress } from "ethers/lib/utils";

export default function Home() {
  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const [balanceOfBluedogToken, setBalanceOfBluedogToken] = useState(zero);
  const [timeUntilUnlock, setTimeUntilUntlock] = useState(zero);
  const [stakeApy, setStakeApy] = useState(zero);
  const web3ModalRef = useRef();
  const ref = useRef(null);
  const ref1 = useRef(null);
  const ref2 = useRef(null);

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 31337) {
      window.alert("Change the network to Goerli");
      throw new ERROR("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const stakeContract = new Contract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_CONTRACT_ABI,
        provider
      );
      const _owner = await stakeContract.owner();

      const signer = await getProviderOrSigner(true);

      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStakedTokenBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      const stakeContract = new Contract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_CONTRACT_ABI,
        provider
      );
      const balance = await stakeContract.getStakedBalance();

      setBalanceOfBluedogToken(balance);

      document.getElementById(
        "tokenAmount"
      ).innerHTML = `You have ${balance.toString()}  token staked`;
      console.log(balance.toString());
      getTimeUntilWithdraw();
      getClaimableToken();
      getApy();
    } catch (err) {
      console.error(err);
      setBalanceOfBluedogToken(zero);
      document.getElementById(
        "tokenAmount"
      ).innerHTML = `You have ${balanceOfBluedogToken} staked`;
    }
  };

  const getTimeUntilWithdraw = async () => {
    try {
      const provider = await getProviderOrSigner();
      const stakeContract = new Contract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_CONTRACT_ABI,
        provider
      );
      const time = await stakeContract.withdrawTimeLeft();
      console.log(time.toString());
      setTimeUntilUntlock(time);
      document.getElementById(
        "timeToStake"
      ).innerHTML = `Time until Withdraw: ${timeUntilUnlock} seconds`;
    } catch (err) {
      console.error(err);
      setTimeUntilUntlock(zero);
      document.getElementById(
        "timeToStake"
      ).innerHTML = `Time until Withdraw: ${timeUntilUnlock} seconds`;
    }
  };

  const getClaimableToken = async () => {
    try {
      const provider = await getProviderOrSigner();
      const stakeContract = new Contract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_CONTRACT_ABI,
        provider
      );
      const reward = await stakeContract.getTokensToBeClaimed();

      const newRewared = reward.toString();

      setTokensToBeClaimed(reward);
      document.getElementById(
        "rewardToken"
      ).innerHTML = `You can claim ${tokensToBeClaimed} token`;
    } catch (err) {
      console.error(err);
      setTokensToBeClaimed(zero);
      document.getElementById(tokensToBeClaimed);
      document.getElementById(
        "rewardToken"
      ).innerHTML = `You can claim ${tokensToBeClaimed} tokens`;
    }
  };

  const getApy = async () => {
    try {
      const provider = await getProviderOrSigner();

      const stakeContract = new Contract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_CONTRACT_ABI,
        provider
      );

      const apy = await stakeContract.apy();
      const newApy = apy.toString();

      setStakeApy(newApy);

      document.getElementById(
        "stakingApy"
      ).innerHTML = `Stake your BlueDog token and earn an Apy of ${stakeApy} %`;
    } catch (err) {
      console.error(err);
      setStakeApy(zero);
    }
  };

  const stake = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const stakeContract = new Contract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_CONTRACT_ABI,
        signer
      );
      const amount = document.getElementById("stakeAmount").value;
      const newAmount = Number(amount);

      const time = document.getElementById("stakeTime").value;
      const tx = await stakeContract.stake(amount, time);

      setLoading(true);
      await tx.wait();
      setLoading(false);
      document.getElementById("stakeAmount").innerText = "";
      document.getElementById("stakeTime").innerText = "";

      ref.current.value = "";
      ref1.current.value = "";

      await getStakedTokenBalance();
    } catch (err) {
      console.error(err);
    }
  };

  const claimTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const stakeContract = new Contract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_CONTRACT_ABI,
        signer
      );
      const tx = await stakeContract.claim();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      getStakedTokenBalance();
    } catch (err) {
      console.error(err);
    }
  };

  const withdrawToken = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const stakeContract = new Contract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_CONTRACT_ABI,
        signer
      );
      const tx = await stakeContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const withdrawAllToken = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const stakeContract = new Contract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_CONTRACT_ABI,
        signer
      );
      const tx = await stakeContract.withdrawAll();
      setLoading(true);
      await tx.wait();
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const addRewards = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const stakeContract = new Contract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_CONTRACT_ABI,
        signer
      );
      const stakeAmount = document.getElementById("rewardAmount").value;

      const tx = await stakeContract.addRewards(stakeAmount);
      ref2.current.value = "";
      setLoading(true);
      await tx.wait();
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "localhost",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      getApy();
      connectWallet();
      getStakedTokenBalance();
      getTimeUntilWithdraw();
      getClaimableToken();
      getOwner();
    }
  });

  return (
    <div
      style={{
        display: "flex-col",
        color: "white",
      }}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>Staking APP</h1>
        <button onClick={connectWallet} className={styles.connect}>
          Connect your wallet
        </button>
      </div>
      <div className={styles.middle}>
        <div className={styles.apy} id="stakingApy">
          Stake your BlueDog token and earn an Apy of 0 %
        </div>

        <div className={styles.form}>
          <div className={styles.form1}>
            <label className={styles.label}>
              <div>Amount to Stake:</div>
              <input ref={ref} className="input" type="text" id="stakeAmount" />
            </label>

            <label className={styles.label}>
              <div>Time to stake in days:</div>
              <input ref={ref1} className="input" type="text" id="stakeTime" />
            </label>
          </div>
          <div className={styles.form2}>
            <button onClick={stake} className={styles.button} id="stake">
              Stake your token
            </button>

            <button
              onClick={withdrawToken}
              className={styles.button}
              id="withdraw"
            >
              Withdraw your token
            </button>
          </div>
          <div className={styles.form2}>
            <button onClick={claimTokens} className={styles.button} id="claim">
              Claim your rewards
            </button>
          </div>
        </div>

        <div className={styles.form2}>
          <button
            onClick={getStakedTokenBalance}
            className={styles.getButton}
            id="getBalance"
          >
            Get balance
          </button>
        </div>
        <div className={styles.list}>
          <div className={styles.result} id="tokenAmount">
            Amount of Tokens
          </div>
          <div className={styles.result} id="timeToStake">
            Time until unlock
          </div>
          <div className={styles.result} id="rewardToken">
            Tokens to claim
          </div>
        </div>

        {isOwner ? (
          <div>
            {loading ? (
              <div className={styles.form}>
                <div className={styles.form2}>
                  <button className={styles.button}>Loading...</button>
                </div>
              </div>
            ) : (
              <div className={styles.form}>
                <label className={styles.label}>
                  <div>Amount of Staking Rewards:</div>
                  <input
                    ref={ref2}
                    className="input"
                    type="text"
                    id="rewardAmount"
                  />
                </label>
                <div className={styles.form2}>
                  <button className={styles.button} onClick={addRewards}>
                    Add Staking Rewards
                  </button>
                  <button className={styles.button} onClick={withdrawAllToken}>
                    Withdraw everything
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          ""
        )}
      </div>
      <div className={styles.footer}>Made by Recrafter</div>
    </div>
  );
}
