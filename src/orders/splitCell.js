const CKB = require('@nervosnetwork/ckb-sdk-core').default
const {DEFAULT_NODE_URL, SUDT_TYPE_SCRIPT, SUDT_CELLDEP_OUTPOINT, ROOT_PRIV_KEY, BOB_PRIV_KEY} = require('../constants/const')
const {SPLIT_CELLS_NUMBER} = require('../constants/const')
const {IndexerWrapper, BufferParser} = require('../utils')

const ckb = new CKB(DEFAULT_NODE_URL)

/**
 * split specified cell
 */
const bootstrap = async () => {
  const indexerWrapper = new IndexerWrapper();

  const { secp256k1Dep } = await ckb.loadDeps()
  let safeMode;
  const query = { lock: { hashType: 'type', codeHash: secp256k1Dep.codeHash, args: ARGS },};
  if (command == SPLIT_NORMAL) {
    query.type = null;
    query.data = "0x";
    safeMode = true;
  } else if (command == SPLIT_UDT) {
    query.type = SUDT_TYPE_SCRIPT;
    safeMode = false;
  }
  const unspentCells = await indexerWrapper.collectCells(query);

  console.log("cells: ", unspentCells.length, unspentCells[0].capacity); 

  let splitNum = BigInt(SPLIT_CELLS_NUMBER); 
  let inputAmount = parseInt(unspentCells[0].capacity, 16)
  let udtInputAmount = BufferParser.parseAmountFromSUDTData(unspentCells[0].data);
  console.log(`udtInputAmount is: ${udtInputAmount}`)
  let fee = 120000n;
  let transferAmnt = (BigInt(inputAmount) - fee)/splitNum;
  let transferUDTAmnt = udtInputAmount/splitNum;

  let txParams = {
    fromAddress: ADDRESS,
    toAddress: ADDRESS,
    capacity: transferAmnt, 
    fee: fee,
    safeMode: safeMode,
    cells: unspentCells,
    deps: secp256k1Dep,
    capacityThreshold: BigInt(0),
    changeThreshold: BigInt(0),
  }
  if(command == SPLIT_UDT) {
    txParams.deps = [secp256k1Dep, SUDT_CELLDEP_OUTPOINT];
    txParams.outputsData = [BufferParser.writeBigUInt128LE(transferUDTAmnt)];
  }
  let rawTx = ckb.generateRawTransaction(txParams)

rawTx.outputs[1].capacity = transferAmnt; 
if (command == SPLIT_UDT) {
  rawTx.outputsData[1] = BufferParser.writeBigUInt128LE(transferUDTAmnt) 
}
  for (let index = 0; index < splitNum - 2n; index++) {
      rawTx.outputs.push({
          lock: {
            args: unspentCells[0].lock.args,
            codeHash: unspentCells[0].lock.code_hash,
            hashType: unspentCells[0].lock.hash_type,
          }, 
          capacity: transferAmnt, 
      })
      if (command == SPLIT_NORMAL) {
        rawTx.outputsData.push('0x')
      } else if (command == SPLIT_UDT) {
        rawTx.outputsData.push(BufferParser.writeBigUInt128LE(transferUDTAmnt))
      }
      rawTx.witnesses.push('0x')
  }
  
  if(command == SPLIT_UDT) {
    for (const key in rawTx.outputs) {
      rawTx.outputs[key].type = SUDT_TYPE_SCRIPT;
    }
  }

  console.info(
    `inputs capacity:
    ${rawTx.inputs
      .map(
        input =>
          unspentCells.find(
            cell =>
              cell.outPoint.txHash === input.previousOutput.txHash &&
              cell.outPoint.index === input.previousOutput.index,
          ).capacity,
      )
      .map(capacity => BigInt(capacity))}
    `,
  )
  console.info(
    `outputs capacity: ${rawTx.outputs.map(output => BigInt(output.capacity))}`,
  )

  console.log("split rawTx is: ", rawTx)

  const signedTx = ckb.signTransaction(PRI_KEY)(rawTx)
  const txHash = await ckb.rpc.sendTransaction(signedTx)
  console.info(`Transaction has been sent with tx hash ${txHash}`)
  return txHash
}

const SPLIT_UDT = "splitUDT";
const SPLIT_NORMAL = "splitNormal";
let command = process.argv.splice(2)[0];

// private key for demo, don't expose it in production
const ALICE_PRI_KEY = ROOT_PRIV_KEY; 
const BOB_PRI_KEY = BOB_PRIV_KEY; 
let PRI_KEY;
if (command == SPLIT_UDT ) {
  PRI_KEY = BOB_PRI_KEY;
} else if (command == SPLIT_NORMAL) {
  PRI_KEY = ALICE_PRI_KEY;
}
const PUB_KEY = ckb.utils.privateKeyToPublicKey(PRI_KEY) 
const ARGS = `0x${ckb.utils.blake160(PUB_KEY, 'hex')}` 
const ADDRESS = ckb.utils.pubkeyToAddress(PUB_KEY, {prefix: 'ckt'}) 

console.log(`PUB_KEY: ${PUB_KEY} , 
ARGS: ${ARGS} , 
ADDRESS: ${ADDRESS}`)

bootstrap(command)
