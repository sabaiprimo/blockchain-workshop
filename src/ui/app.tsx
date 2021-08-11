/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';
import { MultiSenderWrapper } from '../lib/contracts/MultisenderWrapper';
import { IERC20Wrapper } from '../lib/contracts/IERC20Wrapper';
import { CONFIG } from '../config';

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    // const [contract, setContract] = useState<SimpleStorageWrapper>();
    const [contract, setContract] = useState<MultiSenderWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [txFee, setTxFee] = useState<number | undefined>();
    const [receiverAddr, setReceiverAddr] = useState<string | undefined>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [newTxFeeInputValue, setNewTxFeeInputValue] = useState<number | undefined>();
    const [newReceiverAddrInputValue, setNewReceiverAddrInputValue] = useState<
        string | undefined
    >();
    const [tokenAddr, setTokenAddr] = useState<string | undefined>();
    const [toAddr, setToAddr] = useState<string[] | undefined>();
    const [valueEach, setValueEach] = useState<number | undefined>();
    const [valueFee, setValueFee] = useState<number | undefined>();

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployContract() {
        // const _contract = new SimpleStorageWrapper(web3);
        const _contract = new MultiSenderWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);

            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function getTxFee() {
        const value = await contract.getTxFee(account);
        toast('Successfully read transaction fee.', { type: 'success' });
        setTxFee(value);
    }

    async function getReceiverAddr() {
        const addr = await contract.getReceiverAddress(account);
        toast('Successfully get receiver address.', { type: 'success' });
        setReceiverAddr(addr);
    }

    async function setExistingContractAddress(contractAddress: string) {
        // const _contract = new SimpleStorageWrapper(web3);
        const _contract = new MultiSenderWrapper(web3);

        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setTxFee(undefined);
    }

    async function setNewTxFee() {
        try {
            setTransactionInProgress(true);
            await contract.setTxFee(newTxFeeInputValue, account);
            toast(
                'Successfully set new transaction fee. You can refresh the read value now manually.',
                { type: 'success' }
            );
            getTxFee();
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function setNewReceiverAddress() {
        try {
            setTransactionInProgress(true);
            await contract.setReceiverAddress(newReceiverAddrInputValue, account);
            toast(
                'Successfully set new receiver dddress. You can refresh the read value now manually.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function airdrop() {
        try {
            const _tokenContract = new IERC20Wrapper(web3);
            _tokenContract.useDeployed(tokenAddr.trim());
            setTransactionInProgress(true);
            const amount = valueEach * toAddr.length;
            console.log(toAddr);
            console.log(valueFee);
            await _tokenContract.approve(contract.address, amount, account);
            toast('Successfully approve token for this contract.', {
                type: 'success'
            });
            await contract.mutiSendCoinWithSameValue(
                tokenAddr,
                toAddr,
                valueEach,
                account,
                valueFee ? valueFee : 0
            );
            toast('Successfully airdrop token.', {
                type: 'success'
            });
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function withdrawTxFee() {
        try {
            setTransactionInProgress(true);
            await contract.withDrawFee(account);
            toast('Successfully withdraw transaction fee to receiver address.', {
                type: 'success'
            });
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            Deploy transaction hash: <b>{deployTxHash || '-'}</b>
            <br />
            <hr />
            <p>
                The button below will deploy an Airdrop smart contract where you can use to airdrop
                erc20 standard token to multiple addresses. Also, you can set transaction fee for
                the application. By default the transaction fee is set to 0.
            </p>
            <button className="btn-1" onClick={deployContract} disabled={!l2Balance}>
                Deploy contract
            </button>
            &nbsp;or&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={(e) => setExistingContractIdInputValue(e.target.value)}
            />
            &nbsp;&nbsp;
            <button
                className="btn-1"
                disabled={!existingContractIdInputValue || !l2Balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            <button className="btn-1" onClick={getTxFee} disabled={!contract}>
                Get Tx Fee
            </button>
            {txFee !== undefined ? <>&nbsp;&nbsp;Transaction Fee: {txFee.toString()}</> : null}
            <br />
            <br />
            <input
                type="number"
                placeholder="Transaction Fee"
                onChange={(e) => setNewTxFeeInputValue(parseInt(e.target.value, 10))}
            />
            &nbsp;&nbsp;
            <button className="btn-1" onClick={setNewTxFee} disabled={!contract}>
                Set new Tx Fee
            </button>
            <br />
            <br />
            <button className="btn-1" onClick={getReceiverAddr} disabled={!contract}>
                Get Receiver Address
            </button>
            {receiverAddr !== undefined ? <>&nbsp;&nbsp;Receiver Address: {receiverAddr}</> : null}
            <br />
            <br />
            <input
                placeholder="Fee receiver address"
                type="text"
                onChange={(e) => setNewReceiverAddrInputValue(e.target.value)}
            />
            &nbsp;&nbsp;
            <button className="btn-1" onClick={setNewReceiverAddress} disabled={!contract}>
                Set new Receiver Address
            </button>
            <br />
            <br />
            <label>ERC20 standard token address &nbsp;&nbsp;</label>
            <input
                type="text"
                placeholder="Token address"
                onChange={(e) => setTokenAddr(e.target.value)}
            />
            <br />
            <label>Airdrop addresses as form of array &nbsp;&nbsp;</label>
            <input
                type="text"
                placeholder="Example: '0x....','0x....'"
                onChange={(e) => setToAddr(JSON.parse(e.target.value))}
            />
            <br />
            <label>Number of token that each address will receive &nbsp;&nbsp;</label>
            <input
                type="text"
                placeholder="token amount"
                onChange={(e) => setValueEach(parseInt(e.target.value, 10))}
            />
            <br />
            <label>Transaction fee &nbsp;&nbsp;</label>
            <input
                type="text"
                placeholder="Platform tx fee (default is 0)"
                onChange={(e) => setValueFee(parseInt(e.target.value, 10))}
            />
            <br />
            <button className="btn-1" onClick={airdrop} disabled={!contract}>
                Airdrop Token
            </button>
            <br />
            <br />
            <p>Withdraw transaction fee to receiver address</p>
            <p>***Only Contract Owner can call this function***</p>
            <button className="btn-1" onClick={withdrawTxFee} disabled={!contract}>
                Withdraw TxFee
            </button>
            <br />
            <br />
            <hr />
            The contract is deployed on Nervos Layer 2 - Godwoken + Polyjuice. After each
            transaction you might need to wait up to 120 seconds for the status to be reflected.
            <ToastContainer />
        </div>
    );
}
