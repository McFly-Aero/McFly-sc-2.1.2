import increaseTime, { duration } from 'zeppelin-solidity/test/helpers/increaseTime';
import latestTime from 'zeppelin-solidity/test/helpers/latestTime';

import moment, { now } from 'moment';

var Token = artifacts.require("./McFlyToken.sol");
var Crowdsale = artifacts.require("./McFlyCrowd.sol");

var BigNumber = require('bignumber.js');

contract('Crowdsale', (accounts) => {
    let owner, token, sale;
    let startTimeTLP2, endTimeTLP2, startTimeW1, endTimeW1, startTimeW2, endTimeW2, startTimeW3, endTimeW3, startTimeW4, endTimeW4, startTimeW5, endTimeW5;
    let client1, client2, client3, client4;
    let wallet;
    let wavesAgent;
    let wavesGW;
    let fundMintingAgent;
    let teamWallet;
    let bountyOnlineWallet;
    let bountyOnlineGW;
    let bountyOfflineWallet;
    let advisoryWallet;
    let reservedWallet;
    let airdropWallet;
    let airdropGW;
    let preMcFlyWallet;
    let wavesTokens = 100e24;

    let preMcFlyTotalSupply = 55e24; // 55 000 000 preMcFly - test value
    let totalSupply = 1260e24;

    before(async () => {
        owner = web3.eth.accounts[0];
        client1 = web3.eth.accounts[1];
        client2 = web3.eth.accounts[2];
        client3 = web3.eth.accounts[3];
        client4 = web3.eth.accounts[4];

        wallet = web3.eth.accounts[5];
        wavesAgent = web3.eth.accounts[6];
        wavesGW = web3.eth.accounts[7];
        fundMintingAgent = web3.eth.accounts[8];
        teamWallet = web3.eth.accounts[9];
        bountyOnlineWallet = web3.eth.accounts[10];
        bountyOnlineGW = web3.eth.accounts[11];
        bountyOfflineWallet = web3.eth.accounts[12];
        advisoryWallet = web3.eth.accounts[13];
        reservedWallet = web3.eth.accounts[14];
        airdropWallet = web3.eth.accounts[15];
        airdropGW = web3.eth.accounts[16];
        preMcFlyWallet = web3.eth.accounts[17];
    });

    let balanceEqualTo = async (client, should_balance) => {
        let balance;

        balance = await token.balanceOf(client, {from: client});
        assert.equal((balance.toNumber()/1e18).toFixed(4), (should_balance/1e18).toFixed(4), `Token balance should be equal to ${should_balance}`);
    };

    let shouldHaveException = async (fn, error_msg) => {
        let has_error = false;

        try {
            await fn();
        } catch(err) {
            has_error = true;
        } finally {
            assert.equal(has_error, true, error_msg);
        }        

    }

    let check_constant = async (key, value, text) => {
        assert.equal(((await sale[key]()).toNumber()/1e18).toFixed(2), value, text)
    };

    let check_calcAmount = async (ethers, at, totalSupply, should_tokens, should_odd_ethers) => {
        should_tokens = ((should_tokens || 0)/1e18).toFixed(2);
        should_odd_ethers = ((should_odd_ethers || 0)/1e18).toFixed(2);

        let text = `Check MFL ${totalSupply/1e18} MFL + ${ethers/1e18} ETH -> ${should_tokens} MFL`;
        let textOdd = `Check odd ETH ${totalSupply/1e18} MFL + ${ethers/1e18} ETH -> ${should_odd_ethers} ETH`;

        let result = await sale.calcAmountAt(ethers, at, totalSupply);
        let tokens = (result[0].toNumber()/1e18).toFixed(2);
        let odd_ethers = (result[1].toNumber()/1e18).toFixed(2);

        assert.equal(tokens, should_tokens, text);
        assert.equal(odd_ethers, should_odd_ethers, textOdd);
    };

    let check_tlp = async (stageName, num) => {
        let result = (await sale.stageName());
        assert.equal(result.toNumber(),num);
    }

    beforeEach(async function () {
//        startTimeTLP2 = web3.eth.getBlock('latest').timestamp + duration.weeks(1);
        startTimeTLP2 = latestTime() + duration.weeks(1);

        sale = await Crowdsale.new(
            startTimeTLP2,
            preMcFlyTotalSupply,
            wallet,
            wavesAgent,
            wavesGW,
            fundMintingAgent,
            teamWallet,
            bountyOnlineWallet,
            bountyOnlineGW,
            bountyOfflineWallet,
            advisoryWallet,                                                             
            reservedWallet,
	        airdropWallet,
	        airdropGW,
	        preMcFlyWallet
        );
        token = await Token.at(await sale.token());
    })

    it("1.1 start -> Check balance of client1 and totalSupply mint after start contract", async () => {
        assert.equal((await token.balanceOf(client1)).toNumber(), 0, "balanceOf must be 0 on the start");
        assert.equal((await token.totalSupply()).toNumber(), 695e24, "totalSupply must be 695 on the start"
        );
    });

    it("1.2 start -> check correct amount of tokens minted to wallets at start", async() => {
        assert.equal((36000000).toFixed(4), ((await token.balanceOf(bountyOnlineWallet))/1e18).toFixed(4), 'bounty online wallet balance');
        assert.equal((0).toFixed(4), ((await token.balanceOf(bountyOnlineGW))/1e18).toFixed(4), 'bounty online GW wallet balance');
        assert.equal((54000000).toFixed(4), ((await token.balanceOf(bountyOfflineWallet))/1e18).toFixed(4), 'bounty offline wallet balance');
        assert.equal((18000000).toFixed(4), ((await token.balanceOf(airdropWallet))/1e18).toFixed(4), 'airdrop wallet balance');
        assert.equal((0).toFixed(4), ((await token.balanceOf(airdropGW))/1e18).toFixed(4), 'airdrop GW wallet balance');
        assert.equal((55000000).toFixed(4), ((await token.balanceOf(preMcFlyWallet))/1e18).toFixed(4), 'preMcFly wallet balance');
        assert.equal((100000000).toFixed(4), ((await token.balanceOf(wavesAgent))/1e18).toFixed(4), 'waves wallet balance');
        assert.equal((0).toFixed(4), ((await token.balanceOf(wavesGW))/1e18).toFixed(4), 'waves GW wallet balance');
        assert.equal((432000000).toFixed(4), ((await token.balanceOf(sale.address))/1e18).toFixed(4), 'contract wallet balance');
        assert.equal((0).toFixed(4), ((await token.balanceOf(teamWallet))/1e18).toFixed(4), 'team wallet balance');
        assert.equal((0).toFixed(4), ((await token.balanceOf(advisoryWallet))/1e18).toFixed(4), 'advisory wallet balance');
        assert.equal((0).toFixed(4), ((await token.balanceOf(reservedWallet))/1e18).toFixed(4), 'reserved wallet balance');
    });

    it("1.3 start -> check correct value crowdTokensTLP2 -> check", async() => {
        await check_constant('crowdTokensTLP2', '155000000.00'); // waves 100e24 + preMcFly 55e24
    });

    it("1.4 start -> correct setStartEndTimeTLP2 -> check", async() => {
        let timeStart = (await sale.sT2()).toNumber();
        let timeOk = latestTime()+duration.weeks(1);
        let timeDiff = (timeStart-timeOk <= 10);
        assert.equal(timeDiff, true);
    });
    
    it("1.5 token transfer -> allow to transfer tokens for bounty, airdrop, preMcFly, waves without time limit", async() => {
        //await increaseTime(duration.weeks(1));

        let token_balance1 = await token.balanceOf(client1);
        await token.transfer(client1, 10e18, {from: bountyOfflineWallet});

        let token_balance2 = await token.balanceOf(client1);
        assert.equal(token_balance2-token_balance1, 10e18);

        token_balance1 = await token.balanceOf(client1);
        await token.transfer(client1, 10e18, {from: bountyOnlineWallet});
        token_balance2 = await token.balanceOf(client1);
        assert.equal(token_balance2-token_balance1, 10e18);

        await token.transfer(bountyOnlineGW, 10e18, {from: bountyOnlineWallet});
        token_balance1 = await token.balanceOf(client1);
        await token.transfer(client1, 5e18, {from: bountyOnlineGW});
        token_balance2 = await token.balanceOf(client1);
        assert.equal(token_balance2-token_balance1, 5e18);

        token_balance1 = await token.balanceOf(client1);
        await token.transfer(client1, 10e18, {from: airdropWallet});
        token_balance2 = await token.balanceOf(client1);
        assert.equal(token_balance2-token_balance1, 10e18);

        await token.transfer(airdropGW, 10e18, {from: airdropWallet});
        token_balance1 = await token.balanceOf(client1);
        await token.transfer(client1, 5e18, {from: airdropGW});
        token_balance2 = await token.balanceOf(client1);
        assert.equal(token_balance2-token_balance1, 5e18);

        token_balance1 = await token.balanceOf(client1);
        await token.transfer(client1, 10e18, {from: wavesAgent});
        token_balance2 = await token.balanceOf(client1);
        assert.equal(token_balance2-token_balance1, 10e18);

        await token.transfer(wavesGW, 10e18, {from: wavesAgent});
        token_balance1 = await token.balanceOf(client1);
        await token.transfer(client1, 5e18, {from: wavesGW});
        token_balance2 = await token.balanceOf(client1);
        assert.equal(token_balance2-token_balance1, 5e18);

        token_balance1 = await token.balanceOf(client1);
        await token.transfer(client1, 10e18, {from: preMcFlyWallet});
        token_balance2 = await token.balanceOf(client1);
        assert.equal(token_balance2-token_balance1, 10e18);

    });

    it("1.6 token transfer -> disallow to transfer tokens for contract address without time limit", async() => {

        await shouldHaveException(async () => {
            await token.transfer(client1, 10e18, {from: sale.address});
        }, "Should has an error");

        await shouldHaveException(async () => {
            await token.transfer(preMcFlyWallet, 10e18, {from: sale.address});
        }, "Should has an error");
    });


    it("1.7 token transfer -> disallow to transfer tokens from client to client before end TLP2", async() => {
        await token.transfer(client1, 10e18, {from: bountyOfflineWallet});
        
        await shouldHaveException(async () => {
            await token.transfer(client2, 2e18, {from: client1});
        }, "Should has an error");

        await increaseTime(duration.weeks(1));

        await shouldHaveException(async () => {
            await token.transfer(client2, 2e18, {from: client1});
        }, "Should has an error");

        await increaseTime(duration.days(118));

        await shouldHaveException(async () => {
            await token.transfer(client2, 2e18, {from: client1});
        }, "Should has an error");
    });
    
    it("1.8 token transfer -> disallow transfer and transferFrom until end TLP2", async() => {
        await increaseTime(duration.weeks(1));
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18, gas:150000});
  
        await shouldHaveException(async () => {
            await token.transfer(client1, 1e8, {from: client1});
        }, "Should has an error");

        await shouldHaveException(async () => {
            await token.transferFrom(client1, client1, 1e8, {from: client1});
        }, "Should has an error");

        await shouldHaveException(async () => {
            await sale.refund({from: client1});
        }, "Should has an error");
    });

    it("1.9 token transfer -> allow transfer token after TLP2", async () => {
        let tokenBefore, tokenAfter;

        await increaseTime(duration.weeks(1));

        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18, gas:150000});
        await increaseTime(duration.days(119));
        await sale.finishCrowd();

        assert.equal((await token.mintingFinished()), true, 'token.mintingFinished should true');

        tokenBefore = (await token.balanceOf(client1)).toNumber();
        await token.transfer(client2, 1e18, {from: client1});
        tokenAfter = (await token.balanceOf(client1)).toNumber();
        assert.equal((tokenBefore/1e18).toFixed(4), ((tokenAfter+1e18)/1e18).toFixed(4));

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18, gas:150000});
        }, "Should has an error");
    });

    it("1.10 minimalTokenPrice -> do not allow to sell less than minimalTokenPrice at win1-5", async() => {
        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);

        await increaseTime(duration.days(60)); // to start win1

        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18, gas:150000});

//        console.log('sale.w.trnscount=',sale.w[0].totalTransCnt(),' totleth=',sale.w[0].totalEthInWindow());

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e17, gas:150000});
        }, "Should has an error");
    });

    it("1.11 withdraw -> check ether transfer to wallet", async() => {
        let balance1, balance2;

        balance1 = await web3.eth.getBalance(wallet);
        await increaseTime(duration.weeks(2));
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 2e18, gas:150000});
        balance2 = await web3.eth.getBalance(wallet);
        assert.equal(Math.round((balance2 - balance1)/1e14), 2e4);
    });


    it("1.12 purchase token -> finishCrowd -> purchase token count, afterTLP2=fail, beforeTLP2=fail", async() => {
        let tokenOnClient, totalSupply1;

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18, gas:150000});
        }, "Should has an error");

        await increaseTime(duration.weeks(1));
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 10e18, gas:150000});

        tokenOnClient = (await token.balanceOf(client1)).toNumber();
        assert.equal(((10/0.12*1e18*1000)/1e18).toFixed(4), (tokenOnClient/1e18).toFixed(4));

        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);
        assert.equal((await sale.running({from: owner})), false);

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client2, to: sale.address, value: 1e18, gas:150000});
        }, "Should has an error");
    });

    it("1.13 getTokens -> direct call = fail", async() => {
        await increaseTime(duration.weeks(1));

        await shouldHaveException(async () => {
            await sale.getTokens(client2, {from: client2, value: 0e18});
        }, "Should has an error");
    });

    it("1.15 newWindow -> direct call prived func = fail", async() => {
        await increaseTime(duration.weeks(1));

        await shouldHaveException(async () => {
            await sale.newWindow(0, 100e24)
        }, "Should has an error");
    });

    it("1.16 purchase token -> finishCrowd -> win1-2 test purchase token count", async() => {
        let tokenOnClient, totalSupply1;

        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);
        assert.equal((await sale.running({from: owner})), false);

        await increaseTime(duration.days(60)); // to start win1

        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18, gas:150000});
        await web3.eth.sendTransaction({from: client2, to: sale.address, value: 2e18, gas:150000});
        await web3.eth.sendTransaction({from: client3, to: sale.address, value: 3e18, gas:150000});

        //console.log('PPL1=',(await sale.getPpls(0)).toNumber(),' addr=',await sale.getPplsAddr(0));
        //console.log('PPL2=',(await sale.getPpls(1)).toNumber(),' addr=',await sale.getPplsAddr(1));
        //console.log('PPL3=',(await sale.getPpls(2)).toNumber(),' addr=',await sale.getPplsAddr(2));

        //console.log(await sale.getWactive(0));
        //console.log(await sale.getWtotalEth(0));
        //console.log(await sale.getWtotalTransCnt(0));
        //console.log(await sale.getWtoken(0));
        //console.log(await sale.getWrefundIndex(0));

        assert.equal((await sale.getWactive(0)), true);
        assert.equal((await sale.getWactive(1)), true);
        assert.equal((await sale.getWactive(2)), true);
        assert.equal((await sale.getWactive(3)), true);
        assert.equal((await sale.getWactive(4)), true);

        assert.equal(((await sale.getWtotalEth(0))/1e18).toFixed(4), (6).toFixed(4));
        assert.equal((await sale.getWtotalTransCnt(0)).toFixed(4), (3).toFixed(4));
        assert.equal((await sale.getWrefundIndex(0)).toFixed(4), (0).toFixed(4));
        assert.equal((await sale.getWtoken(0)/1e24).toFixed(4), (221).toFixed(4));

        let tokenBefore1, tokenAfter1, tokenBefore2, tokenAfter2, tokenBefore3, tokenAfter3;

        tokenBefore1 = (await token.balanceOf(client1)).toNumber();
        tokenBefore2 = (await token.balanceOf(client2)).toNumber();
        tokenBefore3 = (await token.balanceOf(client3)).toNumber();
        
        let set_test = (await sale.TokenETH({fromBlock: 0, toBlock: 'latest'}))

        await sale.sendTokensWindow(0, {from: owner});

        set_test.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'TokenETH');
        });
        
        tokenAfter1 = (await token.balanceOf(client1)).toNumber();
        tokenAfter2 = (await token.balanceOf(client2)).toNumber();
        tokenAfter3 = (await token.balanceOf(client3)).toNumber();
        assert.equal((36833333).toFixed(4), ((tokenAfter1)/1e18).toFixed(4));
        assert.equal((73666666).toFixed(4), ((tokenAfter2)/1e18).toFixed(4));
        assert.equal((110499999).toFixed(4), ((tokenAfter3)/1e18).toFixed(4));

        let balance1, balance2;

        balance1 = await web3.eth.getBalance(wallet);
        await sale.closeWindow(0, {from: owner});
        balance2 = await web3.eth.getBalance(wallet);
        assert.equal(Math.round((balance2 - balance1)/1e14), 6e4);

        assert.equal((await sale.getWactive(0)), false);
        assert.equal((await sale.getWactive(1)), true);

        // win1
        await increaseTime(duration.days(12)); // end win 1
        await increaseTime(duration.days(60)); // to start win2

        tokenBefore1 = (await token.balanceOf(client4)).toNumber();
        await web3.eth.sendTransaction({from: client4, to: sale.address, value: 11e18, gas:150000});

        //console.log('WINDOW 1 before sendTokens')
        //console.log('PPL1=',(await sale.getPpls(0)).toNumber(),' addr=',await sale.getPplsAddr(0));
        //console.log('PPL2=',(await sale.getPpls(1)).toNumber(),' addr=',await sale.getPplsAddr(1));
        //console.log('PPL3=',(await sale.getPpls(2)).toNumber(),' addr=',await sale.getPplsAddr(2));
        //console.log('PPL4=',(await sale.getPpls(3)).toNumber(),' addr=',await sale.getPplsAddr(3));
        //console.log('PPL5=',(await sale.getPpls(4)).toNumber(),' addr=',await sale.getPplsAddr(4));
        
        let set_test2 = (await sale.TokenETH({fromBlock: 0, toBlock: 'latest'}))
        await sale.sendTokensWindow(1, {from: owner});
        set_test2.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'TokenETH');
        });
        tokenAfter1 = (await token.balanceOf(client4)).toNumber();
        assert.equal((220999999).toFixed(4), ((tokenAfter1)/1e18).toFixed(4));

        // close win1
        balance1 = await web3.eth.getBalance(wallet);
        await sale.closeWindow(1, {from: owner});
        balance2 = await web3.eth.getBalance(wallet);
        assert.equal(Math.round((balance2 - balance1)/1e14), 11e4);

        assert.equal((await sale.getWactive(0)), false);
        assert.equal((await sale.getWactive(1)), false);
        assert.equal((await sale.getWactive(2)), true);

        //console.log('WINDOW 1end')
        //console.log('PPL1=',(await sale.getPpls(0)).toNumber(),' addr=',await sale.getPplsAddr(0));
        //console.log('PPL2=',(await sale.getPpls(1)).toNumber(),' addr=',await sale.getPplsAddr(1));
        //console.log('PPL3=',(await sale.getPpls(2)).toNumber(),' addr=',await sale.getPplsAddr(2));
        //console.log('PPL4=',(await sale.getPpls(3)).toNumber(),' addr=',await sale.getPplsAddr(3));
        //console.log('PPL5=',(await sale.getPpls(4)).toNumber(),' addr=',await sale.getPplsAddr(4));
    });

    it("1.16.1 purchase token -> finishCrowd -> win3 test purchase token count", async() => {
        let tokenOnClient, totalSupply1;
        let tokenBefore1, tokenAfter1, tokenBefore2, tokenAfter2, tokenBefore3, tokenAfter3;
        let balance1, balance2;
        
        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);
        assert.equal((await sale.running({from: owner})), false);

        await increaseTime(duration.days(60)); // to start win1

        // win2
        await increaseTime(duration.days(12)); // end win 1
        await increaseTime(duration.days(60)); // to start win2
        // win3
        await increaseTime(duration.days(12)); // end win 2
        await increaseTime(duration.days(60)); // to start win3

        tokenBefore1 = (await token.balanceOf(client4)).toNumber();
        tokenBefore2 = (await token.balanceOf(client3)).toNumber();
        tokenBefore3 = (await token.balanceOf(client2)).toNumber();
        await web3.eth.sendTransaction({from: client4, to: sale.address, value: 10e18, gas:150000});
        await web3.eth.sendTransaction({from: client3, to: sale.address, value: 10e18, gas:150000});
        await web3.eth.sendTransaction({from: client2, to: sale.address, value: 10e18, gas:150000});

        //console.log('WINDOW 3')
        //console.log('PPL1=',(await sale.getPpls(0)).toNumber(),' addr=',await sale.getPplsAddr(0));
        //console.log('PPL2=',(await sale.getPpls(1)).toNumber(),' addr=',await sale.getPplsAddr(1));
        //console.log('PPL3=',(await sale.getPpls(2)).toNumber(),' addr=',await sale.getPplsAddr(2));
        //console.log('PPL4=',(await sale.getPpls(3)).toNumber(),' addr=',await sale.getPplsAddr(3));
        //console.log('PPL5=',(await sale.getPpls(4)).toNumber(),' addr=',await sale.getPplsAddr(4));

        let set_test3 = (await sale.TokenETH({fromBlock: 0, toBlock: 'latest'}))
        await sale.sendTokensWindow(2, {from: owner});
        set_test3.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'TokenETH');
        });
        tokenAfter1 = (await token.balanceOf(client4)).toNumber();
        tokenAfter2 = (await token.balanceOf(client3)).toNumber();
        tokenAfter3 = (await token.balanceOf(client2)).toNumber();
        //console.log('Balances W3:client4=',tokenAfter1,' 3=',tokenAfter2,' 2=',tokenAfter3);
        assert.equal((73666660).toFixed(4), ((tokenAfter1)/1e18).toFixed(4));
        assert.equal((73666660).toFixed(4), ((tokenAfter2)/1e18).toFixed(4));
        assert.equal((73666660).toFixed(4), ((tokenAfter3)/1e18).toFixed(4));

        // close win3
        balance1 = await web3.eth.getBalance(wallet);
        await sale.closeWindow(2, {from: owner});
        balance2 = await web3.eth.getBalance(wallet);
        assert.equal(Math.round((balance2 - balance1)/1e14), 30e4);

        assert.equal((await sale.getWactive(2)), false);
        assert.equal((await sale.getWactive(3)), true);
    });

    it("1.16.2 purchase token -> finishCrowd -> win4 test purchase token count", async() => {
        let tokenOnClient, totalSupply1;
        let tokenBefore1, tokenAfter1, tokenBefore2, tokenAfter2, tokenBefore3, tokenAfter3;
        let balance1, balance2;
        
        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);
        assert.equal((await sale.running({from: owner})), false);

        await increaseTime(duration.days(60)); // to start win1

        // win2
        await increaseTime(duration.days(12)); // end win 1
        await increaseTime(duration.days(60)); // to start win2
        // win3
        await increaseTime(duration.days(12)); // end win 2
        await increaseTime(duration.days(60)); // to start win3
        // win4
        await increaseTime(duration.days(12)); // end win 3
        await increaseTime(duration.days(60)); // to start win4

        tokenBefore1 = (await token.balanceOf(client4)).toNumber();
        tokenBefore2 = (await token.balanceOf(client3)).toNumber();
        tokenBefore3 = (await token.balanceOf(client2)).toNumber();
        await web3.eth.sendTransaction({from: client4, to: sale.address, value: 5e18, gas:150000});
        await web3.eth.sendTransaction({from: client3, to: sale.address, value: 6e18, gas:150000});
        await web3.eth.sendTransaction({from: client2, to: sale.address, value: 7e18, gas:150000});

        //console.log('WINDOW 4')
        //console.log('PPL1=',(await sale.getPpls(0)).toNumber(),' addr=',await sale.getPplsAddr(0));
        //console.log('PPL2=',(await sale.getPpls(1)).toNumber(),' addr=',await sale.getPplsAddr(1));
        //console.log('PPL3=',(await sale.getPpls(2)).toNumber(),' addr=',await sale.getPplsAddr(2));
        //console.log('PPL4=',(await sale.getPpls(3)).toNumber(),' addr=',await sale.getPplsAddr(3));
        //console.log('PPL5=',(await sale.getPpls(4)).toNumber(),' addr=',await sale.getPplsAddr(4));

        let set_test3 = (await sale.TokenETH({fromBlock: 0, toBlock: 'latest'}))
        await sale.sendTokensWindow(3, {from: owner});
        set_test3.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'TokenETH');
        });
        tokenAfter1 = (await token.balanceOf(client4)).toNumber();
        tokenAfter2 = (await token.balanceOf(client3)).toNumber();
        tokenAfter3 = (await token.balanceOf(client2)).toNumber();
        //console.log('Balances W4:client4=',tokenAfter1,' 3=',tokenAfter2,' 2=',tokenAfter3);
        assert.equal((61388885).toFixed(4), ((tokenAfter1)/1e18).toFixed(4));
        assert.equal((73666662).toFixed(4), ((tokenAfter2)/1e18).toFixed(4));
        assert.equal((85944439).toFixed(4), ((tokenAfter3)/1e18).toFixed(4));

        // close win4
        balance1 = await web3.eth.getBalance(wallet);
        await sale.closeWindow(3, {from: owner});
        balance2 = await web3.eth.getBalance(wallet);
        assert.equal(Math.round((balance2 - balance1)/1e14), 18e4);

        assert.equal((await sale.getWactive(3)), false);
        assert.equal((await sale.getWactive(4)), true);
    });

    it("1.16.3 purchase token -> finishCrowd -> win5 test purchase token count", async() => {
        let tokenOnClient, totalSupply1;
        let tokenBefore1, tokenAfter1, tokenBefore2, tokenAfter2, tokenBefore3, tokenAfter3;
        let balance1, balance2;
        
        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);
        assert.equal((await sale.running({from: owner})), false);

        await increaseTime(duration.days(60)); // to start win1

        // win2
        await increaseTime(duration.days(12)); // end win 1
        await increaseTime(duration.days(60)); // to start win2
        // win3
        await increaseTime(duration.days(12)); // end win 2
        await increaseTime(duration.days(60)); // to start win3
        // win4
        await increaseTime(duration.days(12)); // end win 3
        await increaseTime(duration.days(60)); // to start win4
        // win4
        await increaseTime(duration.days(12)); // end win 4
        await increaseTime(duration.days(60)); // to start win5

        tokenBefore1 = (await token.balanceOf(client4)).toNumber();
        tokenBefore2 = (await token.balanceOf(client3)).toNumber();
        tokenBefore3 = (await token.balanceOf(client2)).toNumber();
        await web3.eth.sendTransaction({from: client4, to: sale.address, value: 44e18, gas:150000});

        //console.log('WINDOW 5')
        //console.log('PPL1=',(await sale.getPpls(0)).toNumber(),' addr=',await sale.getPplsAddr(0));
        //console.log('PPL2=',(await sale.getPpls(1)).toNumber(),' addr=',await sale.getPplsAddr(1));
        //console.log('PPL3=',(await sale.getPpls(2)).toNumber(),' addr=',await sale.getPplsAddr(2));
        //console.log('PPL4=',(await sale.getPpls(3)).toNumber(),' addr=',await sale.getPplsAddr(3));
        //console.log('PPL5=',(await sale.getPpls(4)).toNumber(),' addr=',await sale.getPplsAddr(4));

        let set_test3 = (await sale.TokenETH({fromBlock: 0, toBlock: 'latest'}))
        await sale.sendTokensWindow(4, {from: owner});
        set_test3.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'TokenETH');
        });
        tokenAfter1 = (await token.balanceOf(client4)).toNumber();
        tokenAfter2 = (await token.balanceOf(client3)).toNumber();
        tokenAfter3 = (await token.balanceOf(client2)).toNumber();
        //console.log('Balances W5:client4=',tokenAfter1,' 3=',tokenAfter2,' 2=',tokenAfter3);
        assert.equal((220999988).toFixed(4), ((tokenAfter1)/1e18).toFixed(4));

        // close win5
        balance1 = await web3.eth.getBalance(wallet);
        await sale.closeWindow(4, {from: owner});
        balance2 = await web3.eth.getBalance(wallet);
        assert.equal(Math.round((balance2 - balance1)/1e14), 44e4);

        assert.equal((await sale.getWactive(4)), false);
    });

    it("1.17 purchase token -> finishCrowd -> period win1 - win2, win3 - win 4 = fail purchase token count", async() => {
        let tokenOnClient, totalSupply1;

        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e17, gas:180000});
        }, "Should has an error");

        await increaseTime(duration.days(60)); // to start win1

        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18, gas:180000});
        
        await increaseTime(duration.days(13)); // end win 1

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e17, gas:180000});
        }, "Should has an error");

        await increaseTime(duration.days(60)); // to start win2

        await web3.eth.sendTransaction({from: client2, to: sale.address, value: 1e18, gas:180000});
        
        await increaseTime(duration.days(13)); // end win 2

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client2, to: sale.address, value: 1e17, gas:180000});
        }, "Should has an error");

        await increaseTime(duration.days(60)); // to start win3

        await web3.eth.sendTransaction({from: client2, to: sale.address, value: 1e18, gas:180000});

        await increaseTime(duration.days(13)); // end win 3

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e17, gas:180000});
        }, "Should has an error");

        await increaseTime(duration.days(60)); // to start win4

        await web3.eth.sendTransaction({from: client2, to: sale.address, value: 1e18, gas:180000});

        await increaseTime(duration.days(13)); // end win 4

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e17, gas:180000});
        }, "Should has an error");

        await increaseTime(duration.days(60)); // to start win5

        await web3.eth.sendTransaction({from: client2, to: sale.address, value: 1e18, gas:180000});

        await increaseTime(duration.days(13)); // end win 5

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e17, gas:180000});
        }, "Should has an error");
    });

    it("1.18 purchase token -> closeWindow, sendTokenWindows -> wrong owner", async() => {
        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);
        assert.equal((await sale.running({from: owner})), false);

        await increaseTime(duration.days(60)); // to start win1

        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18, gas:150000});

        await shouldHaveException(async () => {
            await sale.sendTokensWindow(0, {from: client4});
        }, "Should has an error");

        await shouldHaveException(async () => {
            await sale.closeWindow(0, {from: client3});
        }, "Should has an error");

        await sale.closeWindow(0, {from: owner});

        await shouldHaveException(async () => {
            await sale.closeWindow(0, {from: owner});
        }, "Should has an error");
    });

    it("2.0 running -> check stateName, ICO periods", async() => {
        assert.equal((await sale.running({from: owner})), false);
        assert.equal((await sale.withinPeriod()), false);
        await check_tlp(sale.stageName(),101);
        await increaseTime(duration.days(15)+duration.minutes(1));
        assert.equal((await sale.running()), true);
        assert.equal((await sale.withinPeriod()), true);
        await check_tlp(sale.stageName(),102);
        await increaseTime(duration.days(118)+duration.minutes(1));
        await check_tlp(sale.stageName(),103);
        assert.equal((await sale.withinPeriod()), false);
        assert.equal((await sale.running({from: owner})), false);
        await increaseTime(duration.days(60)+duration.minutes(1));
        await check_tlp(sale.stageName(),0);
        await increaseTime(duration.days(12)+duration.minutes(1));
        await check_tlp(sale.stageName(),104);
        await increaseTime(duration.days(60)+duration.minutes(1));
        await check_tlp(sale.stageName(),1);
        await increaseTime(duration.days(12)+duration.minutes(1));
        await check_tlp(sale.stageName(),105);
        await increaseTime(duration.days(60)+duration.minutes(1));
        await check_tlp(sale.stageName(),2);
        await increaseTime(duration.days(12)+duration.minutes(1));
        await check_tlp(sale.stageName(),106);
        await increaseTime(duration.days(60)+duration.minutes(1));
        await check_tlp(sale.stageName(),3);
        await increaseTime(duration.days(12)+duration.minutes(1));
        await check_tlp(sale.stageName(),107);
        await increaseTime(duration.days(60)+duration.minutes(1));
        await check_tlp(sale.stageName(),4);
        await increaseTime(duration.days(12)+duration.minutes(1));
        assert.equal((await sale.withinPeriod()), false);
        await check_tlp(sale.stageName(),200);
    });

    it("2.1 setStartEndTimeTLP2 -> set and check", async() => {
        let set_start_time_tlp2 = (await sale.SetStartTimeTLP2({fromBlock: 0, toBlock: 'latest'}))

        let time1 = await sale.sT2();
        await sale.setStartEndTimeTLP(startTimeTLP2 + duration.days(1));

        set_start_time_tlp2.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'SetStartTimeTLP2');
        });

        let time2 = await sale.sT2();
        assert.equal(time2-time1, duration.days(1));

        await shouldHaveException(async () => {
            await sale.setStartEndTimeTLP(startTimeTLP2 - duration.days(10), {from: owner});
        }, "Should has an error");

        await increaseTime(duration.days(10)+duration.minutes(1));

        await shouldHaveException(async () => {
            await sale.setStartEndTimeTLP(startTimeTLP2 + duration.days(1), {from: owner});
        }, "Should has an error");
    });

    it("2.2 setStartTimeTLP2 -> wrong owner", async() => {
        let set_start_time_tlp2 = (await sale.SetStartTimeTLP2({fromBlock: 0, toBlock: 'latest'}))

        await shouldHaveException(async () => {
            await sale.setStartEndTimeTLP(startTimeTLP2 + duration.days(1), {from: client1});
        }, "Should has an error");

        set_start_time_tlp2.get((err, events) => {
            assert.equal(events.length, 0);
        });
    });

    it("2.3 setFundMintingAgent -> good owner", async() => {
        let set_fund_minting_events = (await sale.SetFundMintingAgent({fromBlock: 0, toBlock: 'latest'}))

        await sale.setFundMintingAgent(client2);

        set_fund_minting_events.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'SetFundMintingAgent');
        });
    });

    it("2.4 setFundMintingAgent -> wrong owner", async() => {
        let set_fund_minting_events = (await sale.SetFundMintingAgent({fromBlock: 0, toBlock: 'latest'}))

        await shouldHaveException(async () => {
            await sale.setFundMintingAgent(client2, {from: client1});
        }, "Should has an error");

        set_fund_minting_events.get((err, events) => {
            assert.equal(events.length, 0);
        });
    });

    it("2.5 setMinETHin -> wrong owner", async() => {
        let set_minEth_events = (await sale.SetMinETHincome({fromBlock: 0, toBlock: 'latest'}))

        await shouldHaveException(async () => {
            await sale.setMinETHin(2e18, {from: client1});
        }, "Should has an error");

        set_minEth_events.get((err, events) => {
            assert.equal(events.length, 0);
        });
    });


    it("2.6 setMinETHin -> ok owner", async() => {
        let set_minEth_events = (await sale.SetMinETHincome({fromBlock: 0, toBlock: 'latest'}))

        await sale.setMinETHin(2e18, {from: owner});
        
        set_minEth_events.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'SetMinETHincome');
        });
    });

    it("2.7 mintingFinished -> check false before TLP2 end, check amount of Windows tokens", async() => {
        await increaseTime(duration.weeks(1));

        await shouldHaveException(async () => {
            await sale.finishCrowd();
        }, "Should has an error");

        await increaseTime(duration.days(119));

        await sale.finishCrowd();

        assert.equal((await token.mintingFinished()), true);
        assert.equal((await sale.running()), false);

        // 1105 = total tokens for sale - preMcFly(55) - waves(100) + 432 for team & advisory & reserved
        assert.equal((1537000000).toFixed(4), ((await token.balanceOf(sale.address))/1e18).toFixed(4), 'all tokens minted!');
    });

    it("2.8 setTeamWallet -> good owner", async() => {
        let set_team_wallet_events = (await sale.SetTeamWallet({fromBlock: 0, toBlock: 'latest'}))

        await sale.setTeamWallet(client2);

        set_team_wallet_events.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'SetTeamWallet');
        });
    });

    it("2.9 setTeamWallet -> wrong owner", async() => {
        let set_team_wallet_events = (await sale.SetTeamWallet({fromBlock: 0, toBlock: 'latest'}))

        await shouldHaveException(async () => {
            await sale.setTeamWallet(client2, {from: client1});
        }, "Should has an error");

        set_team_wallet_events.get((err, events) => {
            assert.equal(events.length, 0);
        });
    });
    
    it("2.10 setAdvisoryWallet -> good owner", async() => {
        let set_advisory_wallet_events = (await sale.SetAdvisoryWallet({fromBlock: 0, toBlock: 'latest'}))

        await sale.setAdvisoryWallet(client3);

        set_advisory_wallet_events.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'SetAdvisoryWallet');
        });
    });

    it("2.11 setAdvisoryWallet -> wrong owner", async() => {
        let set_advisory_wallet_events = (await sale.SetAdvisoryWallet({fromBlock: 0, toBlock: 'latest'}))

        await shouldHaveException(async () => {
            await sale.setAdvisoryWallet(client2, {from: client1});
        }, "Should has an error");

        set_advisory_wallet_events.get((err, events) => {
            assert.equal(events.length, 0);
        });
    });

    it("2.12 setReservedWallet -> good owner", async() => {
        let set_reserved_wallet_events = (await sale.SetReservedWallet({fromBlock: 0, toBlock: 'latest'}))

        await sale.setReservedWallet(client3);

        set_reserved_wallet_events.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'SetReservedWallet');
        });
    });

    it("2.13 setReservedWallet -> wrong owner", async() => {
        let set_reserved_wallet_events = (await sale.SetReservedWallet({fromBlock: 0, toBlock: 'latest'}))

        await shouldHaveException(async () => {
            await sale.setReservedWallet(client2, {from: client1});
        }, "Should has an error");

        set_reserved_wallet_events.get((err, events) => {
            assert.equal(events.length, 0);
        });
    });


    it("3.0 calcAmountAt -> TLP2", async() => {
        await check_constant('mintCapInTokens', '1260000000.00');
        await check_constant('hardCapInTokens', '1800000000.00');

         // 0.12 | 1 ETH -> 1 / (100-40) * 100 / 0.2 * 1000 = 8333,3333333333 MFL
         // 0.14 | 1 ETH -> 1 / (100-30) * 100 / 0.2 * 1000 = 7142.8571428571 MFL
         // 0.16 | 1 ETH -> 1 / (100-20) * 100 / 0.2 * 1000 = 6250 MFL
         // 0.18 | 1 ETH -> 1 / (100-10) * 100 / 0.2 * 1000 = 5555,5555555556 MFL
         // 0.20 | 1 ETH -> 1 / (100-0) * 100 / 0.2 * 1000  = 5000 MFL
         // 0.22 | 1 ETH -> 1 / (100+10) * 100 / 0.2 * 1000 = 4545,4545454545 MFL
         // 0.24 | 1 ETH -> 1 / (100+20) * 100 / 0.2 * 1000 = 4166,6666666667 MFL
         // 0.26 | 1 ETH -> 1 / (100+30) * 100 / 0.2 * 1000 = 3846,1538461538 MFL
        await check_calcAmount(1e18, startTimeTLP2, wavesTokens, 8333.3333333333e18);
        await check_calcAmount(1e18, startTimeTLP2 + duration.days(16), wavesTokens, 7142.8571428571e18);
        await check_calcAmount(1e18, startTimeTLP2 + duration.days(31), wavesTokens, 6250e18);
        await check_calcAmount(1e18, startTimeTLP2 + duration.days(46), wavesTokens, 5555.5555555556e18);
        await check_calcAmount(1e18, startTimeTLP2 + duration.days(61), wavesTokens, 5000e18);
        await check_calcAmount(1e18, startTimeTLP2 + duration.days(76), wavesTokens, 4545.4545454545e18);
        await check_calcAmount(1e18, startTimeTLP2 + duration.days(91), wavesTokens, 4166.6666666667e18);
        await check_calcAmount(1e18, startTimeTLP2 + duration.days(106), wavesTokens, 3846.1538461538e18);

        await check_calcAmount(150000e18, startTimeTLP2, 1105e24, 695e24, 66600e18);

        await check_calcAmount(150000e18, startTimeTLP2, 1205e24, 595e24, 78600e18);
        
        // after TLP2
        await shouldHaveException(async () => {
            await check_calcAmount(1e18, startTimeTLP2 + duration.days(119), wavesTokens, 10000e18);
        }, "Should has an error");
        
        // before TLP2
        await shouldHaveException(async () => {
            await check_calcAmount(1e18, startTimeTLP2 - duration.days(3), wavesTokens, 10000e18);
        }, "Should has an error");
    });

    it("3.1 fundMinting -> before, after, wrong owner", async() => {
        let tokenBefore1, tokenAfter1, tokenBefore2, tokenAfter2, tokenBefore3, tokenAfter3;

        await web3.eth.sendTransaction({from: client1, to: fundMintingAgent, value: 10e18, gas:150000});

        await sale.fundMinting(client2, 100e18, {from: fundMintingAgent});
        await sale.fundMinting(client2, 100e18, {from: owner});
        
        await shouldHaveException(async () => {
            await sale.fundMinting(client2, 100e18, {from: client4});
        }, "Should has an error");
        
        await increaseTime(duration.weeks(1));
        await shouldHaveException(async () => {
            await sale.fundMinting(client2, 100e18, {from: fundMintingAgent});
        }, "Should has an error");

        await increaseTime(duration.days(13));
        await shouldHaveException(async () => {
            await sale.fundMinting(client2, 100e18, {from: fundMintingAgent});
        }, "Should has an error");

        tokenAfter1 = (await token.balanceOf(client2)).toNumber();
        //console.log('Balances mint tokens:client2=',tokenAfter1);
        assert.equal((200).toFixed(4), ((tokenAfter1)/1e18).toFixed(4));

        var tempSupply = await sale.fundTotalSupply();
        //console.log('fundTotalSupply=',tempSupply);
        await check_constant('fundTotalSupply', '200.00');

        await increaseTime(duration.weeks(1));
        await web3.eth.sendTransaction({from: client2, to: sale.address, value: 2e18, gas:150000});
        await increaseTime(duration.days(101));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);
        assert.equal((await sale.running({from: owner})), false);

        await shouldHaveException(async () => {
            await sale.fundMinting(client2, 100e18, {from: fundMintingAgent});
        }, "Should has an error");

        //console.log(await sale.getWtoken(0));

        assert.equal((await sale.getWtoken(0)/1e24).toFixed(4), (220.9971).toFixed(4));
    });


    it("3.2 fundMinting -> sell all allowed and try to sell over limit", async() => {
        let tokenBefore1, tokenAfter1, tokenBefore2, tokenAfter2, tokenBefore3, tokenAfter3;
        let fund_minting_events = (await sale.FundMinting({fromBlock: 0, toBlock: 'latest'}))
        let fundTokens = 270000000e18;

        //console.log('Fund tokens =',fundTokens);
        await web3.eth.sendTransaction({from: client1, to: fundMintingAgent, value: 10e18, gas:150000});

        await sale.fundMinting(client1, fundTokens, {from: fundMintingAgent});

        fund_minting_events.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'FundMinting');
        });

        await shouldHaveException(async () => {
            await sale.fundMinting(client1, 100e18, {from: fundMintingAgent});
        }, "Should has an error");

        tokenAfter1 = (await token.balanceOf(client1)).toNumber();
        //console.log('Balances mint tokens:client1=',tokenAfter1);
        assert.equal((270000000).toFixed(4), ((tokenAfter1)/1e18).toFixed(4));

        var tempSupply = await sale.fundTotalSupply();
        //console.log('fundTotalSupply=',tempSupply);
        await check_constant('fundTotalSupply', '270000000.00');

        await increaseTime(duration.weeks(1));
        //await web3.eth.sendTransaction({from: client2, to: sale.address, value: 2e18, gas:150000});
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);
        assert.equal((await sale.running({from: owner})), false);

        //console.log(await sale.getWtoken(0));

        assert.equal((await sale.getWtoken(0)/1e24).toFixed(4), (167.0000).toFixed(4));
    });

    it("3.3 send -> Donate max ether", async () => {
        await increaseTime(duration.weeks(1));

        assert.equal((await token.mintingFinished()), false);
        assert.equal((await sale.running()), true);

        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 132600e18, gas:150000});

        await shouldHaveException(async () => {
            await token.transfer(client2, 1e8, {from: client1});
        }, "Should has an error");
        
        await sale.finishCrowd();

        assert.equal((await sale.running()), false);
        assert.equal((await token.mintingFinished()), true);

        await token.transfer(client2, 1e8, {from: client1});

        await shouldHaveException(async () => {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: 1e18, gas:150000});
        }, "Should has an error");
    });

    it("3.4 send -> Donate more then max ether", async () => {
        await increaseTime(duration.weeks(1));

        let balance1 = await web3.eth.getBalance(client1);
        let token_balance1 = await token.balanceOf(client1);

        let odd_ethers_events = (await sale.TransferOddEther({fromBlock: 0, toBlock: 'latest'}))
        await web3.eth.sendTransaction({from: client1, to: sale.address, value: 150000e18, gas:150000});

        odd_ethers_events.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'TransferOddEther');
        });

        let balance2 = await web3.eth.getBalance(client1);
        let token_balance2 = await token.balanceOf(client1);

        assert.equal(Math.round(balance1/1e18 - balance2/1e18), 132600, 'Contract should send back our 17400 ETH');
        assert.equal(token_balance1.toNumber(), 0);
        assert.equal(Math.round(token_balance2.toNumber()/1e24), Math.round(1105));
    });
    
    it("4.1 vestingWithdraw -> direct call prived func = fail", async() => {
        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);
        
        await shouldHaveException(async () => {
            await sale.vestingWithdraw(teamWallet, 100e24, 0);
        }, "Should has an error");
    });

    it("4.2 teamWithdraw -> try to withdraw before end TLP2", async() => {
        await increaseTime(duration.weeks(1));
        await shouldHaveException(async () => {
            await sale.teamWithdraw({from: teamWallet});
        }, "Should has an error");
        await increaseTime(duration.days(100));
        await shouldHaveException(async () => {
            await sale.teamWithdraw({from: teamWallet});
        }, "Should has an error");
    });

    it("4.3 teamWithdraw -> wrong owner", async() => {
        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);

        await shouldHaveException(async () => {
            await sale.teamWithdraw({from: client1});
        }, "Should has an error");
        await shouldHaveException(async () => {
            await sale.advisoryWithdraw({from: client2});
        }, "Should has an error");
        await shouldHaveException(async () => {
            await sale.reservedWithdraw({from: client3});
        }, "Should has an error");
    });

    it("4.4 teamWithdraw -> withdraw period 0 from teamWallet", async() => {
        let tokenBefore1, tokenAfter1, tokenBefore2, tokenAfter2, tokenBefore3, tokenAfter3;

        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);

        tokenBefore2 = (await token.balanceOf(sale.address)).toNumber();

        for (var i = 1; i < 25; i++) {
            tokenBefore1 = (await token.balanceOf(teamWallet)).toNumber();
            
            await increaseTime(duration.days(31));
            await sale.teamWithdraw({from: teamWallet});
            tokenAfter1 = (await token.balanceOf(teamWallet)).toNumber();
            assert.equal((7500000).toFixed(4), ((tokenAfter1-tokenBefore1)/1e18).toFixed(4));
            //console.log('M=',i,'     teamWallet=',(await token.balanceOf(teamWallet)).toNumber());
            //console.log('       teamTotalSupply=',(await sale.teamTotalSupply()).toNumber());
        }       
        tokenAfter2 = (await token.balanceOf(sale.address)).toNumber();
        assert.equal((180000000).toFixed(4), ((tokenBefore2-tokenAfter2)/1e18).toFixed(4));

        assert.equal((await token.balanceOf(teamWallet)).toNumber(), 180000000e18);
    });

    it("4.5 teamWithdraw -> wrong call, withdraw period 0 from teamWallet", async() => {
        let tokenBefore1, tokenAfter1, tokenBefore2, tokenAfter2, tokenBefore3, tokenAfter3;

        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);

        tokenBefore1 = (await token.balanceOf(teamWallet)).toNumber();
        await increaseTime(duration.days(31));
        await sale.teamWithdraw({from: teamWallet});
        tokenAfter1 = (await token.balanceOf(teamWallet)).toNumber();
        assert.equal((7500000).toFixed(4), ((tokenAfter1-tokenBefore1)/1e18).toFixed(4));

        await shouldHaveException(async () => {
            await sale.reservedWithdraw({from: teamWallet});
        }, "Should has an error");

        await shouldHaveException(async () => {
            await sale.reservedWithdraw({from: teamWallet});
        }, "Should has an error");

        tokenBefore1 = (await token.balanceOf(teamWallet)).toNumber();
        await increaseTime(duration.days(31));
        await sale.teamWithdraw({from: teamWallet});
        tokenAfter1 = (await token.balanceOf(teamWallet)).toNumber();
        assert.equal((7500000).toFixed(4), ((tokenAfter1-tokenBefore1)/1e18).toFixed(4));
    });

    it("4.6 advisoryWithdraw -> withdraw period 0 from advisoryWallet", async() => {
        let tokenBefore1, tokenAfter1, tokenBefore2, tokenAfter2, tokenBefore3, tokenAfter3;

        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);

        tokenBefore2 = (await token.balanceOf(sale.address)).toNumber();

        for (var i = 1; i < 25; i++) {
            tokenBefore1 = (await token.balanceOf(advisoryWallet)).toNumber();
            
            await increaseTime(duration.days(31));
            await sale.advisoryWithdraw({from: advisoryWallet});
            tokenAfter1 = (await token.balanceOf(advisoryWallet)).toNumber();
            assert.equal((3750000).toFixed(4), ((tokenAfter1-tokenBefore1)/1e18).toFixed(4));
            //console.log('M=',i,'     advisoryWallet=',(await token.balanceOf(advisoryWallet)).toNumber());
            //console.log('       advisoryTotalSupply=',(await sale.advisoryTotalSupply()).toNumber());
        }       
        tokenAfter2 = (await token.balanceOf(sale.address)).toNumber();
        assert.equal((90000000).toFixed(4), ((tokenBefore2-tokenAfter2)/1e18).toFixed(4));

        assert.equal((await token.balanceOf(advisoryWallet)).toNumber(), 90000000e18);
    });

    it("4.7 reservedWithdraw -> withdraw period 0 from reservedWallet", async() => {
        let tokenBefore1, tokenAfter1, tokenBefore2, tokenAfter2, tokenBefore3, tokenAfter3;

        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);

        tokenBefore2 = (await token.balanceOf(sale.address)).toNumber();

        for (var i = 1; i < 25; i++) {
            tokenBefore1 = (await token.balanceOf(reservedWallet)).toNumber();
            
            await increaseTime(duration.days(31));
            await sale.reservedWithdraw({from: reservedWallet});
            tokenAfter1 = (await token.balanceOf(reservedWallet)).toNumber();
            assert.equal((6750000).toFixed(4), ((tokenAfter1-tokenBefore1)/1e18).toFixed(4));
            //console.log('M=',i,'     reservedWallet=',(await token.balanceOf(reservedWallet)).toNumber());
            //console.log('       reservedTotalSupply=',(await sale.reservedTotalSupply()).toNumber());
        }       
        tokenAfter2 = (await token.balanceOf(sale.address)).toNumber();
        assert.equal((162000000).toFixed(4), ((tokenBefore2-tokenAfter2)/1e18).toFixed(4));

        assert.equal((await token.balanceOf(reservedWallet)).toNumber(), 162000000e18);
    });

/*    
    it("1.16.4 purchase token 501 times, try to sendTokens multi GAS PROBLEM", async() => {
        let tokenOnClient, totalSupply1;
        let tokenBefore1, tokenAfter1, tokenBefore2, tokenAfter2, tokenBefore3, tokenAfter3;
        let balance1, balance2;
        
        await increaseTime(duration.weeks(1));
        await increaseTime(duration.days(119));
        await sale.finishCrowd();
        assert.equal((await token.mintingFinished()), true);
        assert.equal((await sale.running({from: owner})), false);

        await increaseTime(duration.days(60)); // to start win1

        // win2
        await increaseTime(duration.days(12)); // end win 1
        await increaseTime(duration.days(60)); // to start win2
        // win3
        await increaseTime(duration.days(12)); // end win 2
        await increaseTime(duration.days(60)); // to start win3

        tokenBefore1 = (await token.balanceOf(client1)).toNumber();
        tokenBefore2 = (await token.balanceOf(client2)).toNumber();

        tokenBefore3 = (await token.balanceOf(sale.address)).toNumber();

        for (var i = 1; i < 401; i++) {
            await web3.eth.sendTransaction({from: client1, to: sale.address, value: 2e18, gas:150000});
            await web3.eth.sendTransaction({from: client2, to: sale.address, value: 1e18, gas:150000});
            //console.log((await sale.getWtotalEth(0)),' ',(await sale.getWtotalTransCnt(0)),' ',(await sale.getWtoken(0)),' ',(await sale.getWrefundIndex(0)));
        }       
        console.log('i=',i);

        tokenAfter3 = (await token.balanceOf(sale.address)).toNumber();
        console.log('token balance before=',tokenBefore3,' after=',tokenAfter3);
        //assert.equal((1500000).toFixed(4), ((tokenBefore3-tokenAfter3)/1e18).toFixed(4));
        
        //console.log('WINDOW 3')
        //console.log('PPL1=',(await sale.getPpls(0)).toNumber(),' addr=',await sale.getPplsAddr(0));
        //console.log('PPL2=',(await sale.getPpls(1)).toNumber(),' addr=',await sale.getPplsAddr(1));
        //console.log('PPL3=',(await sale.getPpls(2)).toNumber(),' addr=',await sale.getPplsAddr(2));
        //console.log('PPL4=',(await sale.getPpls(3)).toNumber(),' addr=',await sale.getPplsAddr(3));
        //console.log('PPL5=',(await sale.getPpls(4)).toNumber(),' addr=',await sale.getPplsAddr(4));

        console.log('SEND 1111111!!!');
        console.log('eth=',(await sale.getWtotalEth(2)),' transCnt=',(await sale.getWtotalTransCnt(2)),' tokens=',(await sale.getWtoken(2)),' refIndex=',(await sale.getWrefundIndex(2)));

        let set_test_x = (await sale.TokenETH({fromBlock: 0, toBlock: 'latest'}))
        await sale.sendTokensWindow(2, {from: owner});
        set_test_x.get((err, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].event, 'TokenETH');
        });
        tokenAfter1 = (await token.balanceOf(client1)).toNumber();
        tokenAfter2 = (await token.balanceOf(client2)).toNumber();
        console.log('Token Balances before W3:client1=',tokenBefore1,' 2=',tokenBefore2);
        console.log('Token Balances after  W3:client1=',tokenAfter1,' 2=',tokenAfter2);
        //assert.equal((110500000).toFixed(4), ((tokenAfter1)/1e18).toFixed(4));
        //assert.equal((110500000).toFixed(4), ((tokenAfter2)/1e18).toFixed(4));
        console.log((await sale.getWtotalEth(0)),' ',(await sale.getWtotalTransCnt(2)),' ',(await sale.getWtoken(2)),' ',(await sale.getWrefundIndex(2)));

        if ((await sale.getWrefundIndex(2)) != (await sale.getWtotalTransCnt)) {
	    tokenBefore1 = (await token.balanceOf(client1)).toNumber();
	    tokenBefore2 = (await token.balanceOf(client2)).toNumber();

            console.log('SEND 222222!!!');
            console.log('eth=',(await sale.getWtotalEth(2)),' transCnt=',(await sale.getWtotalTransCnt(2)),' tokens=',(await sale.getWtoken(2)),' refIndex=',(await sale.getWrefundIndex(2)));
    
            let set_test_x = (await sale.TokenETH({fromBlock: 0, toBlock: 'latest'}))
            await sale.sendTokensWindow(2, {from: owner});
            set_test_x.get((err, events) => {
                assert.equal(events.length, 1);
                assert.equal(events[0].event, 'TokenETH');
            });
            tokenAfter1 = (await token.balanceOf(client1)).toNumber();
            tokenAfter2 = (await token.balanceOf(client2)).toNumber();
            console.log('Token Balances before W3:client1=',tokenBefore1,' 2=',tokenBefore2);
            console.log('Token Balances after  W3:client1=',tokenAfter1,' 2=',tokenAfter2);
            //assert.equal((110500000).toFixed(4), ((tokenAfter1)/1e18).toFixed(4));
            //assert.equal((110500000).toFixed(4), ((tokenAfter2)/1e18).toFixed(4));
            console.log((await sale.getWtotalEth(0)),' ',(await sale.getWtotalTransCnt(2)),' ',(await sale.getWtoken(2)),' ',(await sale.getWrefundIndex(2)));
        }
        if ((await sale.getWrefundIndex(2)) != (await sale.getWtotalTransCnt)) {
	    tokenBefore1 = (await token.balanceOf(client1)).toNumber();
	    tokenBefore2 = (await token.balanceOf(client2)).toNumber();

            console.log('SEND 333333!!!');
            console.log('eth=',(await sale.getWtotalEth(2)),' transCnt=',(await sale.getWtotalTransCnt(2)),' tokens=',(await sale.getWtoken(2)),' refIndex=',(await sale.getWrefundIndex(2)));
    
            let set_test_x = (await sale.TokenETH({fromBlock: 0, toBlock: 'latest'}))
            await sale.sendTokensWindow(2, {from: owner});
            set_test_x.get((err, events) => {
                assert.equal(events.length, 1);
                assert.equal(events[0].event, 'TokenETH');
            });
            tokenAfter1 = (await token.balanceOf(client1)).toNumber();
            tokenAfter2 = (await token.balanceOf(client2)).toNumber();
            console.log('Token Balances before W3:client1=',tokenBefore1,' 2=',tokenBefore2);
            console.log('Token Balances after  W3:client1=',tokenAfter1,' 2=',tokenAfter2);
            //assert.equal((110500000).toFixed(4), ((tokenAfter1)/1e18).toFixed(4));
            //assert.equal((110500000).toFixed(4), ((tokenAfter2)/1e18).toFixed(4));
            console.log((await sale.getWtotalEth(0)),' ',(await sale.getWtotalTransCnt(2)),' ',(await sale.getWtoken(2)),' ',(await sale.getWrefundIndex(2)));
        }
        if ((await sale.getWrefundIndex(2)) != (await sale.getWtotalTransCnt)) {
	    tokenBefore1 = (await token.balanceOf(client1)).toNumber();
	    tokenBefore2 = (await token.balanceOf(client2)).toNumber();

            console.log('SEND 444444444!!!');
            console.log('eth=',(await sale.getWtotalEth(2)),' transCnt=',(await sale.getWtotalTransCnt(2)),' tokens=',(await sale.getWtoken(2)),' refIndex=',(await sale.getWrefundIndex(2)));
    
            let set_test_x = (await sale.TokenETH({fromBlock: 0, toBlock: 'latest'}))
            await sale.sendTokensWindow(2, {from: owner});
            set_test_x.get((err, events) => {
                assert.equal(events.length, 1);
                assert.equal(events[0].event, 'TokenETH');
            });
            tokenAfter1 = (await token.balanceOf(client1)).toNumber();
            tokenAfter2 = (await token.balanceOf(client2)).toNumber();
            console.log('Token Balances before W3:client1=',tokenBefore1,' 2=',tokenBefore2);
            console.log('Token Balances after  W3:client1=',tokenAfter1,' 2=',tokenAfter2);
            //assert.equal((110500000).toFixed(4), ((tokenAfter1)/1e18).toFixed(4));
            //assert.equal((110500000).toFixed(4), ((tokenAfter2)/1e18).toFixed(4));
            console.log('eth=',(await sale.getWtotalEth(2)),' transCnt=',(await sale.getWtotalTransCnt(2)),' tokens=',(await sale.getWtoken(2)),' refIndex=',(await sale.getWrefundIndex(2)));
        }
        // close win3
        balance1 = await web3.eth.getBalance(wallet);
        await sale.closeWindow(2, {from: owner});
        balance2 = await web3.eth.getBalance(wallet);
        
        console.log('Balance before=',balance1,' after=',balance2);
        //assert.equal(Math.round((balance2 - balance1)/1e14), 1500e4);

        assert.equal((await sale.getWactive(2)), false);
        assert.equal((await sale.getWactive(3)), true);

    });
*/


});

