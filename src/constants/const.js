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
    txHash: '0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37',
    index: '0x0',
  },
  depType: 'depGroup', 
}

const PW_LOCK_CODEHASH = '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63'
const PW_LOCK_HASHTYPE = 'type'
const PW_LOCK_CELLDEP_OUTPOINT = {
  outPoint: {
    txHash: '0x57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38',
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

const ORDERBOOK_LOCK_CODEHASH = '0x279bee9fa98959029766c0e0ce19cd91b7180fd15b600a9e95140149b524c53b'
const ORDERBOOK_LOCK_TYPE = 'type'
const ORDERBOOK_CELLDEP_OUTPOINT = {
  outPoint: {
    txHash: '0xca5a05802b7f93f4f3b5f371df0c7b6d5a05104563aabfa339747f78793b32f6',
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
