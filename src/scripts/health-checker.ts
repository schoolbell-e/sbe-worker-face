import express from 'express';
import Mysql from '../shared/servers/Mysql';
const app = express();
const port = 8080;

// see https://cloud.ibm.com/docs/cloud-native?topic=cloud-native-healthcheck

app.use('/health', async(req, res) => {
  // dependant on Mysql
  const bool = await Mysql.healthcheck();
  if (bool) res.json({ status: 'Up' });
  else res.status(500).json({ status: 'Errored' });
  // if (Mysql.isReady === false) res.status(503).json({ status: 'Starting' });
  // else if (Mysql.isReady === true) res.json({ status: 'Up' });
  // else res.status(500).json({ status: 'Errored' });
});
app.use('/liveness', async(req, res) => {
  // dependant on Mysql
  const bool = await Mysql.healthcheck();
  if (bool) res.json({ status: 'Up' });
  else res.status(500).json({ status: 'Errored' });
  // if (Mysql.isReady === false) res.json({ status: 'Starting' });
  // else if (Mysql.isReady === true) res.json({ status: 'Up' });
  // else res.status(500).json({ status: 'Errored' });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});
const healthchecker = app.listen(port, () => {
  console.log(`Healthcheck service listening at http://localhost:${port}`);
});

export default healthchecker;
