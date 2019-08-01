pragma solidity ^0.4.24;

import "./zeppelin/token/ERC20/ERC20.sol";
import "./Transferable.sol";

contract Bridge is Transferable {
    address public owner;
    address public manager;
    ERC20 public token;
    uint16 public noEvents;
    
    mapping (address => address) mappedAddresses;
    
    struct Transfer {
        address receiver;
        uint256 amount;
    }
    
    Transfer[] public transfers;

    event TransferTo(address indexed receiver, uint256 value);
    event TransferToMany(address[] indexed receivers, uint256[] values);
    event TransferToMany2(Transfer[] transfers);
    event TransferToMany3(uint256[] data);

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
            
        address receiver = getMappedAddress(msg.sender);
        
        if (noEvents > 0)
            transfers.push(Transfer(receiver, amount));
        else
            emit TransferTo(receiver, amount);
        
        return true;
    }
    
    function getNoTransfers() public view returns (uint256) {
        return transfers.length;
    }
    
    function emitAllTransfers() public returns (bool) {
        Transfer[] memory trs = new Transfer[](transfers.length);
        
        for (uint k = 0; k < transfers.length; k++)
            trs[k] = transfers[k];
            
        emit TransferToMany2(trs);
        
        transfers.length = 0;
        
        return true;
    }
    
    function emitAllTransfers2() public returns (bool) {
        uint256[] memory data = new uint256[](transfers.length * 2);
        
        for (uint k = 0; k < transfers.length; k++) {
            data[k * 2] = uint256(transfers[k].receiver);
            data[k * 2 + 1] = transfers[k].amount;
        }
            
        emit TransferToMany3(data);
        
        transfers.length = 0;
        
        return true;
    }
}

