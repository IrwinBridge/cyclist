require('dotenv').config()
const getenv = require('getenv');
const { readdir, access, writeFile, readFile, unlink, rmdir } = require('fs').promises;

const CY_TESTS_DIR = getenv.string('CY_TESTS_DIR');
const CY_REPORTS_DIR = getenv.string('CY_REPORTS_DIR');
const CY_OUTPUT = getenv.string('CY_OUTPUT');
const CY_DOWNLOADS_DIR = getenv.string('CY_DOWNLOADS_DIR');

const fileExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const getTests = async () => {
  const dirContent = await readdir(CY_TESTS_DIR);
  return dirContent.filter(entry => entry.includes('.test.js'));
};

const writeJson = async (object) => {
  const content = JSON.stringify(object, null, '\t');
  await writeFile(CY_OUTPUT, content);
};

const upsertTestStatus = async (testname, status) => {
  const content = await readFile(CY_OUTPUT);
  const testsObj = JSON.parse(content);
  testsObj[testname] = status;
  await writeJson(testsObj);
};

const checkReportExists = async (test) => {
  const path = `${CY_REPORTS_DIR}/${test}.json`;
  const reportExists = await fileExists(path);
  return reportExists;
};

const checkTestPassed = async (test) => {
  const path = `${CY_REPORTS_DIR}/${test}.json`;
  const reportExists = await fileExists(path);
  if (!reportExists) return false;
  const content = await readFile(path);
  const { fixtures } = JSON.parse(content);
  return !fixtures.some(fixture => fixture.tests.some(test => test.errs.length > 0));
};

const getReports = async () => {
  const dirContent = await readdir(CY_REPORTS_DIR);
  return dirContent.filter(entry => entry.includes('.json'));
};

const cleanErrorReports = async () => {
  const reports = await getReports();
  for (let i = 0; i < reports.length; i++) {
    const testName = reports[i].replace('.json', '');
    const hasTestPassed = await checkTestPassed(testName);
    if (!hasTestPassed) {
      await unlink(`${CY_REPORTS_DIR}/${reports[i]}`);
    }
  }
};

const cleanDownloadsFolder = async () => {
  await rmdir(CY_DOWNLOADS_DIR, { recursive: true });
};

module.exports = {
  fileExists,
  getTests,
  writeJson,
  upsertTestStatus,
  checkReportExists,
  checkTestPassed,
  cleanErrorReports,
  cleanDownloadsFolder
};
