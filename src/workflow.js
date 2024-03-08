import { execSync, exec } from 'child_process';
import extract from 'esprima-extract-comments';
import terminate from 'terminate';
import { join } from 'path';
import * as fs from 'fs';
import { findFolderPathBaseOnFile, readSubmissionConfig, wait } from './utils.js';
import { buildReport, checklistKeys } from './reports.js';

function buildChecklist() {
  return Object.values(checklistKeys).reduce((prev, value) => Object.assign(prev, { [value]: { completed: true, reason: null } }), {});
}

async function checkNeededFiles(submissionPath) {
  let result = {};

  const projectPath = await findFolderPathBaseOnFile(submissionPath, 'package.json');
  const mainJsPath = await findFolderPathBaseOnFile(projectPath || submissionPath, 'main.js');

  if (projectPath === null) {
    result = Object.assign(result, {
      [checklistKeys.contain_package_json]: {
        completed: false,
        reason: '<p>Kami tidak dapat menemukan berkas <code>package.json</code> pada submission yang kamu kirim.</p>',
      },
    });
  }

  if (mainJsPath === null) {
    result = Object.assign(result, {
      [checklistKeys.contain_main_js]: {
        completed: false,
        reason: '<p>Kami tidak dapat menemukan berkas <code>main.js</code> pada submission yang kamu kirim.</p>',
      },
      [checklistKeys.root_should_showing_html]: { complete: false, reason: null },
      [checklistKeys.app_port_should_5000]: { complete: false, reason: null },
      [checklistKeys.html_should_contain_h1_and_student_id]: { complete: false, reason: null },
      [checklistKeys.main_js_contain_student_id]: { complete: false, reason: null },
    });
  }

  return { result, projectPath, mainJsPath };
}

function isMainJsContainStudentIdComment(mainJsPath, studentId) {
  const filepath = join(mainJsPath, 'main.js');
  const content = fs.readFileSync(filepath).toString();
  const token = extract(content, {});

  if (token.length < 1) {
    return {
      [checklistKeys.main_js_contain_student_id]: {
        completed: false,
        reason: '<p>Kami tidak dapat menemukan komentar yang bernilai user id/student id pada berkas main.js</p>',
      },
    };
  }

  const comments = token.map((t) => t.value.trim());

  if (!comments.includes(String(studentId))) {
    return {
      [checklistKeys.main_js_contain_student_id]: {
        completed: false,
        reason: '<p>Teks komentar yang kamu tuliskan pada berkas main.js bukanlah student id yang kamu miliki. Silakan dicek lagi, ya!</p>',
      },
    };
  }

  return {};
}

function installDependencies(projectPath) {
  execSync('npm install', { cwd: projectPath });
}

async function runApp(mainJsPath, studentId) {
  let cp;
  try {
    cp = exec(`${process.execPath} main.js`, { cwd: mainJsPath });
    await wait(10);
    const response = await fetch('http://localhost:5000');

    if (!response.ok) {
      return {
        [checklistKeys.app_port_should_5000]: {
          completed: false,
          reason: '<p>Kami tidak mendeteksi adanya HTTP server yang berjalan di PORT 5000, mohon diperiksa kembali, ya!</p>',
        },
        [checklistKeys.root_should_showing_html]: { completed: false, reason: null },
        [checklistKeys.html_should_contain_h1_and_student_id]: { completed: false, reason: null },
      };
    }

    if (!response.headers.get('Content-Type').includes('html')) {
      return {
        [checklistKeys.root_should_showing_html]: {
          completed: false,
          reason: `<p>Kami mendeteksi bahwa route / tidak mengembalikan HTML, melainkan ${response.headers.get('Content-Type')}.</p>`,
        },
        [checklistKeys.html_should_contain_h1_and_student_id]: { completed: false, reason: null },
      };
    }

    const responseText = (await response.text()).trim().replace(' ', '');
    const expectedText = `<h1>${studentId}</h1>`;

    if (!responseText.includes(expectedText)) {
      return {
        [checklistKeys.html_should_contain_h1_and_student_id]: {
          completed: false,
          reason: '<p>HTML yang ditampilkan bukanlah heading 1 dengan konten student id yang sesuai.</p>',
        },
      };
    }

    return {};
  } catch (error) {
    return {
      [checklistKeys.app_port_should_5000]: {
        completed: false,
        reason: `<p>Kami gagal menjalankan aplikasimu dengan error ${error.message}!</p>`,
      },
      [checklistKeys.root_should_showing_html]: { completed: false, reason: null },
      [checklistKeys.html_should_contain_h1_and_student_id]: { completed: false, reason: null },
    };
  } finally {
    terminate(cp.pid, 'SIGINT');
  }
}

async function main(submissionPath, reportPath) {
  let checklist = buildChecklist();
  const submissionConfig = readSubmissionConfig(submissionPath);

  const { result: checkNeededFilesResult, projectPath, mainJsPath } = await checkNeededFiles(submissionPath);
  checklist = Object.assign(checklist, checkNeededFilesResult);

  if (projectPath !== null) {
    installDependencies(projectPath);
  }

  if (mainJsPath !== null) {
    const { submitter_id: studentId } = submissionConfig;
    checklist = Object.assign(checklist, isMainJsContainStudentIdComment(mainJsPath, studentId));
    checklist = Object.assign(checklist, await runApp(mainJsPath, studentId));
  }

  buildReport(checklist, reportPath, submissionConfig);
}

export { main };
