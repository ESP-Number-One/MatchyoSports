import { beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import type { Scores } from "@esp-group-one/types";
import { newAPISuccess, ObjectId, Sport } from "@esp-group-one/types";
import { getMatch, IDS } from "@esp-group-one/test-helpers";
import { fetchMockEndpointOnce, runErrorTests } from "../helpers/utils.js";
import { APIClient } from "../../src/client.js";
import type { MatchAPIClient } from "../../src/sub/match.js";
import { fetchMock } from "../helpers/fetch_mock.js";

fetchMock.enableMocks();
beforeEach(() => {
  fetchMock.resetMocks();
});

let api: MatchAPIClient;
beforeAll(() => {
  api = new APIClient("gimmeaccess").match();
});

describe("findProposed", () => {
  const resObj = [
    getMatch({ sport: Sport.Tennis }),
    getMatch({ sport: Sport.Squash }),
  ];

  const endpoint = `match/find/proposed`;
  test("Normal", async () => {
    const body = { pageSize: 10 };
    fetchMockEndpointOnce(endpoint, newAPISuccess(resObj), { body });

    await expect(api.findProposed(body)).resolves.toStrictEqual(resObj);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  runErrorTests(endpoint, () => api.findProposed({}));
});

describe("accept", () => {
  const id = new ObjectId(IDS[0]);
  const resObj = undefined;
  const endpoint = `match/${IDS[0]}/accept`;
  test("Normal", async () => {
    fetchMockEndpointOnce(endpoint, newAPISuccess(resObj));

    await expect(api.accept(id)).resolves.toStrictEqual(resObj);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  runErrorTests(endpoint, () => api.accept(id));
});

describe("cancel", () => {
  const id = new ObjectId(IDS[0]);
  const resObj = undefined;
  const endpoint = `match/${IDS[0]}/cancel`;
  test("Normal", async () => {
    fetchMockEndpointOnce(endpoint, newAPISuccess(resObj), {
      body: undefined,
    });

    await expect(api.cancel(id)).resolves.toStrictEqual(resObj);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  runErrorTests(endpoint, () => api.cancel(id));
});

describe("complete", () => {
  const id = new ObjectId(IDS[0]);
  const resObj = undefined;
  const endpoint = `match/${IDS[0]}/complete`;
  test("Normal", async () => {
    const body: Scores = {};
    body[id.toString()] = 20;
    body[IDS[1]] = 5;

    fetchMockEndpointOnce(endpoint, newAPISuccess(resObj), {
      body,
    });

    await expect(api.complete(id, body)).resolves.toStrictEqual(resObj);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  runErrorTests(endpoint, () => api.complete(id, {}));
});

describe("message", () => {
  const id = new ObjectId(IDS[0]);
  const resObj = undefined;
  const endpoint = `match/${IDS[0]}/message`;
  test("Normal", async () => {
    const message = "Hi!";

    fetchMockEndpointOnce(endpoint, newAPISuccess(resObj), {
      body: { message },
    });

    await expect(api.message(id, message)).resolves.toStrictEqual(resObj);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  runErrorTests(endpoint, () => api.message(id, ""));
});

describe("rate", () => {
  const id = new ObjectId(IDS[0]);
  const resObj = undefined;
  const endpoint = `match/${IDS[0]}/rate`;

  test("Normal", async () => {
    fetchMockEndpointOnce(endpoint, newAPISuccess(resObj), {
      body: { stars: 5 },
    });

    await expect(api.rate(id, 5)).resolves.toStrictEqual(resObj);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  runErrorTests(endpoint, () => api.rate(id, 2));
});
