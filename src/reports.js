import * as fs from 'fs';
import * as path from 'path';

const checklistKeys = {
  contain_package_json: 'contain_package_json',
  contain_main_js: 'contain_main_js',
  main_js_contain_student_id: 'main_js_contain_student_id',
  root_should_showing_html: 'root_should_showing_html',
  app_port_should_5000: 'app_port_should_5000',
  html_should_contain_h1_and_student_id: 'html_should_contain_h1_and_student_id',
};

const approvalTemplates = '<p>Selamat <strong>$submitter_name</strong>! Kamu telah lolos submission ini!';
const rejectedTemplates = '<p>Maaf <strong>$submitter_name</strong>! Kamu belum berhasil lolos dengan alasan: $reasons';

function writeReportToJSON(report, reportPath) {
  fs.writeFileSync(
    path.join(reportPath, 'report.json'),
    JSON.stringify(report, null, 2),
  );
}

function buildApprovedReport(reportPath, submissionConfig) {
  const { submitter_name: submitterName, id } = submissionConfig;
  const message = approvalTemplates
    .replace('$submitter_name', submitterName);

  const report = {
    submission_id: id,
    message,
    checklist_keys: Object.keys(checklistKeys),
    is_passed: true,
    rating: 5,
    is_draft: false,
  };

  writeReportToJSON(report, reportPath);
}

function buildRejectionReport(rejectedChecklist, reasons, reportPath, submissionConfig) {
  const { submitter_name: submitterName, id } = submissionConfig;
  const checklist = Object.keys(checklistKeys).filter((c) => !rejectedChecklist.includes(c));
  const message = rejectedTemplates
    .replace('$submitter_name', submitterName)
    .replace('$reasons', reasons.join(', '));

  const report = {
    submission_id: id,
    message,
    checklist_keys: checklist,
    is_passed: false,
    rating: 0,
    is_draft: false,
  };

  writeReportToJSON(report, reportPath);
}

function buildReport(checklists, reportPath, submissionConfig) {
  const rejectedChecklist = Object.keys(checklists).filter((key) => !checklists[key].completed);
  const reasons = Object.keys(checklists)
    .map((key) => checklists[key].reason)
    .filter((reason) => reason != null);

  if (rejectedChecklist.length === 0) {
    buildApprovedReport(reportPath, submissionConfig);
    return;
  }

  buildRejectionReport(rejectedChecklist, reasons, reportPath, submissionConfig);
}

export { checklistKeys, buildReport };
