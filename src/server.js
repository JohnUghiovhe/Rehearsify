import app from './app.js';
import config from './config/index.js';

const PORT = config.port;

// start the express server
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});