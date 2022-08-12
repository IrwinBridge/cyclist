const {
  getTests,
  writeJson,
  upsertTestStatus,
  checkTestPassed,
  cleanErrorReports
} = require('./utils');
const { run } = require('./runner');

const options = process.argv.slice(2);
const shouldStartFresh = options.includes('fresh');

(async () => {
  if (shouldStartFresh) {
    await cleanErrorReports();
  }
  const tests = await getTests();
  await writeJson({});
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const hasTestPassed = await checkTestPassed(test);
    if (hasTestPassed) {
      await upsertTestStatus(test, 'PASSED');
      continue;
    }
    await upsertTestStatus(test, 'PENDING');
    const status = await run(test);
    await upsertTestStatus(test, status ? 'PASSED' : 'ERROR');
  }
})();
