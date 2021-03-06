const axios = require('axios');
const { CellCollector } = require('@ckb-lumos/indexer');
const CKB = require('@nervosnetwork/ckb-sdk-core').default;
const {DEFAULT_NODE_URL} = require('../constants/const')

const NODE_URL = DEFAULT_NODE_URL; 

const resetBlocks = async () => {
    const {
        data: {
            result: blockHash,
        },
    } = await axios({
        method: 'post',
        url: NODE_URL,
        data: {
            id: 1,
            jsonrpc: '2.0',
            method: 'get_block_hash',
            params: ['0x0'],
        },
    });
    await axios({
        method: 'post',
        url: NODE_URL,
        data: {
            id: 1,
            jsonrpc: '2.0',
            method: 'truncate',
            params: [blockHash],
        },
    });
};

const generateBlock = async () => axios({
    method: 'post',
    url: NODE_URL,
    data: {
        id: 1,
        jsonrpc: '2.0',
        method: 'generate_block',
        params: [],
    },
});

const commitTxs = async () => {
    await generateBlock();
    await generateBlock();
    await generateBlock();
    await generateBlock();
};

const getTipBlockNumber = async () => axios({
    method: 'post',
    url: NODE_URL,
    data: {
        id: 1,
        jsonrpc: '2.0',
        method: 'get_tip_block_number',
        params: [],
    },
});

const waitForIndexing = async (indexer, timeout = 5000) => {
    if (indexer.running()) {
        indexer.stop();
    }
    indexer.start();
    const { data: { result: nodeTipBlockNumber } } = await getTipBlockNumber();
    console.log("nodeTipBlockNumber is: ", nodeTipBlockNumber);
    const startedAt = Date.now();
    while (true) {
        await new Promise((resolve) => setTimeout(resolve, 10));

        const currentTip = await indexer.tip();
        console.log("currentTip is: ", currentTip);
        if (!currentTip) {
            continue;
        }
        if (BigInt(currentTip.block_number) === BigInt(nodeTipBlockNumber)) {
            break;
        }
        if (Date.now() - startedAt > timeout) {
            throw new Error('waiting for indexing is timeout');
        }
    }
};

const collectCells = async (indexer, lockScript) => {
    await waitForIndexing(indexer);

    const collector = new CellCollector(indexer, {
        lock: {
            code_hash: lockScript.codeHash,
            hash_type: lockScript.hashType,
            args: lockScript.args,
        },
    });

    const cells = [];

    for await (const cell of collector.collect()) {
        cells.push({
            type: cell.cell_output.type || null,
            capacity: cell.cell_output.capacity,
            outPoint: {
                txHash: cell.out_point.tx_hash,
                index: cell.out_point.index,
            },
        });
    }

    return cells;
};

const getCKBSDK = () => {
    const ckb = new CKB(NODE_URL);
    return ckb;
};

const sendTransaction = async (signedTx) => {
    const ckb = getCKBSDK();
    const txHash = await ckb.rpc.sendTransaction(signedTx);
    console.log("txHash is: ", txHash);
    await commitTxs();
    return txHash;
};

const calculateTotalCapacities = (cells) => cells.reduce(
    (total, cell) => total + BigInt(cell.capacity),
    BigInt(0),
);

const randomNum = (Min,Max) =>{
    var Range = Max - Min;
    var Rand = Math.random(); 
    var num = Min + Rand * Range;
    return num.toFixed(4);
  }

module.exports = {
    NODE_URL,
    resetBlocks,
    commitTxs,
    generateBlock,
    getTipBlockNumber,
    waitForIndexing,
    collectCells,
    calculateTotalCapacities,
    sendTransaction,
    getCKBSDK,
    randomNum,
};
