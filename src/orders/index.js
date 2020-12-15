const {
    IndexerWrapper, getCKBSDK, sendTransaction, randomNum, BufferParser,
} = require('../utils');
const {
    ALICE_ETH_ADDR,
    BOB_ETH_ADDR, 
    SPLIT_CELLS_NUMBER, 
    DEFAULT_LOCK_CELLDEP_OUTPOINT,
    PW_LOCK_CODEHASH, 
    PW_LOCK_HASHTYPE,
    PW_LOCK_CELLDEP_OUTPOINT, 
    SUDT_CELLDEP_OUTPOINT, 
    SUDT_TYPE_SCRIPT, 
    ORDERBOOK_LOCK_CODEHASH,
    ORDERBOOK_LOCK_TYPE, 
    ROOT_PRIV_KEY, 
    BOB_PRIV_KEY
} = require('../constants/const');

let indexer;
let deps;
let defaultLockScript;
const occupiedCKBAmnt = 188n * 10n ** 8n; // occupied 187, plus 1 more
// const includFeeInPay = 1n + 3n/1000n; // the fee in Pay amount

const ckb = getCKBSDK();
const privateKey = ROOT_PRIV_KEY;
const publicKey = ckb.utils.privateKeyToPublicKey(privateKey);
const rootPublicKeyHash = `0x${ckb.utils.blake160(publicKey, 'hex')}`;
console.log("rootPublicKeyHash: ", rootPublicKeyHash.length, rootPublicKeyHash); 
console.log("root address: ", ckb.utils.privateKeyToAddress(privateKey, {prefix:'ckt'})) 

const bobPrivateKey = BOB_PRIV_KEY;
const bobPublicKey = ckb.utils.privateKeyToPublicKey(bobPrivateKey);
const bobPublicKeyHash = `0x${ckb.utils.blake160(bobPublicKey, 'hex')}`;
console.log("bobPublicKeyHash: ", bobPublicKeyHash.length, bobPublicKeyHash); 
console.log("bob address: ", ckb.utils.privateKeyToAddress(bobPrivateKey, {prefix:'ckt'})) 

const alicePWEthLock = {
    codeHash: PW_LOCK_CODEHASH, 
    hashType: PW_LOCK_HASHTYPE, 
    args: ALICE_ETH_ADDR, 
};
const alicePWEthLockHash = ckb.utils.scriptToHash(alicePWEthLock);
console.log("pw-alicePWEthLockHash: ", alicePWEthLockHash.length, alicePWEthLockHash); 

const bobPWEthLock = {
    codeHash: PW_LOCK_CODEHASH, 
    hashType: PW_LOCK_HASHTYPE, 
    args: BOB_ETH_ADDR, 
};
const bobPWEthLockHash = ckb.utils.scriptToHash(bobPWEthLock);
console.log("pw-bobPWEthLockHash: ", bobPWEthLockHash.length, bobPWEthLockHash); 

const beforePrepare = async() => {
    indexer = new IndexerWrapper();
    deps = await ckb.loadDeps();
    defaultLockScript = {
        hashType: 'type',
        codeHash: deps.secp256k1Dep.codeHash, 
        args: rootPublicKeyHash, 
    };
}

const pwCellDep = PW_LOCK_CELLDEP_OUTPOINT;
const sudtCellDep = SUDT_CELLDEP_OUTPOINT;

const formatScript = (script) => (script ? {
    args: script.args,
    hashType: script.hashType || script.hash_type,
    codeHash: script.codeHash || script.code_hash,
} : undefined);

const formatCKB = (capacity) => BigInt(capacity) / (10n ** 8n);

const generateRawTx = async (inputs, outputs, cellDeps = []) => {
    const tx = {
        version: '0x0',
        headerDeps: [],
        cellDeps: [
            DEFAULT_LOCK_CELLDEP_OUTPOINT,
            ...cellDeps,
        ],
    };

    tx.inputs = inputs.map((input) => ({
        previousOutput: input.outPoint,
        since: '0x0',
    }));

    tx.outputs = outputs.map((output) => ({
        capacity: output.ckbAmount ? `0x${output.ckbAmount.toString(16)}` : `0x${(BigInt(output.ckb) * 10n ** 8n).toString(16)}`,
        lock: formatScript(output.lock),
        type: formatScript(output.type),
    }));

    tx.outputsData = outputs.map((output) => output.data || '0x');

    tx.witnesses = tx.inputs.map((_, i) => (i > 0 ? '0x' : {
        lock: '',
        inputType: '',
        outputType: '',
    }));

    return tx;
};

const formatOrderData = (currentAmount, orderAmount, price, isBid) => {
    const udtAmountHex = BufferParser.writeBigUInt128LE(currentAmount);
    if (isBid === undefined) {
        return udtAmountHex;
    }
    const orderAmountHex = BufferParser.writeBigUInt128LE(orderAmount).replace('0x', '');
    const priceHex = BufferParser.writeBigUInt128LE(price).replace('0x', '');

    const bidOrAskBuf = Buffer.alloc(1);
    bidOrAskBuf.writeInt8(isBid ? 0 : 1);
    const isBidHex = `${bidOrAskBuf.toString('hex')}`;

    const dataHex = udtAmountHex + orderAmountHex + priceHex + isBidHex;
    return dataHex;
};

const parseOrderData = (hex) => {
    const sUDTAmount = BufferParser.parseAmountFromSUDTData(hex.slice(0, 34));
    const orderAmount = BufferParser.parseAmountFromSUDTData(hex.slice(34, 66));
    const price = BufferParser.parseAmountFromSUDTData(hex.slice(66, 98));
    const isBid = hex.slice(98, 100) === '00';

    return {
        sUDTAmount,
        orderAmount,
        price,
        isBid,
    };
};

const generateCreateOrderTx = async ({
    publicKeyHash,
    sudtCurrentAmount,
    orderAmount,
    price,
    isBid,
    ckbAmount,
}, index) => {
    let cells;
    let normalCellsForAsk;
    if(isBid) { 
        cells = await indexer.collectCells({
            lock: { ...defaultLockScript, args: rootPublicKeyHash }, 
            type: null,
            data: "0x",
        });
        console.log("normal cells length in bid order: ", cells.length)
    } else if (!isBid) { 
        normalCellsForAsk = await indexer.collectCells({
            lock: { ...defaultLockScript, args: bobPublicKeyHash },
            type: null,
            data: "0x",
        });
        console.log("normal cells length in ask order: ", normalCellsForAsk.length)

        cells = await indexer.collectCells({
            lock: { ...defaultLockScript, args: bobPublicKeyHash },
            type: SUDT_TYPE_SCRIPT, 
        });
        console.log("udt cells length in ask order: ", cells.length)
    }

    const outputOrderLock = {
        codeHash: ORDERBOOK_LOCK_CODEHASH,
        hashType: ORDERBOOK_LOCK_TYPE,
        args: publicKeyHash, 
    };

    let inputs = [cells[index]];
    console.log("sudtCurrentAmount: ", sudtCurrentAmount); 
    let changeData;
    let changeOutput;
    changeOutput = {
        ckbAmount: BigInt(cells[index].capacity) - ckbAmount - 10n ** 8n,
        type: null, 
        lock: 
        { ...defaultLockScript, args: rootPublicKeyHash }, 
        data: null, 
    };
    if (isBid) {
        changeData = null;
        changeOutput = {...changeOutput, data: changeData};
    } else if (!isBid) {
        changeData = BufferParser.writeBigUInt128LE(BufferParser.parseAmountFromSUDTData(cells[index].data) - sudtCurrentAmount);
        changeOutput = {
            ckbAmount: BigInt(cells[index].capacity) - ckbAmount - 10n ** 8n,
            type: SUDT_TYPE_SCRIPT, 
            lock: { ...defaultLockScript, args: bobPublicKeyHash }, 
            data: changeData,
        };
    }

    const outputs = [
        {
            ckbAmount,
            lock: outputOrderLock,
            type: SUDT_TYPE_SCRIPT, 
            data: formatOrderData(sudtCurrentAmount, orderAmount, price, isBid),
        },
        changeOutput,
    ];

    const rawTx = await generateRawTx(inputs, outputs, [sudtCellDep, pwCellDep]);
    return rawTx;
};

const createSinglePendingOrderByIndex = async (order, signPrivateKey, index) => {
    let rawTx = await generateCreateOrderTx(order, index);
    console.log("%d, rawTx is : ", index, JSON.stringify(rawTx));
    let txHash;
    txHash = await sendTransaction(ckb.signTransaction(signPrivateKey)(rawTx));
    console.log("txHash is: ", txHash);
};

const sendOrder = async(marketPrice, orderAmount, isBidOrder, index) => {
    console.log("input marketPrice, orderAmount: ", marketPrice, orderAmount, index)
    let bidPrice = BigInt(marketPrice * 10 ** 10) * 10n**10n;; 
    console.log("bidPrice: ", bidPrice)
    let askPrice = BigInt(marketPrice * 10 ** 10) * 10n**10n; 

    let bidOrderAmount = BigInt(orderAmount * 10 ** 8); 
    console.log("orderAmount, bidOrderAmount: ", orderAmount, bidOrderAmount)
    let bidCKBAmount = (bidPrice * bidOrderAmount / 10n**20n);
    console.log("bidCKBAmount: ", bidCKBAmount);

    let askSUDTAmount = BigInt(orderAmount * 10 ** 8); // doesn't include fee
    let askOrderAmount = (askSUDTAmount * askPrice / 10n**20n);
    let askSUDTCurrentAmount = askSUDTAmount + (askSUDTAmount * 3n / 1000n); //include fee
    console.log(`askPrice: ${askPrice}, askSUDTAmount: ${askSUDTAmount}, 
    askOrderAmount: ${askOrderAmount}, askSUDTCurrentAmount: ${askSUDTCurrentAmount}`);
    
    const aliceOrder = {
        publicKeyHash: alicePWEthLockHash, 
        sudtCurrentAmount: 0n,
        orderAmount: bidOrderAmount, 
        price: bidPrice,
        isBid: true,
        ckbAmount: BigInt(bidCKBAmount) + occupiedCKBAmnt, 
    };
    const bobOrder = {
        publicKeyHash: bobPWEthLockHash, 
        sudtCurrentAmount: askSUDTCurrentAmount, 
        orderAmount: askOrderAmount, 
        price: askPrice,
        isBid: false,
        ckbAmount: occupiedCKBAmnt, 
    };

    if (isBidOrder == BATCH_BID) {
        await createSinglePendingOrderByIndex(aliceOrder, privateKey, index);
    } else if(isBidOrder == BATCH_ASK) {
        await createSinglePendingOrderByIndex(bobOrder, bobPrivateKey, index);
    }
}

beforePrepare();
const start = async(marketPrice, ckbOrderAmount, isBidOrder, index) => {
    await sendOrder(marketPrice, ckbOrderAmount, isBidOrder, index);
}

/*
['ETH/USD', 'CKB/USD', 'DAI/USD', 'USDT/USD', 'USDC/USD',]
*/
const BATCH_BID = "batchBid"
const BATCH_ASK = "batchAsk"
var arguments = process.argv.splice(2);
let command = arguments[0];
let tokenPair = arguments[1]
console.log("input tokenPair: ", command, tokenPair);
let targetPrice;
let targetUDTAmount;
const {GetPrice} = require('../price');
GetPrice.getTokensRate().then(
    res=>{ 
        pairInfo = GetPrice.getPairInfo(res, tokenPair);
        console.log("pairInfo: ", pairInfo.pairvalue, pairInfo.rate, pairInfo.timestamp);
        for (let index = 0; index < SPLIT_CELLS_NUMBER; index++) {
            targetPrice = randomNum(0, pairInfo.rate);
            targetUDTAmount = randomNum(10, 30);
            start(targetPrice, targetUDTAmount, command, index);
        }
    }
)
