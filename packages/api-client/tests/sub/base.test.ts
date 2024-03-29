import { beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import type { Query } from "@esp-group-one/types";
import { newAPISuccess, ObjectId } from "@esp-group-one/types";
import { IDS } from "@esp-group-one/test-helpers";
import { SubAPIClient } from "../../src/sub/base.js";
import { fetchMockEndpointOnce, runErrorTests } from "../helpers/utils.js";
import { fetchMock } from "../helpers/fetch_mock.js";

fetchMock.enableMocks();
beforeEach(() => {
  fetchMock.resetMocks();
});

interface Test {
  name: string;
  num: number;
  arr: string[];
  obj: { name: string; num: number };
}

interface CensoredTest {
  name: string;
  num: number;
}

interface TestCreation {
  name: string;
  arr: string[];
}

type TestQuery = Query<{
  name: string;
}>;

class TestAPIClient extends SubAPIClient<
  Test,
  CensoredTest,
  TestCreation,
  TestQuery
> {}

describe("create", () => {
  let api: TestAPIClient;
  beforeAll(() => {
    api = new TestAPIClient("gimmeaccess");
  });

  const creation: TestCreation = { name: "Hi there", arr: ["hi", "yo"] };
  const resObj = {
    ...creation,
    num: 12,
    obj: { name: "test", num: 1 },
  };

  test("Normal", async () => {
    fetchMockEndpointOnce("new", newAPISuccess(resObj), { body: creation });

    const res = await api.create(creation);
    expect(res).toStrictEqual(resObj);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  runErrorTests("new", () => api.create(creation));
});

describe("find", () => {
  let api: TestAPIClient;
  beforeAll(() => {
    api = new TestAPIClient("gimmeaccess");
  });

  const query: TestQuery = { name: { $in: ["hi"] } };
  const body = { query, pageStart: 10 };

  const resObj: CensoredTest[] = [
    { name: "hi", num: 12 },
    { name: "yo", num: 11 },
  ];

  test("Normal", async () => {
    fetchMockEndpointOnce("find", newAPISuccess(resObj), { body });

    const res = await api.find(body);
    expect(res).toStrictEqual(resObj);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  runErrorTests("find", () => api.find(body));
});

describe("get", () => {
  let api: TestAPIClient;
  beforeAll(() => {
    api = new TestAPIClient("gimmeaccess");
  });

  const id = new ObjectId(IDS[0]);
  const resObj: CensoredTest = { name: "hi", num: 12 };

  test("Normal", async () => {
    fetchMockEndpointOnce(id.toString(), newAPISuccess(resObj));

    const res = await api.getId(id);
    expect(res).toStrictEqual(resObj);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  runErrorTests(id.toString(), () => api.getId(id));
});
