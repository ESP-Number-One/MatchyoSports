import type {
  ID,
  Match,
  MatchPageOptions,
  MatchProposal,
  Message,
  Scores,
} from "@esp-group-one/types";
import { MatchStatus, ObjectId, Sport } from "@esp-group-one/types";
import { describe, expect, test } from "@jest/globals";
import { IDS, OIDS, addMatch } from "@esp-group-one/test-helpers";
import type { Moment } from "moment";
import moment from "moment";
import { addCommonTests, setup } from "../helpers/controller.js";
import { expectAPIRes } from "../helpers/utils.js";
import { app } from "../../src/app.js";
import { TestUser } from "../helpers/user.js";

const db = setup();

jest.mock("access-token-jwt");

jest.mock("moment", () => {
  return (param?: string) =>
    jest.requireActual<(inp: string) => Moment>("moment")(
      param ?? "2020-01-01T00:00:00.000Z",
    );
});

const creationStartDate = new Date().toString();

const user = new TestUser(db, "github|111112");
const opponent = new TestUser(db, "github|111113");

describe("accept", () => {
  test("done", async () => {
    const match = await addMatch(db.get(), {
      status: MatchStatus.Request,
      players: [OIDS[0], user.id()],
    });

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/accept`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual({
      success: true,
    });

    const matches = await db.get().matches();
    const updateMatch = await matches.get(match._id);
    expect(updateMatch?.status).toBe(MatchStatus.Accepted);
  });

  test("match already accepted", async () => {
    const match = await addMatch(db.get(), {
      status: MatchStatus.Accepted,
      players: [OIDS[0], user.id()],
    });

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/accept`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toStrictEqual({
      success: false,
      error: "The match is already accepted",
    });
  });

  test("match doesn't exist", async () => {
    const res = await user.request(app).post(`/match/${IDS[0]}/accept`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toStrictEqual({
      success: false,
      error: "Failed to get obj",
    });
  });

  test("user is owner", async () => {
    const match = await addMatch(db.get(), {
      status: MatchStatus.Accepted,
      players: [user.id(), OIDS[0]],
      owner: user.id(),
    });

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/accept`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toStrictEqual({
      success: false,
      error: "Failed to get obj",
    });
  });

  test("user not in players", async () => {
    const match = await addMatch(db.get(), {
      status: MatchStatus.Accepted,
      players: [OIDS[0], OIDS[1]],
    });

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/accept`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toStrictEqual({
      success: false,
      error: "Failed to get obj",
    });
  });
});

describe("cancel", () => {
  test("success", async () => {
    const toBeDeleted = await addMatch(db.get(), {
      players: [user.id(), opponent.id()],
    });
    const expected = await addMatch(db.get());

    const res = await user
      .request(app)
      .post(`/match/${toBeDeleted._id.toString()}/cancel`)
      .set("Authorization", "Bearer test_api_token");

    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual({ success: true });

    expect(await (await db.get().matches()).find({})).toStrictEqual([expected]);
  });

  test("doesn't exist", async () => {
    const res = await user
      .request(app)
      .post(`/match/${IDS[1]}/cancel`)
      .set("Authorization", "Bearer test_api_token");

    expect(res.statusCode).toBe(404);
    expect(res.body).toStrictEqual({
      success: false,
      error: "Failed to get obj",
    });
  });

  test("not in players", async () => {
    const match = await addMatch(db.get(), {
      status: MatchStatus.Accepted,
    });

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/cancel`)
      .set("Authorization", "Bearer test_api_token");

    expect(res.statusCode).toBe(404);
    expect(res.body).toStrictEqual({
      success: false,
      error: "Failed to get obj",
    });
  });

  test("In completed state", async () => {
    const match = await addMatch(db.get(), {
      status: MatchStatus.Complete,
      players: [user.id(), opponent.id()],
    });

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/cancel`)
      .set("Authorization", "Bearer test_api_token");

    expect(res.statusCode).toBe(400);
    expect(res.body).toStrictEqual({
      success: false,
      error: "The match is has completed",
    });
  });
});

describe("complete", () => {
  test("success", async () => {
    const match = await addMatch(db.get(), {
      status: MatchStatus.Accepted,
      players: [user.id(), opponent.id()],
      date: moment().subtract(1, "hour").toISOString(),
    });

    const scores: Scores = newScores([
      [user.id().toString(), 10],
      [opponent.id().toString(), 5],
    ]);

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/complete`)
      .send(scores);

    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual({
      success: true,
    });

    const matches = await db.get().matches();
    const updateMatch = await matches.get(match._id);
    expect(updateMatch?.status).toBe(MatchStatus.Complete);
    if (updateMatch?.status === MatchStatus.Complete) {
      expect(updateMatch.score).toStrictEqual(scores);
    }
  });

  test("doesn't exist", async () => {
    const scores: Scores = newScores([
      [user.id().toString(), 10],
      [IDS[0], 5],
    ]);
    const res = await user
      .request(app)
      .post(`/match/${IDS[1]}/complete`)
      .send(scores);

    expect(res.statusCode).toBe(404);
    expect(res.body).toStrictEqual({
      success: false,
      error: "Failed to get obj",
    });
  });

  test("not in players", async () => {
    const match = await addMatch(db.get(), {
      status: MatchStatus.Accepted,
    });

    const scores: Scores = newScores([
      [user.id().toString(), 10],
      [opponent.id().toString(), 5],
    ]);

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/complete`)
      .send(scores);

    expect(res.statusCode).toBe(404);
    expect(res.body).toStrictEqual({
      success: false,
      error: "Failed to get obj",
    });
  });

  describe("not in accepting state", () => {
    [MatchStatus.Complete, MatchStatus.Request].forEach((status) => {
      test(status.toString(), async () => {
        const match = await addMatch(db.get(), {
          status,
          players: [user.id(), opponent.id()],
        });

        const scores: Scores = newScores([
          [user.id().toString(), 10],
          [opponent.id().toString(), 5],
        ]);

        const res = await user
          .request(app)
          .post(`/match/${match._id.toString()}/complete`)
          .send(scores);

        expect(res.statusCode).toBe(400);
        expect(res.body).toStrictEqual({
          success: false,
          error: "The match is not in accepted state",
        });
      });
    });
  });

  test("before completion date", async () => {
    const match = await addMatch(db.get(), {
      status: MatchStatus.Accepted,
      players: [user.id(), opponent.id()],
      date: moment().add(1, "week").toISOString(),
    });

    const scores: Scores = newScores([
      [user.id().toString(), 10],
      [opponent.id().toString(), 5],
    ]);

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/complete`)
      .send(scores);

    expect(res.statusCode).toBe(400);
    expect(res.body).toStrictEqual({
      success: false,
      error: "The match has not started",
    });
  });

  describe("invalid scores", () => {
    test("duplicate players", async () => {
      const match = await addMatch(db.get(), {
        status: MatchStatus.Accepted,
        players: [user.id(), opponent.id()],
        date: moment().subtract(1, "hour").toISOString(),
      });

      const scores: Scores = newScores([
        [user.id().toString(), 10],
        [user.id().toString(), 5],
      ]);

      const res = await user
        .request(app)
        .post(`/match/${match._id.toString()}/complete`)
        .send(scores);

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        success: false,
        error: "The number of scores + players does not match",
      });
    });

    test("with players not in match", async () => {
      const match = await addMatch(db.get(), {
        status: MatchStatus.Accepted,
        players: [user.id(), opponent.id()],
        date: moment().subtract(1, "hour").toISOString(),
      });

      const scores: Scores = newScores([
        [user.id().toString(), 10],
        [IDS[1], 5],
      ]);

      const res = await user
        .request(app)
        .post(`/match/${match._id.toString()}/complete`)
        .send(scores);

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        success: false,
        error: "The number of scores + players does not match",
      });
    });

    test("with less players", async () => {
      const match = await addMatch(db.get(), {
        status: MatchStatus.Accepted,
        players: [user.id(), opponent.id()],
        date: moment().subtract(1, "hour").toISOString(),
      });

      const scores: Scores = newScores([[user.id().toString(), 10]]);

      const res = await user
        .request(app)
        .post(`/match/${match._id.toString()}/complete`)
        .send(scores);

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        success: false,
        error: "The number of scores + players does not match",
      });
    });
  });
});

describe("message", () => {
  test("success", async () => {
    const match = await addMatch(db.get(), {
      players: [user.id(), opponent.id()],
    });

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/message`)
      .send({ message: "Hi there" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual({ success: true });

    const updatedMatch = await (await db.get().matches()).get(match._id);
    expect(updatedMatch?.messages).toStrictEqual([
      {
        date: moment().toISOString(),
        sender: user.id(),
        text: "Hi there",
      },
    ] as Message[]);
  });

  test("doesn't exist", async () => {
    const res = await user
      .request(app)
      .post(`/match/${IDS[1]}/message`)
      .send({ message: "Hi there" })
      .set("Authorization", "Bearer test_api_token");

    expect(res.statusCode).toBe(404);
    expect(res.body).toStrictEqual({
      success: false,
      error: "Failed to get obj",
    });
  });

  test("not in players", async () => {
    const match = await addMatch(db.get(), {
      status: MatchStatus.Accepted,
    });

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/message`)
      .send({ message: "Hi there" })
      .set("Authorization", "Bearer test_api_token");

    expect(res.statusCode).toBe(404);
    expect(res.body).toStrictEqual({
      success: false,
      error: "Failed to get obj",
    });
  });

  describe("not in accepting state", () => {
    [MatchStatus.Complete, MatchStatus.Request].forEach((status) => {
      test(status.toString(), async () => {
        const match = await addMatch(db.get(), {
          status,
          players: [user.id(), opponent.id()],
        });

        const res = await user
          .request(app)
          .post(`/match/${match._id.toString()}/message`)
          .send({ message: "hi there" })
          .set("Authorization", "Bearer test_api_token");

        expect(res.statusCode).toBe(400);
        expect(res.body).toStrictEqual({
          success: false,
          error: "The match is not in an accepting state",
        });
      });
    });
  });
});

describe("new", () => {
  test("with yourself", async () => {
    const res = await user
      .request(app)
      .post("/match/new")
      .send(getMatchProposal({ to: user.id() }));

    expect(res.status).toBe(400);
    expect(res.body).toStrictEqual({
      success: false,
      error: "You cannot propose a match with yourself!",
    });
  });

  test("invalid time string", async () => {
    const res = await user
      .request(app)
      .post("/match/new")
      .send(getMatchProposal({ date: "1982374121897236187" }));

    expect(res.status).toBe(400);
    expect(res.body).toStrictEqual({
      error: "Invalid date",
      success: false,
    });
  });

  test("in the past", async () => {
    const res = await user
      .request(app)
      .post("/match/new")
      .send(
        getMatchProposal({ date: moment().subtract(1, "week").toISOString() }),
      )
      .set("Authorization", "Bearer test_api_thing");

    expect(res.status).toBe(400);
    expect(res.body).toStrictEqual({
      error: "Invalid date",
      success: false,
    });
  });

  test("opponent doesn't exist", async () => {
    const res = await user
      .request(app)
      .post("/match/new")
      .send(getMatchProposal({ to: OIDS[0] }));

    expect(res.status).toBe(400);
    expect(res.body).toStrictEqual({
      error: "You cannot propose a match with a non-existent user!",
      success: false,
    });
  });
});

describe("get", () => {
  test("not your match", async () => {
    const match = await addMatch(db.get());
    const res = await user.request(app).get(`/match/${match._id.toString()}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toStrictEqual({
      success: false,
      error: "Failed to get obj",
    });
  });
});

describe("find/proposed", () => {
  test("general", async () => {
    const matches: Match[] = [];
    matches.push(
      await addMatch(db.get(), {
        status: MatchStatus.Request,
        owner: user.id(),
        players: [user.id(), OIDS[0]],
      }),
      await addMatch(db.get(), {
        status: MatchStatus.Request,
        owner: OIDS[0],
        players: [user.id(), OIDS[0]],
      }),
      await addMatch(db.get(), {
        status: MatchStatus.Accepted,
        owner: OIDS[0],
        players: [user.id(), OIDS[0]],
      }),
      await addMatch(db.get(), {
        status: MatchStatus.Request,
        owner: OIDS[0],
        players: [OIDS[0], OIDS[1]],
      }),
    );

    const res = await user.request(app).post(`/match/find/proposed`);

    expect(res.statusCode).toBe(200);
    expectAPIRes(res.body).toStrictEqual({
      success: true,
      data: [matches[1]],
    });
  });
});

describe("find", () => {
  test("not your match", async () => {
    await addMatch(db.get());
    const res = await user.request(app).post(`/match/find`).send({});

    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual({
      success: true,
      data: [],
    });
  });

  test("with query", async () => {
    const expected = await addMatch(db.get(), {
      status: MatchStatus.Accepted,
      owner: user.id(),
      players: [user.id(), OIDS[0]],
    });
    await addMatch(db.get());
    const res = await user
      .request(app)
      .post(`/match/find`)
      .send({
        query: { status: MatchStatus.Accepted },
      } as MatchPageOptions);

    expect(res.statusCode).toBe(200);
    expectAPIRes(res.body).toStrictEqual({
      success: true,
      data: [expected],
    });
  });
});

describe("rate", () => {
  test("done", async () => {
    await user.edit({
      $set: { rating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    });
    await opponent.edit({
      $set: { rating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    });

    const match = await addMatch(db.get(), {
      status: MatchStatus.Complete,
      players: [user.id(), opponent.id()],
    });
    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/rate`)
      .send({ stars: 5 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual({
      success: true,
    });

    const matches = await db.get().matches();
    const updateMatch = await matches.get(match._id);
    expect(updateMatch?.status).toBe(MatchStatus.Complete);
    if (updateMatch?.status === MatchStatus.Complete) {
      expect(updateMatch.usersRated).toStrictEqual([user.id()]);
    }

    const updateUser = await user.update();
    expect(updateUser.rating).toStrictEqual({
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    });

    const updateOpponent = await opponent.update();
    expect(updateOpponent.rating).toStrictEqual({
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 1,
    });
  });

  test("match not completed", async () => {
    const match = await addMatch(db.get(), {
      status: MatchStatus.Accepted,
      players: [user.id(), OIDS[0]],
    });

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/rate`)
      .send({ stars: 5 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toStrictEqual({
      success: false,
      error: "The match has not completed",
    });
  });

  test("match already rated", async () => {
    const match = await addMatch(db.get(), {
      status: MatchStatus.Complete,
      players: [user.id(), OIDS[0]],
      usersRated: [user.id()],
    });

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/rate`)
      .send({ stars: 5 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toStrictEqual({
      success: false,
      error: "You have already rated the match!",
    });
  });

  test("match doesn't exist", async () => {
    const res = await user
      .request(app)
      .post(`/match/${IDS[0]}/rate`)
      .send({ stars: 5 });

    expect(res.statusCode).toBe(404);
    expect(res.body).toStrictEqual({
      success: false,
      error: "Failed to get obj",
    });
  });

  test("user not in players", async () => {
    const match = await addMatch(db.get(), {
      status: MatchStatus.Complete,
      players: [OIDS[0], OIDS[1]],
    });

    const res = await user
      .request(app)
      .post(`/match/${match._id.toString()}/rate`)
      .send({ stars: 5 });

    expect(res.statusCode).toBe(404);
    expect(res.body).toStrictEqual({
      success: false,
      error: "Failed to get obj",
    });
  });
});

addCommonTests({
  prefix: "/match",
  getCreation: () => getMatchProposal({}),
  skipNewExists: true,
  addObj: (_, creation) => addMatch(db.get(), creation),
  addCensoredObj: (currUser) =>
    addMatch(db.get(), { players: [currUser._id, opponent.id()] }),
  validateCreation: async (currUser) => {
    const coll = await db.get().matches();
    const res = await coll.find({});
    expect(res).toStrictEqual([
      {
        _id: expect.any(ObjectId),
        date: creationStartDate,
        messages: [],
        owner: currUser._id,
        players: [currUser._id, opponent.id()],
        sport: Sport.Tennis,
        status: MatchStatus.Request,
      },
    ]);
  },
});

function getMatchProposal(inp: Partial<MatchProposal>): MatchProposal {
  const base: MatchProposal = {
    date: inp.date ?? creationStartDate,
    to: inp.to ?? opponent.id(),
    sport: inp.sport ?? Sport.Tennis,
  };

  return base;
}

function newScores(scores: [ID, number][]): Scores {
  return Object.fromEntries(scores);
}
