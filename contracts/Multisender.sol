// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MultiSender is Ownable {
    using SafeMath for uint;
    event LogTokenMultiSent(address token,uint256 total);
    event LogGetToken( address receiver, uint256 balance);
    address payable receiverAddress;
    uint public txFee = 0 ether;

    function getReceiverAddress() public view returns (address){
        if(receiverAddress == address(0)) {
            return owner();
        }

        return receiverAddress;
    }
    
    function setReceiverAddress(address payable _addr) onlyOwner public {
        require(_addr != address(0));
        receiverAddress = _addr;
    }
    
    /*
  *  get balance
  */
  function withDrawFee() onlyOwner public {
      uint balanceFee = address(this).balance;
      receiverAddress.transfer(balanceFee);
      emit LogGetToken(receiverAddress,balanceFee);
  }

    
     function setTxFee(uint _fee) onlyOwner public {
        txFee = _fee;
    }
    
    function coinSendSameValue(address _tokenAddress, address[] calldata _to, uint _value)  internal {
        uint sendValue = msg.value;
		require(_to.length <= 255);
		require(sendValue >= txFee);
		address from = msg.sender;
		uint256 sendAmount = _to.length.sub(1).mul(_value);

        IERC20 token = IERC20(_tokenAddress);		
		for (uint8 i = 1; i < _to.length; i++) {
			token.transferFrom(from, _to[i], _value);
		}
   
	    emit LogTokenMultiSent(_tokenAddress,sendAmount);

	}
	
	 /*
        Send coin with the same value by a implicit call method
    */

	function mutiSendCoinWithSameValue(address _tokenAddress, address[] calldata  _to, uint _value)  payable public {
	    coinSendSameValue(_tokenAddress, _to, _value);
	}
	


}