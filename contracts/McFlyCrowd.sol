pragma solidity ^0.4.21;

import "./SafeMath.sol";
import "./McFlyToken.sol";
import "./Haltable.sol";
import "./MultiOwners.sol";

/**
 * @title McFly crowdsale smart contract 
 * @author Copyright (c) 2018 McFly.aero
 * @author Dmitriy Khizhinskiy
 * @author "MIT"
 * @dev inherited from MultiOwners & Haltable
 */
contract McFlyCrowd is MultiOwners, Haltable {
    using SafeMath for uint256;

    /// @dev Total ETH received during WAVES, TLP1.2 & window[1-5]
    uint256 public counter_in; // tlp2
    
    /// @dev minimum ETH to partisipate in window 1-5
    uint256 public minETHin = 1e18; // 1 ETH

    /// @dev Token
    McFlyToken public token;

    /// @dev Withdraw wallet
    address public wallet;

    /// @dev start and end timestamp for TLP 1.2, other values callculated
    uint256 public sT2; // startTimeTLP2
    uint256 constant dTLP2 = 118 days; // days of TLP2
    uint256 constant dBt = 60 days; // days between Windows
    uint256 constant dW = 12 days; // 12 days for 3,4,5,6,7 windows;

    /// @dev Cap maximum possible tokens for minting
    uint256 public constant hardCapInTokens = 1800e24; // 1,800,000,000 MFL

    /// @dev maximum possible tokens for sell 
    uint256 public constant mintCapInTokens = 1260e24; // 1,260,000,000 MFL

    /// @dev tokens crowd within TLP2
    uint256 public crowdTokensTLP2;

    uint256 public _preMcFly;

    /// @dev maximum possible tokens for fund minting
    uint256 constant fundTokens = 270e24; // 270,000,000 MFL
    uint256 public fundTotalSupply;
    address public fundMintingAgent;

    /// @dev maximum possible tokens to convert from WAVES
    uint256 constant wavesTokens = 100e24; // 100,000,000 MFL
    address public wavesAgent;
    address public wavesGW;

    /// @dev Vesting param for team, advisory, reserve.
    uint256 constant VestingPeriodInSeconds = 30 days; // 24 month
    uint256 constant VestingPeriodsCount = 24;

    /// @dev Team 10%
    uint256 constant _teamTokens = 180e24;
    uint256 public teamTotalSupply;
    address public teamWallet;

    /// @dev Bounty 5% (2% + 3%)
    /// @dev Bounty online 2%
    uint256 constant _bountyOnlineTokens = 36e24;
    address public bountyOnlineWallet;
    address public bountyOnlineGW;

    /// @dev Bounty offline 3%
    uint256 constant _bountyOfflineTokens = 54e24;
    address public bountyOfflineWallet;

    /// @dev Advisory 5%
    uint256 constant _advisoryTokens = 90e24;
    uint256 public advisoryTotalSupply;
    address public advisoryWallet;

    /// @dev Reserved for future 9%
    uint256 constant _reservedTokens = 162e24;
    uint256 public reservedTotalSupply;
    address public reservedWallet;

    /// @dev AirDrop 1%
    uint256 constant _airdropTokens = 18e24;
    address public airdropWallet;
    address public airdropGW;

    /// @dev PreMcFly wallet (MFL)
    address public preMcFlyWallet;

    /// @dev Ppl structure for Win1-5
    struct Ppl {
        address addr;
        uint256 amount;
    }
    mapping (uint32 => Ppl) public ppls;

    /// @dev Window structure for Win1-5
    struct Window {
        bool active;
        uint256 totalEthInWindow;
        uint32 totalTransCnt;
        uint32 refundIndex;
        uint256 tokenPerWindow;
    } 
    mapping (uint8 => Window) public ww;


    /// @dev Events
    event TokenPurchase(address indexed beneficiary, uint256 value, uint256 amount);
    event TokenPurchaseInWindow(address indexed beneficiary, uint256 value, uint8 winnum, uint32 totalcnt, uint256 totaleth1);
    event TransferOddEther(address indexed beneficiary, uint256 value);
    event FundMinting(address indexed beneficiary, uint256 value);
    event WithdrawVesting(address indexed beneficiary, uint256 period, uint256 value, uint256 valueTotal);
    event TokenWithdrawAtWindow(address indexed beneficiary, uint256 value);
    event SetFundMintingAgent(address newAgent);
    event SetTeamWallet(address newTeamWallet);
    event SetAdvisoryWallet(address newAdvisoryWallet);
    event SetReservedWallet(address newReservedWallet);
    event SetStartTimeTLP2(uint256 newStartTimeTLP2);
    event SetMinETHincome(uint256 newMinETHin);
    event NewWindow(uint8 winNum, uint256 amountTokensPerWin);
    event TokenETH(uint256 totalEth, uint32 totalCnt);


    /// @dev check for Non zero value
    modifier validPurchase() {
        require(msg.value != 0);
        _;        
    }

    // comment this functions after test passed !!
    /*function getPpls(uint32 index) constant public returns (uint256) {
        return (ppls[index].amount);
    }
    function getPplsAddr(uint32 index) constant public returns (address) {
        return (ppls[index].addr);
    }
    function getWtotalEth(uint8 winNum) constant public returns (uint256) {
        return (ww[winNum].totalEthInWindow);
    }
    function getWtoken(uint8 winNum) constant public returns (uint256) {
        return (ww[winNum].tokenPerWindow);
    }
    function getWactive(uint8 winNum) constant public returns (bool) {
        return (ww[winNum].active);
    }
    function getWtotalTransCnt(uint8 winNum) constant public returns (uint32) {
        return (ww[winNum].totalTransCnt);
    }
    function getWrefundIndex(uint8 winNum) constant public returns (uint32) {
        return (ww[winNum].refundIndex);
    }*/
    // END comment this functions after test passed !!


    /**
     * @dev conctructor of contract, set main params, create new token, do minting for some wallets
     * @param _startTimeTLP2 - set date time of starting of TLP2 (main date!)
     * @param _preMcFlyTotalSupply - set amount in wei total supply of previouse contract (MFL)
     * @param _wallet - wallet for transfer ETH to it
     * @param _wavesAgent - wallet for WAVES gw
     * @param _wavesGW    - wallet for WAVES gw
     * @param _fundMintingAgent - wallet who allowed to mint before TLP2
     * @param _teamWallet - wallet for team vesting
     * @param _bountyOnlineWallet - wallet for online bounty
     * @param _bountyOnlineGW - wallet for online bounty GW
     * @param _bountyOfflineWallet - wallet for offline bounty
     * @param _advisoryWallet - wallet for advisory vesting
     * @param _reservedWallet - wallet for reserved vesting
     * @param _airdropWallet - wallet for airdrop
     * @param _airdropGW - wallet for airdrop GW
     * @param _preMcFlyWallet - wallet for transfer old MFL->McFly (once)
     */
    function McFlyCrowd(
        uint256 _startTimeTLP2,
        uint256 _preMcFlyTotalSupply,
        address _wallet,
        address _wavesAgent,
        address _wavesGW,
        address _fundMintingAgent,
        address _teamWallet,
        address _bountyOnlineWallet,
        address _bountyOnlineGW,
        address _bountyOfflineWallet,
        address _advisoryWallet,
        address _reservedWallet,
        address _airdropWallet,
        address _airdropGW,
        address _preMcFlyWallet
    ) public 
    {   
        require(_startTimeTLP2 >= block.timestamp);
        require(_preMcFlyTotalSupply > 0);
        require(_wallet != 0x0);
        require(_wavesAgent != 0x0);
        require(_wavesGW != 0x0);
        require(_fundMintingAgent != 0x0);
        require(_teamWallet != 0x0);
        require(_bountyOnlineWallet != 0x0);
        require(_bountyOnlineGW != 0x0);
        require(_bountyOfflineWallet != 0x0);
        require(_advisoryWallet != 0x0);
        require(_reservedWallet != 0x0);
        require(_airdropWallet != 0x0);
        require(_airdropGW != 0x0);
        require(_preMcFlyWallet != 0x0);

        token = new McFlyToken();

        wallet = _wallet;

        sT2 = _startTimeTLP2;

        wavesAgent = _wavesAgent;
        wavesGW = _wavesGW;

        fundMintingAgent = _fundMintingAgent;

        teamWallet = _teamWallet;
        bountyOnlineWallet = _bountyOnlineWallet;
        bountyOnlineGW = _bountyOnlineGW;
        bountyOfflineWallet = _bountyOfflineWallet;
        advisoryWallet = _advisoryWallet;
        reservedWallet = _reservedWallet;
        airdropWallet = _airdropWallet;
        airdropGW = _airdropGW;
        preMcFlyWallet = _preMcFlyWallet;

        /// @dev Mint all tokens and than control it by vesting
        _preMcFly = _preMcFlyTotalSupply;
        token.mint(preMcFlyWallet, _preMcFly); // McFly for thansfer to old MFL owners
        token.allowTransfer(preMcFlyWallet);
        crowdTokensTLP2 = crowdTokensTLP2.add(_preMcFly);

        token.mint(wavesAgent, wavesTokens); // 100,000,000 MFL
        token.allowTransfer(wavesAgent);
        token.allowTransfer(wavesGW);
        crowdTokensTLP2 = crowdTokensTLP2.add(wavesTokens);

        token.mint(this, _teamTokens); // mint to contract address

        token.mint(bountyOnlineWallet, _bountyOnlineTokens);
        token.allowTransfer(bountyOnlineWallet);
        token.allowTransfer(bountyOnlineGW);

        token.mint(bountyOfflineWallet, _bountyOfflineTokens);
        token.allowTransfer(bountyOfflineWallet);

        token.mint(this, _advisoryTokens);

        token.mint(this, _reservedTokens);

        token.mint(airdropWallet, _airdropTokens);
        token.allowTransfer(airdropWallet);
        token.allowTransfer(airdropGW);
    }


    /**
     * @dev check is TLP2 is active?
     * @return false if crowd TLP2 event was ended
     */
    function withinPeriod() constant public returns (bool) {
        bool withinPeriodTLP2 = (now >= sT2 && now <= (sT2+dTLP2));
        return withinPeriodTLP2;
    }


    /**
     * @dev check is TLP2 is active and minting Not finished
     * @return false if crowd event was ended
     */
    function running() constant public returns (bool) {
        return withinPeriod() && !token.mintingFinished();
    }


    /**
     * @dev check current stage name
     * @return uint8 stage number
     */
    function stageName() constant public returns (uint8) {
        uint256 eT2 = sT2+dTLP2;

        if (now < sT2) {return 101;} // not started
        if (now >= sT2 && now <= eT2) {return (102);} // TLP1.2

        if (now > eT2 && now < eT2+dBt) {return (103);} // preTLP1.3
        if (now >= (eT2+dBt) && now <= (eT2+dBt+dW)) {return (0);} // TLP1.3
        if (now > (eT2+dBt+dW) && now < (eT2+dBt+dW+dBt)) {return (104);} // preTLP1.4
        if (now >= (eT2+dBt+dW+dBt) && now <= (eT2+dBt+dW+dBt+dW)) {return (1);} // TLP1.4
        if (now > (eT2+dBt+dW+dBt+dW) && now < (eT2+dBt+dW+dBt+dW+dBt)) {return (105);} // preTLP1.5
        if (now >= (eT2+dBt+dW+dBt+dW+dBt) && now <= (eT2+dBt+dW+dBt+dW+dBt+dW)) {return (2);} // TLP1.5
        if (now > (eT2+dBt+dW+dBt+dW+dBt+dW) && now < (eT2+dBt+dW+dBt+dW+dBt+dW+dBt)) {return (106);} // preTLP1.6
        if (now >= (eT2+dBt+dW+dBt+dW+dBt+dW+dBt) && now <= (eT2+dBt+dW+dBt+dW+dBt+dW+dBt+dW)) {return (3);} // TLP1.6
        if (now > (eT2+dBt+dW+dBt+dW+dBt+dW+dBt+dW) && now < (eT2+dBt+dW+dBt+dW+dBt+dW+dBt+dW+dBt)) {return (107);} // preTLP1.7
        if (now >= (eT2+dBt+dW+dBt+dW+dBt+dW+dBt+dW+dBt) && now <= (eT2+dBt+dW+dBt+dW+dBt+dW+dBt+dW+dBt+dW)) {return (4);} // TLP1.7"
        if (now > (eT2+dBt+dW+dBt+dW+dBt+dW+dBt+dW+dBt+dW)) {return (200);} // Finished
        return (201); // unknown
    }


    /** 
     * @dev change agent for minting
     * @param agent - new agent address
     */
    function setFundMintingAgent(address agent) onlyOwner public {
        fundMintingAgent = agent;
        SetFundMintingAgent(agent);
    }


    /** 
     * @dev change wallet for team vesting (this make possible to set smart-contract address later)
     * @param _newTeamWallet - new wallet address
     */
    function setTeamWallet(address _newTeamWallet) onlyOwner public {
        teamWallet = _newTeamWallet;
        SetTeamWallet(_newTeamWallet);
    }


    /** 
     * @dev change wallet for advisory vesting (this make possible to set smart-contract address later)
     * @param _newAdvisoryWallet - new wallet address
     */
    function setAdvisoryWallet(address _newAdvisoryWallet) onlyOwner public {
        advisoryWallet = _newAdvisoryWallet;
        SetAdvisoryWallet(_newAdvisoryWallet);
    }


    /** 
     * @dev change wallet for reserved vesting (this make possible to set smart-contract address later)
     * @param _newReservedWallet - new wallet address
     */
    function setReservedWallet(address _newReservedWallet) onlyOwner public {
        reservedWallet = _newReservedWallet;
        SetReservedWallet(_newReservedWallet);
    }


    /**
     * @dev change min ETH income during Window1-5
     * @param _minETHin - new limit
     */
    function setMinETHin(uint256 _minETHin) onlyOwner public {
        minETHin = _minETHin;
        SetMinETHincome(_minETHin);
    }


    /**
     * @dev set TLP1.X (2-7) start & end dates
     * @param _at - new or old start date
     */
    function setStartEndTimeTLP(uint256 _at) onlyOwner public {
        require(block.timestamp < sT2); // forbid change time when TLP1.2 is active
        require(block.timestamp < _at); // should be great than current block timestamp

        sT2 = _at;
        SetStartTimeTLP2(_at);
    }


    /**
     * @dev Large Token Holder minting 
     * @param to - mint to address
     * @param amount - how much mint
     */
    function fundMinting(address to, uint256 amount) stopInEmergency public {
        require(msg.sender == fundMintingAgent || isOwner());
        require(block.timestamp < sT2);
        require(fundTotalSupply.add(amount) <= fundTokens);
        require(token.totalSupply().add(amount) <= hardCapInTokens);

        fundTotalSupply = fundTotalSupply.add(amount);
        token.mint(to, amount);
        FundMinting(to, amount);
    }


    /**
     * @dev calculate amount
     * @param  amount - ether to be converted to tokens
     * @param  at - current time
     * @param  _totalSupply - total supplied tokens
     * @return tokens amount that we should send to our dear ppl
     * @return odd ethers amount, which contract should send back
     */
    function calcAmountAt(
        uint256 amount,
        uint256 at,
        uint256 _totalSupply
    ) public constant returns (uint256, uint256) 
    {
        uint256 estimate;
        uint256 price;
        
        if (at >= sT2 && at <= (sT2+dTLP2)) {
            if (at <= sT2 + 15 days) {price = 12e13;} else if (at <= sT2 + 30 days) {
                price = 14e13;} else if (at <= sT2 + 45 days) {
                    price = 16e13;} else if (at <= sT2 + 60 days) {
                        price = 18e13;} else if (at <= sT2 + 75 days) {
                            price = 20e13;} else if (at <= sT2 + 90 days) {
                                price = 22e13;} else if (at <= sT2 + 105 days) {
                                    price = 24e13;} else if (at <= sT2 + 118 days) {
                                        price = 26e13;} else {revert();}
        } else {revert();}

        estimate = _totalSupply.add(amount.mul(1e18).div(price));

        if (estimate > hardCapInTokens) {
            return (
                hardCapInTokens.sub(_totalSupply),
                estimate.sub(hardCapInTokens).mul(price).div(1e18)
            );
        }
        return (estimate.sub(_totalSupply), 0);
    }


    /**
     * @dev fallback for processing ether
     */
    function() external payable {
        return getTokens(msg.sender);
    }


    /**
     * @dev sell token and send to contributor address
     * @param contributor address
     */
    function getTokens(address contributor) payable stopInEmergency validPurchase public {
        uint256 amount;
        uint256 oddEthers;
        uint256 ethers;
        uint256 _at;
        uint8 _winNum;

        _at = block.timestamp;

        require(contributor != 0x0);
       
        if (withinPeriod()) {
        
            (amount, oddEthers) = calcAmountAt(msg.value, _at, token.totalSupply());
  
            require(amount.add(token.totalSupply()) <= hardCapInTokens);

            ethers = msg.value.sub(oddEthers);

            token.mint(contributor, amount); // fail if minting is finished
            TokenPurchase(contributor, ethers, amount);
            counter_in = counter_in.add(ethers);
            crowdTokensTLP2 = crowdTokensTLP2.add(amount);

            if (oddEthers > 0) {
                require(oddEthers < msg.value);
                contributor.transfer(oddEthers);
                TransferOddEther(contributor, oddEthers);
            }

            wallet.transfer(ethers);
        } else {
            require(msg.value >= minETHin); // checks min ETH income
            _winNum = stageName();
            require(_winNum >= 0 && _winNum < 5);
            Window storage w = ww[_winNum];

            require(w.tokenPerWindow > 0); // check that we have tokens!

            w.totalEthInWindow = w.totalEthInWindow.add(msg.value);
            ppls[w.totalTransCnt].addr = contributor;
            ppls[w.totalTransCnt].amount = msg.value;
            w.totalTransCnt++;
            TokenPurchaseInWindow(contributor, msg.value, _winNum, w.totalTransCnt, w.totalEthInWindow);
        }
    }


    /**
     * @dev close Window and transfer Eth to wallet address
     * @param _winNum - number of window 0-4 to close
     */
    function closeWindow(uint8 _winNum) onlyOwner stopInEmergency public {
        require(ww[_winNum].active);
        ww[_winNum].active = false;

        wallet.transfer(this.balance);
    }


    /**
     * @dev transfer tokens to ppl accts (window1-5)
     * @param _winNum - number of window 0-4 to close
     */
    function sendTokensWindow(uint8 _winNum) onlyOwner stopInEmergency public {
        uint256 _tokenPerETH;
        uint256 _tokenToSend = 0;
        address _tempAddr;
        uint32 index = ww[_winNum].refundIndex;

        TokenETH(ww[_winNum].totalEthInWindow, ww[_winNum].totalTransCnt);

        require(ww[_winNum].active);
        require(ww[_winNum].totalEthInWindow > 0);
        require(ww[_winNum].totalTransCnt > 0);

        _tokenPerETH = ww[_winNum].tokenPerWindow.div(ww[_winNum].totalEthInWindow); // max McFly in window / ethInWindow

        while (index < ww[_winNum].totalTransCnt && gasleft() > 100000) {
            _tokenToSend = _tokenPerETH.mul(ppls[index].amount);
            ppls[index].amount = 0;
            _tempAddr = ppls[index].addr;
            ppls[index].addr = 0;
            index++;
            token.transfer(_tempAddr, _tokenToSend);
            TokenWithdrawAtWindow(_tempAddr, _tokenToSend);
        }
        ww[_winNum].refundIndex = index;
    }


    /**
     * @dev open new window 0-5 and write totl token per window in structure
     * @param _winNum - number of window 0-4 to close
     * @param _tokenPerWindow - total token for window 0-4
     */
    function newWindow(uint8 _winNum, uint256 _tokenPerWindow) private {
        ww[_winNum] = Window(true, 0, 0, 0, _tokenPerWindow);
        NewWindow(_winNum, _tokenPerWindow);
    }


    /**
     * @dev Finish crowdsale TLP1.2 period and open window1-5 crowdsale
     */
    function finishCrowd() onlyOwner public {
        uint256 _tokenPerWindow;
        require(now > (sT2.add(dTLP2)) || hardCapInTokens == token.totalSupply());
        require(!token.mintingFinished());

        _tokenPerWindow = (mintCapInTokens.sub(crowdTokensTLP2).sub(fundTotalSupply)).div(5);
        token.mint(this, _tokenPerWindow.mul(5)); // mint to contract address
        // shoud be MAX tokens minted!!! 1,800,000,000
        for (uint8 y = 0; y < 5; y++) {
            newWindow(y, _tokenPerWindow);
        }

        token.finishMinting();
    }


    /**
     * @dev withdraw tokens amount within vesting rules for team, advisory and reserved
     * @param withdrawWallet - wallet to transfer tokens
     * @param withdrawTokens - amount of tokens to transfer to
     * @param withdrawTotalSupply - total amount of tokens transfered to account
     * @return unit256 total amount of tokens after transfer
     */
    function vestingWithdraw(address withdrawWallet, uint256 withdrawTokens, uint256 withdrawTotalSupply) private returns (uint256) {
        require(token.mintingFinished());
        require(msg.sender == withdrawWallet || isOwner());

        uint256 currentPeriod = (block.timestamp.sub(sT2.add(dTLP2))).div(VestingPeriodInSeconds);
        if (currentPeriod > VestingPeriodsCount) {
            currentPeriod = VestingPeriodsCount;
        }
        uint256 tokenAvailable = withdrawTokens.mul(currentPeriod).div(VestingPeriodsCount).sub(withdrawTotalSupply);  // RECHECK!!!!!

        require((withdrawTotalSupply.add(tokenAvailable)) <= withdrawTokens);

        uint256 _withdrawTotalSupply = withdrawTotalSupply.add(tokenAvailable);

        token.transfer(withdrawWallet, tokenAvailable);
        WithdrawVesting(withdrawWallet, currentPeriod, tokenAvailable, _withdrawTotalSupply);

        return _withdrawTotalSupply;
    }


    /**
     * @dev withdraw tokens amount within vesting rules for team
     */
    function teamWithdraw() public {
        teamTotalSupply = vestingWithdraw(teamWallet, _teamTokens, teamTotalSupply);
    }


    /**
     * @dev withdraw tokens amount within vesting rules for advisory
     */
    function advisoryWithdraw() public {
        advisoryTotalSupply = vestingWithdraw(advisoryWallet, _advisoryTokens, advisoryTotalSupply);
    }


    /**
     * @dev withdraw tokens amount within vesting rules for reserved wallet
     */
    function reservedWithdraw() public {
        reservedTotalSupply = vestingWithdraw(reservedWallet, _reservedTokens, reservedTotalSupply);
    }
}
