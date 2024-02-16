/** @type {import('ts-jest').JestConfigWithTsJest} */
const info = require("../../jest.config.cjs");
const myInfo = info.projects.filter(
  (p) => p.rootDir === "packages/api-client",
)[0];

delete myInfo.rootDir;
delete info.projects;

module.exports = { ...info, ...myInfo };
