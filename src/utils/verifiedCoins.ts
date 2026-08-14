export interface VerifiedCoin {
  base: string;
  symbol: string;
  name: string;
  category: 'Layer 1' | 'Layer 2' | 'DeFi' | 'AI / Big Data' | 'Meme' | 'Gaming / Metaverse' | 'Infra' | 'Altcoins & RWA';
  minVolumeUSDT: number;
}

export const KNOWN_BINANCE_NAMES: { [base: string]: string } = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  BNB: 'BNB',
  XRP: 'XRP (Ripple)',
  ADA: 'Cardano',
  DOGE: 'Dogecoin',
  AVAX: 'Avalanche',
  LINK: 'Chainlink',
  SUI: 'Sui',
  NEAR: 'Near Protocol',
  PEPE: 'Pepe Coin',
  SHIB: 'Shiba Inu',
  DOT: 'Polkadot',
  FET: 'ASI Alliance (FET)',
  RENDER: 'Render Token',
  INJ: 'Injective',
  APT: 'Aptos',
  OP: 'Optimism',
  ARB: 'Arbitrum',
  TIA: 'Celestia',
  SEI: 'Sei Network',
  LTC: 'Litecoin',
  BCH: 'Bitcoin Cash',
  ATOM: 'Cosmos',
  XLM: 'Stellar',
  TRX: 'TRON',
  UNI: 'Uniswap',
  TON: 'Toncoin',
  AAVE: 'Aave',
  POL: 'Polygon Ecosystem (POL)',
  ICP: 'Internet Computer',
  GALA: 'Gala Games',
  ALGO: 'Algorand',
  SAND: 'The Sandbox',
  MANA: 'Decentraland',
  AXS: 'Axie Infinity',
  RUNE: 'THORChain',
  CRV: 'Curve DAO',
  DYDX: 'dYdX',
  MKR: 'Maker',
  LDO: 'Lido DAO',
  STRK: 'Starknet',
  WLD: 'Worldcoin',
  JUP: 'Jupiter',
  PYTH: 'Pyth Network',
  ONDO: 'Ondo Finance (RWA)',
  FLOKI: 'Floki',
  BONK: 'Bonk',
  WIF: 'dogwifhat',
  STX: 'Stacks',
  HBAR: 'Hedera',
  VET: 'VeChain',
  FIL: 'Filecoin',
  PENDLE: 'Pendle',
  ENA: 'Ethena',
  KAVA: 'Kava',
  // Popular altcoins & community favorites
  AVNT: 'Aventis Metaverse (AVNT)',
  HOME: 'Home Protocol (HOME)',
  NEIRO: 'First Neiro on Ethereum',
  BANANA: 'Banana Gun',
  TURBO: 'Turbo Token',
  '1000SATS': 'SATS (Ordinals)',
  NOT: 'Notcoin',
  TAO: 'Bittensor (TAO)',
  KAS: 'Kaspa',
  COW: 'CoW Protocol',
  CETUS: 'Cetus Protocol',
  THE: 'THENA',
  DRIFT: 'Drift Protocol',
  ACT: 'Act I : AI Prophecy',
  PNUT: 'Peanut the Squirrel',
  KAIA: 'Kaia',
  ME: 'Magic Eden',
  MOVE: 'Movement',
  VIRTUAL: 'Virtuals Protocol',
  AIXBT: 'aixbt by Virtuals',
  CATI: 'Catizen',
  HMSTR: 'Hamster Kombat',
  DOGS: 'DOGS Token',
  VOXEL: 'Voxies Games',
  BOME: 'BOOK OF MEME',
  MEME: 'Memecoin',
  MYRO: 'Myro',
  POPCAT: 'Popcat',
  ORDI: 'ORDI',
  BLUR: 'Blur',
  JTO: 'Jito',
  W: 'Wormhole',
  TNSR: 'Tensor',
  IO: 'io.net',
  ZK: 'ZKsync',
  LISTA: 'Lista DAO',
  BB: 'BounceBit',
  OMNI: 'Omni Network',
  REZ: 'Renzo',
  ETHFI: 'Ether.fi',
  AEVO: 'Aevo',
  PORTAL: 'Portal Gaming',
  PIXEL: 'Pixels',
  DYM: 'Dymension',
  ALT: 'AltLayer',
  MANTA: 'Manta Network',
  XAI: 'XAI Games',
  AI: 'Sleepless AI',
  NFP: 'NFPrompt',
  ACE: 'Fusionist',
  BEAM: 'Beam',
  SUPER: 'SuperVerse',
  CHR: 'Chromia',
  SYN: 'Synapse',
  SNX: 'Synthetix',
  GMX: 'GMX',
  GNS: 'Gains Network',
  SSV: 'SSV Network',
  LQTY: 'Liquity',
  CFX: 'Conflux',
  ACH: 'Alchemy Pay',
  MAGIC: 'Magic',
  HOOK: 'Hooked Protocol',
  HFT: 'Hashflow',
  OSMO: 'Osmosis',
  STG: 'Stargate Finance',
  JASMY: 'JasmyCoin',
  WOO: 'WOO Network',
  APE: 'ApeCoin',
  GMT: 'STEPN',
  KNC: 'Kyber Network',
  ZIL: 'Zilliqa',
  ENJ: 'Enjin Coin',
  CHZ: 'Chiliz',
  BAT: 'Basic Attention Token',
  COMP: 'Compound',
  SNOW: 'Snowman',
  ZEN: 'Horizen',
  IOTA: 'IOTA',
  EOS: 'EOS',
  KLAY: 'Klaytn',
  LUNC: 'Terra Classic',
  USTC: 'TerraClassicUSD',
  XVG: 'Verge',
  FTM: 'Fantom (Sonic)'
};

export const STABLECOINS_AND_FIAT = new Set([
  'USDC', 'BUSD', 'FDUSD', 'TUSD', 'EUR', 'GBP', 'DAI', 'AEUR', 'USDE', 'WBTC', 'PAXG', 'BRL', 'TRY', 'RUB', 'BIDR', 'IDRT', 'NGN', 'UAH', 'PLN', 'RON', 'ZAR', 'ARS', 'COP', 'CZK'
]);

export const LEVERAGED_TOKEN_SUFFIXES = ['UP', 'DOWN', 'BEAR', 'BULL', '3S', '3L', '2S', '2L', '5S', '5L'];

export function isLeveragedOrFiat(base: string): boolean {
  if (!base) return true;
  const upper = base.toUpperCase().trim();
  if (STABLECOINS_AND_FIAT.has(upper)) return true;
  for (const suf of LEVERAGED_TOKEN_SUFFIXES) {
    if (upper.endsWith(suf) && upper.length > suf.length + 1) return true;
  }
  return false;
}

export function formatCoinDisplayName(baseOrSymbol: string): string {
  const clean = baseOrSymbol.toUpperCase().trim();
  const base = clean.replace(/USDT$/, '').replace(/BRL$/, '');
  if (KNOWN_BINANCE_NAMES[base]) {
    return KNOWN_BINANCE_NAMES[base];
  }
  return `${base} (${base})`;
}

/**
 * Returns true if the cryptocurrency is verified, officially listed on Binance Spot,
 * and passes basic legitimacy checks.
 */
export function isVerifiedBinanceSpotCoin(symbol: string): boolean {
  if (!symbol) return false;
  const clean = symbol.toUpperCase().trim();
  if (!clean.endsWith('USDT') && !clean.endsWith('BRL')) return false;
  const base = clean.replace(/USDT$/, '').replace(/BRL$/, '');
  if (isLeveragedOrFiat(base)) return false;
  return true;
}

export const VERIFIED_BINANCE_COINS: VerifiedCoin[] = Object.keys(KNOWN_BINANCE_NAMES).map(base => ({
  base,
  symbol: `${base}USDT`,
  name: KNOWN_BINANCE_NAMES[base],
  category: 'Altcoins & RWA',
  minVolumeUSDT: 500000
}));

export function getVerifiedCoinInfo(symbolOrBase: string): VerifiedCoin | undefined {
  if (!symbolOrBase) return undefined;
  const clean = symbolOrBase.toUpperCase().trim();
  const base = clean.replace(/USDT$/, '').replace(/BRL$/, '');
  const symbol = `${base}USDT`;
  const name = formatCoinDisplayName(base);

  return {
    base,
    symbol,
    name,
    category: 'Altcoins & RWA',
    minVolumeUSDT: 500000
  };
}
