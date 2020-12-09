const BandChain = require('@bandprotocol/bandchain.js');
const endpoint = 'http://guanyu-testnet3-query.bandchain.org'

const PAIRS = ['ETH/USD', 'CKB/USD', 'DAI/USD', 'USDT/USD', 'USDC/USD',]
const getTokensRate = async() => {
    const bandchain = new BandChain(endpoint);
    let rate = await bandchain.getReferenceData(PAIRS)
    return rate
}

/*
{
    pair: 'ETH/USD',
    rate: 592.7185,
    updated: { base: 1606875958, quote: 1606876053 }
  }
*/
const getPairInfo = (pairsObj, pairValue) => {
  let rate;
  let timestamp;
  for(let i in pairsObj) {
    if (pairsObj[i].pair == pairValue) {
        rate = pairsObj[i].rate;
        timestamp = pairsObj[i].updated.base;
        break;
    }
}
  return {pairvalue: pairValue, rate, timestamp};
}

module.exports = {getTokensRate, getPairInfo}


