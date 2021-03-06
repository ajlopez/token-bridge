pragma solidity ^0.4.24;

import "./zeppelin/token/ERC20/DetailedERC20.sol";
import "./zeppelin/token/ERC20/StandardToken.sol";
import "./Transferable.sol";

contract SideToken is DetailedERC20, StandardToken, Transferable {
    address public manager;
    
    modifier onlyManager() {
        require(msg.sender == manager);
        _;
    }

    constructor(string _name, string _symbol, uint8 _decimals, address _manager) 
        DetailedERC20(_name, _symbol, _decimals)
        public {
        manager = _manager;
    }
    
    function changeManager(address newmanager) public onlyManager {
        require(newmanager != address(0));
        
        manager = newmanager;
    }

    function acceptTransfer(address receiver, uint256 amount) public onlyManager returns(bool) {
        totalSupply_ += amount;
        balances[receiver] += amount;
        
        emit Transfer(manager, receiver, amount);
        
        return true;
    }
    
    function transfer(address receiver, uint amount) public returns(bool) {
        bool result = super.transfer(receiver, amount);

        if (result && receiver == manager) {
            balances[manager] -= amount;
            totalSupply_ -= amount;
        }
            
        return result;
    }
}

