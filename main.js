const {
  getTests,
  writeJson,
  upsertTestStatus,
  checkTestPassed
} = require('./utils');
const { run } = require('./runner');

(async () => {
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
