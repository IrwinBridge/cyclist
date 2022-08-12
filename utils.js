const { readdir, access, writeFile, readFile, unlink } = require('fs').promises;

const TESTS_DIR = '/Users/oleg/work/lms-e2e/tests';
const REPORTS_DIR = '/Users/oleg/work/e2e-folders/e2e_reports/NA'
const OUTPUT = '/Users/oleg/pets/cycle-test/output.json';

const fileExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const getTests = async () => {
  const dirContent = await readdir(TESTS_DIR);
  return dirContent.filter(entry => entry.includes('.test.js'));
};

const writeJson = async (object) => {
  const content = JSON.stringify(object, null, '\t');
  await writeFile(OUTPUT, content);
};

const upsertTestStatus = async (testname, status) => {
  const content = await readFile(OUTPUT);
  const testsObj = JSON.parse(content);
  testsObj[testname] = status;
  await writeJson(testsObj);
};

const checkReportExists = async (test) => {
  const path = `${REPORTS_DIR}/${test}.json`;
  const reportExists = await fileExists(path);
  return reportExists;
};

const checkTestPassed = async (test) => {
  const path = `${REPORTS_DIR}/${test}.json`;
  const reportExists = await fileExists(path);
  if (!reportExists) return false;
  const content = await readFile(path);
  const { fixtures } = JSON.parse(content);
  return !fixtures.some(fixture => fixture.tests.some(test => test.errs.length > 0));
};

const getReports = async () => {
  const dirContent = await readdir(REPORTS_DIR);
  return dirContent.filter(entry => entry.includes('.json'));
};

const cleanErrorReports = async () => {
  const reports = await getReports();
  for (let i = 0; i < reports.length; i++) {
    const testName = reports[i].replace('.json', '');
    const hasTestPassed = await checkTestPassed(testName);
    if (!hasTestPassed) {
      await unlink(`${REPORTS_DIR}/${reports[i]}`);
    }
  }
};

module.exports = {
  fileExists,
  getTests,
  writeJson,
  upsertTestStatus,
  checkReportExists,
  checkTestPassed,
  cleanErrorReports
};
