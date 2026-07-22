import app from './app.js';
import config from './config/index.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});