import * as fs from 'fs';
import { join } from 'path';

async function findFolderPathBaseOnFile(folder, filename) {
  const files = fs.readdirSync(folder).filter((f) => f !== 'node_modules');

  if (files.includes(filename)) {
    return folder;
  }

  return Promise.any(
    files.map((fileOrDir) => findFolderPathBaseOnFile(join(folder, fileOrDir), filename)),
  ).catch(() => Promise.resolve(null));
}

function readSubmissionConfig(submissionPath) {
  return JSON.parse(fs.readFileSync(
    join(submissionPath, 'auto-review-config.json'),
  ).toString());
}

async function wait(seconds = 1) {
  return new Promise((resolve) => { setTimeout(resolve, (seconds * 1000)); });
}

export {
  findFolderPathBaseOnFile, wait, readSubmissionConfig,
};
