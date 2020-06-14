import { Router } from 'express';
import packageJson from '../package.json';

const rtBase = Router();

// base
rtBase.get('/', (request, response) => {
  response.send(`t3dapi by rd, v${packageJson.version}`);
});

export default rtBase;
