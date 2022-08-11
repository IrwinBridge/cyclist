const { spawn } = require('child_process');
const { checkReportExists, checkTestPassed } = require('./utils');

const E2E_FOLDER = '/Users/oleg/work/lms-e2e';

const workers = [];

const killWorkers = () => {
  workers.forEach((worker) => {
    process.kill(worker.pid)
  })
};

process.on("uncaughtException", killWorkers);
process.on("SIGINT", killWorkers);
process.on("SIGTERM", killWorkers);

const testcafe = async (test) => {
  return new Promise(async (resolve) => {
    const testFilter = `.*${test.replace('.js', '')}.*js`;
    const testcafe = spawn(
      'bash',
      ['testcafe-runner.sh'],
      {
        env: { ...process.env, E2E_FILTER: testFilter },
        cwd: E2E_FOLDER,
      },
    );
    testcafe.stdout.on('data', data => {
      const content = data.toString();
      process.stdout.write(content);
    });
    testcafe.on('close', resolve);
    workers.push(testcafe);
    await waitForReport(test, { TIMEOUT: Infinity });
    resolve(process.kill(testcafe.pid));
  });
};

const waitForReport = async (test, { TIMEOUT }) => {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const intervalId = setInterval(async () => {
      if (Date.now() - startedAt > TIMEOUT) return resolve(false);
      const doesReportExist = await checkReportExists(test);
      if (doesReportExist) {
        const hasTestPassed = await checkTestPassed(test);
        if (hasTestPassed) clearInterval(intervalId);
        return resolve(hasTestPassed);
      }
    }, 1000);
  });
};

module.exports.run = async (test) => {
  await testcafe(test);
  const hasTestPassed = await waitForReport(test, { TIMEOUT: 10000 });
  return hasTestPassed;
};
