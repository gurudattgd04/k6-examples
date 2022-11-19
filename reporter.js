const reporter = require("k6-html-reporter");

const options = {
  jsonFile: "newJson.json",
  output: "performance-report.html",
};

reporter.generateSummaryReport(options);
