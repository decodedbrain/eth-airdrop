const Web3 = require('web3');
const fs = require('fs');
const Tx = require('ethereumjs-tx');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const log4js = require('log4js');
log4js.configure({
    appenders: { log: { type: 'file', filename: './hash.log' } },
    categories: { default: { appenders: ['log'], level: 'info' } }
});

const logger = log4js.getLogger('log');
web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/mew'));


//transaction price GWEI
const gasPriceGwei = 6;

//GAS limit
const gasLimit = 60000;

//number recipients
const receivers = 400;

//wallet address
const addr = '';

//private key from wallet
const privateKey = '';
const privKey = new Buffer(privateKey, 'hex');

//contract address
const contractAddress = '';

//contract ABI
const abiArray = JSON.parse(fs.readFileSync('contract.json', 'utf-8'));

//recipient addresses
const addresses = JSON.parse(fs.readFileSync('addresses.json', 'utf-8'));


let count = 0;
let amountToSend;

async function sendToken() {

    for (var i = 0; i < addresses.length; i++) {
        if (i < receivers) {

            if (i < 100) {
                amountToSend = 250;
            } else if (i > 99 && i < 200) {
                amountToSend = 125;
            } else if (i > 199 && i < 300) {
                amountToSend = 75;
            } else {
                amountToSend = 50;
            }

            console.log(`COUNT TO START: ${i}\n------------------------`);

            let sendAddr = addresses[i];
            let check_count = web3.eth.getTransactionCount(addr);
            console.log(`CHECK TRANSACTIONS: ${check_count}\n------------------------`);
            console.log(`OLD TRANSACTIONS: ${count}\n------------------------`);

            if (check_count == 0 || check_count > count) {
                count = web3.eth.getTransactionCount(addr);
                console.log(`ADDRESS TO SEND: ${sendAddr}\n------------------------`);

                let contract = web3.eth.contract(abiArray).at(contractAddress);

                let rawTransaction = {
                    "from": addr,
                    "nonce": web3.toHex(count),
                    "gasPrice": web3.toHex(gasPriceGwei * 1e9),
                    "gasLimit": web3.toHex(gasLimit),
                    "to": contractAddress,
                    "value": "0x0",
                    "data": contract.transfer.getData(sendAddr, amountToSend, {from: addr}),

                    //main network
                    "chainId": 0x01
                };

                console.log(`RAW OF TRANSACTION: \n${JSON.stringify(rawTransaction, null, '\t')}\n------------------------`);


                let tx = new Tx(rawTransaction);
                tx.sign(privKey);

                let serializedTx = '0x' + tx.serialize().toString('hex');
                console.log(`ATTEMPTING TO SEND SIGNED TX: \n${serializedTx}\n------------------------`);

                web3.eth.sendRawTransaction(serializedTx, function(err, hash) {
                    if (!err) {
                        console.log(`TRANSACTION: \n${i}\t${sendAddr}\t${hash}\n------------------------`);
                        logger.info(`TRANSACTION: \n${i}\t${sendAddr}\t${hash}\n------------------------`);
                    } else {
                        console.log(err);
                        logger.info(`CHECK: \n${sendAddr}\t${amountToSend}\n------------------------`);
                        //i--;
                    }
                });
            } else {
                i--;
            }
        }

        await delay(90000);
    }
}

sendToken();