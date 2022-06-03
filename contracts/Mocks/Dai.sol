pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract Dai is ERC20, ERC20Detailed {
    constructor() public ERC20Detailed("DAI", "Dai Stablecoin", 18) {}

    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
