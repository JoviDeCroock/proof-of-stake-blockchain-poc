import polka from 'polka';
import { getBlockchain, generateNextBlock, Block } from './Block';
import { getSockets, connectToPeers, initP2PServer } from './communication';

const app = polka();

app.get('/blocks', (_req, res) => {
  res.end(JSON.stringify(getBlockchain()));
});

app.get('/peers', (_req, res) => {
  res.send(JSON.stringify(getSockets()));
});

app.post('/mint', (req, res) => {
  const newBlock: Block = generateNextBlock(req.body.data);
  res.send(JSON.stringify(newBlock));
});

app.post('/peer', (req, res) => {
  const newPeer = JSON.stringify(connectToPeers(req.body.peer));
  res.send(JSON.stringify(newPeer));
});

app.listen(3000, () => {
  console.log('Blockchain listening on port 3000.');
});

initP2PServer(3001, () => {
  console.log('P2P server listening on port 3001.');
});
