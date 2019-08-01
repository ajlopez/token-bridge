pragma solidity ^0.4.24;

import "./zeppelin/token/ERC20/ERC20.sol";
import "./Transferable.sol";

contract Bridge is Transferable {
    address public owner;
    address public manager;
    ERC20 public token;
    uint16 public noEvents;
    
    mapping (address => address) mappedAddresses;

    event TransferTo(address indexed receiver, uint256 value);
    event TransferToMany(address[] indexed receivers, uint256[] values);

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    
    modifier onlyManager() {
        require(msg.sender == manager);
        _;
    }
    
    constructor(address _manager, ERC20 _token) public {
        owner = msg.sender;
        manager = _manager;
        token = _token;
    }
    
    function setNoEvents(uint16 value) public onlyOwner {
        noEvents = value;
    }
    
    function acceptTransfer(address receiver, uint256 amount) public onlyManager returns(bool) {
        return token.transfer(receiver, amount);
    }
    
    function changeManager(address newmanager) public onlyManager {
        require(newmanager != address(0));
        
        manager = newmanager;
    }
    
    function tokenFallback(address from, uint256 amount, bytes data) public view returns (bool) {
        require(msg.sender == address(token));
        return true;
    }
    
    function mapAddress(address to) public {
        mappedAddresses[msg.sender] = to;
    }
    
    function getMappedAddress(address account) public view returns (address) {
        address mapped = mappedAddresses[account];
        
        if (mapped == address(0))
            return account;
            
        return mapped;
    }
    
    function receiveTokens(uint256 amount) public returns (bool) {
        if (!token.transferFrom(msg.sender, address(this), amount))
            return false;
            
        if (noEvents > 0)
            return true;
            
        address receiver = getMappedAddress(msg.sender);
        
        emit TransferTo(receiver, amount);
        
        return true;
    }
}

