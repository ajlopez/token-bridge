const MainToken = artifacts.require('./MainToken');
const Bridge = artifacts.require('./Bridge');

const expectThrow = require('./utils').expectThrow;

contract('Bridge', function (accounts) {
    const bridgeOwner = accounts[0];
    const tokenOwner = accounts[1];
    const bridgeManager = accounts[2];
    const anAccount = accounts[3];
    const newBridgeManager = accounts[4];
    const tokenAddress = accounts[5];
    const anotherAccount = accounts[6];
    
    describe('bridge with token contract', function () {
        beforeEach(async function () {
            this.token = await MainToken.new("MAIN", "MAIN", 18, 10000, { from: tokenOwner });
            this.bridge = await Bridge.new(bridgeManager, this.token.address, { from: bridgeOwner });
        });
        
        it('check owner', async function () {
            const owner = await this.bridge.owner();
            
            assert.equal(owner, bridgeOwner);
        });
        
        it('check manager', async function () {
            const manager = await this.bridge.manager();
            
            assert.equal(manager, bridgeManager);
        });

        it('check token', async function () {
            const token = await this.bridge.token();
            
            assert.equal(token, this.token.address);
        });

        it('change manager', async function () {
            await this.bridge.changeManager(newBridgeManager, { from: bridgeManager });
            
            const manager = await this.bridge.manager();
            
            assert.equal(manager, newBridgeManager);
        });

        it('only manager can change manager', async function () {
            expectThrow(this.bridge.changeManager(newBridgeManager));
            
            const manager = await this.bridge.manager();
            
            assert.equal(manager, bridgeManager);
        });

        it('accept transfer', async function () {
            await this.token.transfer(this.bridge.address, 1000, { from: tokenOwner });
            
            const tokenBalance = await this.token.balanceOf(tokenOwner);
            assert.equal(tokenBalance, 9000);
            
            const bridgeBalance = await this.token.balanceOf(this.bridge.address);
            assert.equal(bridgeBalance, 1000);

            await this.bridge.acceptTransfer(anAccount, 500, { from: bridgeManager });

            const anAccountBalance = await this.token.balanceOf(anAccount);
            assert.equal(anAccountBalance, 500);
            
            const newBridgeBalance = await this.token.balanceOf(this.bridge.address);
            assert.equal(newBridgeBalance, 500);
        });

        it('accept transfer only manager', async function () {
            await this.token.transfer(this.bridge.address, 1000, { from: tokenOwner });
            
            const tokenBalance = await this.token.balanceOf(tokenOwner);
            assert.equal(tokenBalance, 9000);
            
            const bridgeBalance = await this.token.balanceOf(this.bridge.address);
            assert.equal(bridgeBalance, 1000);

            expectThrow(this.bridge.acceptTransfer(anAccount, 500, { from: bridgeOwner }));
            expectThrow(this.bridge.acceptTransfer(anAccount, 500, { from: anAccount }));

            const anAccountBalance = await this.token.balanceOf(anAccount);
            assert.equal(anAccountBalance, 0);
            
            const newBridgeBalance = await this.token.balanceOf(this.bridge.address);
            assert.equal(newBridgeBalance, 1000);
        });
    });
    
    describe('bridge with token address', function () {
        beforeEach(async function () {
            this.bridge = await Bridge.new(bridgeManager, tokenAddress, { from: bridgeOwner });
        });
        
        it('calling token fallback', async function () {
            const result = await this.bridge.tokenFallback(anAccount, 100, "0x010203", { from: tokenAddress });
            
            assert.ok(result);
        });
        
        it('only token can call token fallback', async function () {
            expectThrow(this.bridge.tokenFallback(anAccount, 100, "0x010203", { from: anAccount }));
        });
    });
    
    describe('bridge maps addresses', function () {
        beforeEach(async function () {
            this.bridge = await Bridge.new(bridgeManager, tokenAddress, { from: bridgeOwner });
        });
        
        it('not mapped address', async function () {
            const result = await this.bridge.getMappedAddress(anAccount);
            
            assert.ok(result);
            assert.equal(result, anAccount);
        });
        
        it('map address', async function () {
            await this.bridge.mapAddress(anotherAccount, { from: anAccount });
            
            const result = await this.bridge.getMappedAddress(anAccount);
            
            assert.ok(result);
            assert.equal(result, anotherAccount);
        });
    });
    
    describe('bridge receives tokens', function () {
        beforeEach(async function () {
            this.token = await MainToken.new("MAIN", "MAIN", 18, 10000, { from: tokenOwner });
            this.bridge = await Bridge.new(bridgeManager, this.token.address, { from: bridgeOwner });
        });
        
        it('receive tokens', async function () {
            await this.token.approve(this.bridge.address, 1000, { from: tokenOwner });
            const result = await this.bridge.receiveTokens(1000, { from: tokenOwner });
            
            assert.ok(result);
            assert.ok(result.logs);
            assert.ok(result.logs[0]),
            assert.equal(result.logs[0].event, 'TransferTo');
            assert.ok(result.logs[0].args);
            assert.equal(result.logs[0].args.receiver, tokenOwner);
            assert.equal(result.logs[0].args.value.toNumber(), 1000);
            
            const balance = await this.token.balanceOf(this.bridge.address);
            
            assert.ok(balance);
            assert.equal(balance, 1000);
        });
        
        it('initial number of events', async function () {
            const noevents = await this.bridge.noEvents();
                        
            assert.equal(noevents, 0);
        });
        
        it('no initial transfer', async function () {
            await expectThrow(this.bridge.transfers(0));
        });
        
        it('cannot receive tokens if not enough balance', async function () {
            await this.token.approve(this.bridge.address, 500, { from: tokenOwner });
            await expectThrow(this.bridge.receiveTokens(1000, { from: tokenOwner }));
            
            const balance = await this.token.balanceOf(this.bridge.address);
            
            assert.ok(balance);
            assert.equal(balance, 0);
        });
        
        it('only bridge owner can change the number of events', async function () {
            await expectThrow(this.bridge.setNoEvents(10, { from: anAccount }));
            
            const noevents = await this.bridge.noEvents();
                        
            assert.equal(noevents, 0);
        });
        
        it('receive tokens with no event', async function () {
            await this.bridge.setNoEvents(10, { from: bridgeOwner });
            await this.token.approve(this.bridge.address, 1000, { from: tokenOwner });
            const result = await this.bridge.receiveTokens(1000, { from: tokenOwner });
            
            assert.ok(result);
            assert.equal(result.logs.length, 0);
            
            const balance = await this.token.balanceOf(this.bridge.address);
            
            assert.ok(balance);
            assert.equal(balance, 1000);
        });
    });
});

