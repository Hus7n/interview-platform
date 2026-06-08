import http from 'http';
import app from './app';
import { env } from './config/env';
import { setupSocket } from './socket';

const server = http.createServer(app);
setupSocket(server);

server.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
