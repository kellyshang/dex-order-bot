const CKB = require('@nervosnetwork/ckb-sdk-core').default
const {DEFAULT_NODE_URL, SUDT_TYPE_SCRIPT, SUDT_CELLDEP_OUTPOINT, ROOT_PRIV_KEY, BOB_PRIV_KEY} = require('../constants/const')
const {IndexerWrapper, BufferParser} = require('../utils')

const ckb = new CKB(DEFAULT_NODE_URL)

/**
 * collect specified cells
 */
const bootstrap = async (command) => {
  const indexerWrapper = new IndexerWrapper();

  const { secp256k1Dep } = await ckb.loadDeps()
  let safeMode;
  const query = { lock: { hashType: 'type', codeHash: secp256k1Dep.codeHash, args: ARGS },};
  if(command == COLLECT_UDT) {
    query.type = SUDT_TYPE_SCRIPT;
    safeMode = false;
  } else if(command == COLLECT_NORMAL) {
    query.type = null;
    query.data = "0x";
    safeMode = true;
  } else if(command == COLLECT_ALL_2_UDT) {
    safeMode = false;
  }
 
  const unspentCells = await indexerWrapper.collectCells(query);
  console.log("cells: ", unspentCells.length, unspentCells[0].capacity);

  let totalInputAmount = 0; 
  let totalUDTAmount = 0n; 
  for ( key in unspentCells) {
    totalInputAmount += parseInt(unspentCells[key].capacity, 16);
    totalUDTAmount += BufferParser.parseAmountFromSUDTData(unspentCells[key].data);
  }
  console.log(`totalInputAmount: ${totalInputAmount} ,
  totalUDTAmount: ${totalUDTAmount}`)
  let fee = BigInt(1000);
  let transferAmnt = BigInt(totalInputAmount) - fee; 

  let txParams = {
    fromAddress: ADDRESS,
    toAddress: ADDRESS,
    capacity: transferAmnt, 
    fee: fee,
    safeMode: safeMode,
    cells: unspentCells,
    deps: secp256k1Dep,
    changeThreshold: BigInt(0),
  } 
  
  if(command == COLLECT_UDT || command == COLLECT_ALL_2_UDT) {
    txParams.deps = [secp256k1Dep, SUDT_CELLDEP_OUTPOINT];
    txParams.outputsData = [BufferParser.writeBigUInt128LE(totalUDTAmount)];
  }
  const rawTx = ckb.generateRawTransaction(txParams)
  if(command == COLLECT_UDT || command == COLLECT_ALL_2_UDT) {
    rawTx.outputs[0].type = SUDT_TYPE_SCRIPT;
  }
  console.log(`collect rawTX: ${JSON.stringify(rawTx)}`)

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

  const signedTx = ckb.signTransaction(PRI_KEY)(rawTx)
  const txHash = await ckb.rpc.sendTransaction(signedTx)
  console.info(`Transaction has been sent with tx hash ${txHash}`)
  return txHash
}

const COLLECT_UDT = "collectUDT";
const COLLECT_NORMAL = "collectNormal";
const COLLECT_ALL_2_UDT = "collectAll2UDT";
let command = process.argv.splice(2)[0]; 

// private key for demo, don't expose it in production
const ALICE_PRI_KEY = ROOT_PRIV_KEY; 
const BOB_PRI_KEY = BOB_PRIV_KEY; 
let PRI_KEY;
if (command == COLLECT_UDT || command == COLLECT_ALL_2_UDT) {
  PRI_KEY = BOB_PRI_KEY;
} else if (command == COLLECT_NORMAL) {
  PRI_KEY = ALICE_PRI_KEY;
}
const PUB_KEY = ckb.utils.privateKeyToPublicKey(PRI_KEY) 
const ARGS = `0x${ckb.utils.blake160(PUB_KEY, 'hex')}` 
const ADDRESS = ckb.utils.pubkeyToAddress(PUB_KEY, {prefix: 'ckt'}) 

console.log(`PUB_KEY: ${PUB_KEY} , 
ARGS: ${ARGS} , 
ADDRESS: ${ADDRESS}`)

bootstrap(command)
