// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ChainMind Token (MIND)
 * @dev ERC20 token for the ChainMind decentralized AI compute marketplace
 * Features:
 * - Standard ERC20 functionality
 * - Permit functionality for gasless approvals
 * - Voting functionality for governance
 * - Mintable by owner (for initial distribution and rewards)
 * - Burnable for deflationary mechanics
 */
contract ChainMindToken is ERC20, ERC20Permit, ERC20Votes, Ownable, ReentrancyGuard {
    
    /// @dev Maximum total supply of tokens (1 billion MIND)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    /// @dev Fee collection address
    address public feeCollector;
    
    /// @dev Mapping to track authorized minters
    mapping(address => bool) public authorizedMinters;
    
    // Events
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);
    event MinterAuthorized(address indexed minter, bool authorized);
    event TokensBurned(address indexed from, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);

    /**
     * @dev Constructor
     * @param _initialOwner Initial owner of the contract
     * @param _feeCollector Address that will collect fees
     * @param _initialSupply Initial supply to mint to the owner
     */
    constructor(
        address _initialOwner,
        address _feeCollector,
        uint256 _initialSupply
    ) 
        ERC20("ChainMind Token", "MIND") 
        ERC20Permit("ChainMind Token")
        Ownable(_initialOwner)
    {
        require(_initialOwner != address(0), "ChainMind: invalid owner");
        require(_feeCollector != address(0), "ChainMind: invalid fee collector");
        require(_initialSupply <= MAX_SUPPLY, "ChainMind: exceeds max supply");
        
        feeCollector = _feeCollector;
        
        if (_initialSupply > 0) {
            _mint(_initialOwner, _initialSupply);
            emit TokensMinted(_initialOwner, _initialSupply);
        }
    }

    /**
     * @dev Mint tokens to a specified address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        require(
            owner() == _msgSender() || authorizedMinters[_msgSender()],
            "ChainMind: not authorized to mint"
        );
        require(to != address(0), "ChainMind: mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "ChainMind: exceeds max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burn tokens from the caller's balance
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) external {
        require(balanceOf(_msgSender()) >= amount, "ChainMind: insufficient balance");
        
        _burn(_msgSender(), amount);
        emit TokensBurned(_msgSender(), amount);
    }

    /**
     * @dev Burn tokens from a specified address (requires allowance)
     * @param from The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) external {
        require(from != address(0), "ChainMind: burn from zero address");
        
        uint256 currentAllowance = allowance(from, _msgSender());
        require(currentAllowance >= amount, "ChainMind: insufficient allowance");
        
        _approve(from, _msgSender(), currentAllowance - amount);
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    /**
     * @dev Set fee collector address
     * @param _feeCollector New fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "ChainMind: invalid fee collector");
        
        address oldCollector = feeCollector;
        feeCollector = _feeCollector;
        
        emit FeeCollectorUpdated(oldCollector, _feeCollector);
    }

    /**
     * @dev Authorize or deauthorize a minter
     * @param minter The address to authorize/deauthorize
     * @param authorized Whether the address should be authorized
     */
    function setMinterAuthorization(address minter, bool authorized) external onlyOwner {
        require(minter != address(0), "ChainMind: invalid minter address");
        
        authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }

    /**
     * @dev Emergency function to recover any ERC20 tokens sent to this contract
     * @param token The token contract address
     * @param to The address to send the tokens to
     * @param amount The amount of tokens to recover
     */
    function recoverTokens(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        require(token != address(this), "ChainMind: cannot recover MIND tokens");
        require(to != address(0), "ChainMind: invalid recipient");
        
        IERC20(token).transfer(to, amount);
    }

    /**
     * @dev Get the current chain ID
     */
    function getChainId() external view returns (uint256) {
        return block.chainid;
    }

    // Override required functions for multiple inheritance

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
