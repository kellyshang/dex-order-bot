const DEFAULT_NODE_URL = 'http://127.0.0.1:8114'
const INDEXER_DB = 'testnet_db'
const INDEXING_TIMEOUT = 30000
const SUDT_TOKEN_ID = '0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902' //sudt type script arg
// ETH address for demo, don't expose it in production
const ALICE_ETH_ADDR = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
const BOB_ETH_ADDR = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const SPLIT_CELLS_NUMBER = 2
// private key for demo, don't expose it in production
const ROOT_PRIV_KEY = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
const BOB_PRIV_KEY = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

const DEFAULT_LOCK_CELLDEP_OUTPOINT = {
  outPoint: {
    txHash: '0xace5ea83c478bb866edf122ff862085789158f5cbff155b7bb5f13058555b708',
    index: '0x0',
  },
  depType: 'depGroup', 
}

const PW_LOCK_CODEHASH = '0xe6acf70d7e336db0368c920a833d9d9f9ca8c3c8aba39f24741c45db435c3e18'
const PW_LOCK_HASHTYPE = 'type'
const PW_LOCK_CELLDEP_OUTPOINT = {
  outPoint: {
    txHash: '0xe4ddfd424edc84211b35cca756ecf1f9708291cf15ae965e38afc45451c7aee1',
    index: '0x0',
  },
  depType: 'code', 
}

const SUDT_CELLDEP_OUTPOINT = {
  outPoint: {
    txHash: '0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769',
    index: '0x0',
  },
  depType: 'code', 
}
const SUDT_TYPE_SCRIPT = {
  args: SUDT_TOKEN_ID, 
  hashType: 'type',
  codeHash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
}

const ORDERBOOK_LOCK_CODEHASH = '0xd3e1c2da541fa74b48e95378753a6e99166a8dc4c4d1b46f714615732460f48a'
const ORDERBOOK_LOCK_TYPE = 'type'
const ORDERBOOK_CELLDEP_OUTPOINT = {
  outPoint: {
    txHash: '0x5aabcb08b8ea52f6a46f4d878b8ff9534ed8d2a5003920d70d1ad400c268a7d3',
    index: '0x0',
  },
  depType: 'code', 
}

// const SECP256K1_CODE_HASH = '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8'

module.exports = {
  ROOT_PRIV_KEY,
  BOB_PRIV_KEY,
  DEFAULT_NODE_URL,
  INDEXER_DB, 
  INDEXING_TIMEOUT, 
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
  ORDERBOOK_CELLDEP_OUTPOINT,
}
