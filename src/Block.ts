import sha256 from 'crypto-js/sha256';
import { broadcastLatest } from './communication';

export class Block {
  // The height of the block in the blockchain
  public index: number;
  // A sha256 hash taken from the content of the block
  public hash: string;
  // A reference to the hash of the previous block. This value explicitly defines the previous block
  public previousHash: string;
  // A timestamp for block-creation (or epoch of block)
  public timestamp: number;
  // Any data contained within this block
  public data: string;

  constructor(
    index: number,
    hash: string,
    previousHash: string,
    timestamp: number,
    data: string
  ) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.hash = hash;
  }
}

/**
 * Genesis block is the first block in the blockchain.
 * It is the only block that has no previousHash.
 * This is currently hard coded
 */
const genesisBlock: Block = new Block(
  0,
  '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7',
  '',
  1465154705,
  'The journey starts here.'
);

/**
 * TODO: in-memory Javascript array to store the blockchain.
 * This means that the data will not be persisted when the node is terminated.
 */
let blockchain: Block[] = [genesisBlock];
export const getBlockchain = (): Block[] => blockchain;
export const getLatestBlock = (): Block => blockchain[blockchain.length - 1];

/**
 * The hash is calculated over all data of the block. This means that if anything in the block changes,
 * the original hash is no longer valid. The block hash can also be thought as the unique identifier of the block.
 * For instance, blocks with same index can appear, but they all have unique hashes.
 */
const calculateHash = (
  index: number,
  previousHash: string,
  timestamp: number,
  data: string
): string => sha256(index + previousHash + timestamp + data).toString();

const calculateHashForBlock = (block: Block): string =>
  calculateHash(block.index, block.previousHash, block.timestamp, block.data);

export const generateNextBlock = (blockData: string) => {
  const previousBlock: Block = getLatestBlock();
  const nextIndex: number = previousBlock.index + 1;
  const nextTimestamp: number = new Date().getTime() / 1000;
  const nextHash: string = calculateHash(
    nextIndex,
    previousBlock.hash,
    nextTimestamp,
    blockData
  );
  const newBlock: Block = new Block(
    nextIndex,
    nextHash,
    previousBlock.hash,
    nextTimestamp,
    blockData
  );
  return newBlock;
};

/**
 * For a block to be valid the following must apply:
 * - The index of the block must be one number larger than the previous
 * - The previousHash of the block match the hash of the previous block
 * - The hash of the block itself must be valid
 */
const isValidNewBlock = (newBlock: Block, previousBlock: Block) => {
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log('invalid index');
    return false;
  } else if (previousBlock.hash !== newBlock.previousHash) {
    console.log('invalid previoushash');
    return false;
  } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
    console.log(
      typeof newBlock.hash + ' ' + typeof calculateHashForBlock(newBlock)
    );
    console.log(
      'invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash
    );
    return false;
  }
  return true;
};

/**
 * Used to validate the input parameters of a block.
 */
export const isValidBlockStructure = (block: Block): boolean => (
  typeof block.index === 'number' &&
  typeof block.hash === 'string' &&
  typeof block.previousHash === 'string' &&
  typeof block.timestamp === 'number' &&
  typeof block.data === 'string'
);

const isValidGenesis = (block: Block): boolean =>
  JSON.stringify(block) === JSON.stringify(genesisBlock);

const isValidChain = (blockchainToValidate: Block[]): boolean => {
  if (!isValidGenesis(blockchainToValidate[0])) {
    return false;
  }

  for (let i = 1; i < blockchainToValidate.length; i++) {
    if (
      !isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])
    ) {
      return false;
    }
  }

  return true;
};

export const addBlockToChain = (newBlock: Block) => {
  if (isValidNewBlock(newBlock, getLatestBlock())) {
    blockchain.push(newBlock);
    return true;
  }
  return false;
};

// In case of conflicts (e.g. two nodes both generate the same indexed block)
// we choose the chain that has the longest number of blocks
export const replaceChain = (newBlocks: Block[]) => {
  if (isValidChain(newBlocks) && newBlocks.length > getBlockchain().length) {
    console.log(
      'Received blockchain is valid. Replacing current blockchain with received blockchain'
    );
    blockchain = newBlocks;
    broadcastLatest();
  } else {
    console.log('Received blockchain invalid');
  }
};
