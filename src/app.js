import minimist from 'minimist';
import { main } from './workflow.js';

const { s } = minimist(process.argv.slice(2));
const { r = s } = minimist(process.argv.slice(2));
await main(s, r);
