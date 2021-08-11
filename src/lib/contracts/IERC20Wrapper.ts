import Web3 from 'web3';
import * as IERC20JSON from '../../../build/contracts/IERC20.json';
import { IERC20 } from '../../types/IERC20';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class IERC20Wrapper {
    web3: Web3;

    tokenContractInterface: IERC20;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.tokenContractInterface = new web3.eth.Contract(IERC20JSON.abi as any) as any;
    }


    async approve(contractAddress:string,amount:number,fromAddress: string){
         const tx = await this.tokenContractInterface.methods.approve(contractAddress, amount).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });;

        return tx;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.tokenContractInterface.options.address = contractAddress;
    }

}
