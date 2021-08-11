import Web3 from 'web3';
import * as MultiSenderJSON from '../../../build/contracts/MultiSender.json';
import {MultiSender} from '../../types/MultiSender';
const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class MultiSenderWrapper {
    web3: Web3;

    contract: MultiSender;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(MultiSenderJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    
    //     txFee(): NonPayableTransactionObject<string>;
    async getTxFee(fromAddress: string) {
        const data = await this.contract.methods.txFee().call({ from: fromAddress });

        return parseInt(data, 10);
    }

    // getReceiverAddress(): NonPayableTransactionObject<string>;
    async getReceiverAddress(fromAddress: string) {
        const data = await this.contract.methods.getReceiverAddress().call({ from: fromAddress });

        return data;
    }

    // setReceiverAddress(_addr: string): NonPayableTransactionObject<void>;
    async setReceiverAddress(receiverAddress: string, fromAddress: string) {
        const tx = await this.contract.methods.setReceiverAddress(receiverAddress).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    // withDrawFee(): NonPayableTransactionObject<void>;
    async withDrawFee(fromAddress: string) {
        const tx = await this.contract.methods.withDrawFee().send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }
    
    async setTxFee(fee: number, fromAddress: string) {
        const tx = await this.contract.methods.setTxFee(fee).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress,
    
        });

        return tx;
    }

    //  mutiSendCoinWithSameValue(
    //   _tokenAddress: string,
    //   _to: string[],
    //   _value: number | string | BN
    // ): PayableTransactionObject<void>;

    async mutiSendCoinWithSameValue(tokenAddress: string, to: string[], tokenValue:number, fromAddress: string, value:number){

        const tx = await this.contract.methods.mutiSendCoinWithSameValue(tokenAddress,to,tokenValue).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress,
            value: value
        });

        return tx;
    }

    async deploy(fromAddress: string) {
        const deployTx = await (this.contract
            .deploy({
                data: MultiSenderJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(deployTx.contractAddress);

        return deployTx.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
