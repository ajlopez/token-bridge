
const rskapi = require('rskapi');
const simpleabi = require('simpleabi');
const txs = require('./lib/txs');

const chainname = process.argv[2];
const amount = parseInt(process.argv[3]);

const config = require('../' + chainname + 'conf.json');
const host = rskapi.host(config.host);

async function transferToAccount(host, sender, account, amount) {
    const address = account.address ? account.address : account;
    
    console.log('transferring', amount, 'weis')
    console.log('from', sender.address ? sender.address : sender);
    console.log('to', address);
    
    const txhash = await txs.transfer(host, address, amount, { from: sender });
    
    console.log('tx hash', txhash);
    
    let receipt = await host.getTransactionReceiptByHash(txhash);
    
    while (!receipt)
        receipt = await host.getTransactionReceiptByHash(txhash);
}

(async function() {
    const accounts = await host.getAccounts();
    let sender = accounts[0];
    let init = 0;
    
    if (!sender) {
        sender = config.accounts[0];
        init = 1;
    }
    
    for (let k = init; k < config.accounts.length; k++)
        await transferToAccount(host, sender, config.accounts[k], amount);
    
    for (let k = 0; k < config.members.length; k++)
        await transferToAccount(host, sender, config.members[k], amount);
})();

