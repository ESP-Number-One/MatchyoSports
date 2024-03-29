import type { Document, MongoClient, OptionalId } from "mongodb";
import type { League, Match, User, UserIdMap } from "@esp-group-one/types";
import { helpers } from "@esp-group-one/types";
import { beforeAll, afterAll, describe, expect, test } from "@jest/globals";
import { DbClient } from "../src/client.js";
import {
  AVAILABILITY_CACHE_COLLECTION_NAME,
  LEAGUE_COLLECTION_NAME,
  MATCH_COLLECTION_NAME,
  USER_COLLECTION_NAME,
  USER_MAP_COLLECTION_NAME,
} from "../src/constants.js";
import { toMongo } from "../src/types.js";
import { getRawClient, getRawDb } from "./helpers/utils.js";
import { setup } from "./helpers/setup.js";

const { getLeague, getMatch, getUser, getUserIdMap } = helpers;

let db: DbClient;
let client: MongoClient;
beforeAll(async () => {
  setup();

  db = new DbClient();
  client = await getRawClient();
});

afterAll(async () => {
  await db.close();
  await client.close();
});

describe("collections", () => {
  test("availabilityCaches", async () => {
    const rawColl = getRawDb(client).collection(
      AVAILABILITY_CACHE_COLLECTION_NAME,
    );

    const userIdMap: OptionalId<UserIdMap> = getUserIdMap({});
    await rawColl.insertOne(toMongo(userIdMap) as OptionalId<Document>);

    const coll = await db.availabilityCaches();

    await expect(coll.find({})).resolves.toStrictEqual([userIdMap]);
  });

  test("leagues", async () => {
    const rawColl = getRawDb(client).collection(LEAGUE_COLLECTION_NAME);

    const league: OptionalId<League> = getLeague({});
    await rawColl.insertOne(toMongo(league) as OptionalId<Document>);

    const coll = await db.leagues();

    await expect(coll.find({})).resolves.toStrictEqual([league]);
  });

  test("matches", async () => {
    const rawColl = getRawDb(client).collection(MATCH_COLLECTION_NAME);

    const match: OptionalId<Match> = getMatch({});
    await rawColl.insertOne(toMongo(match) as OptionalId<Document>);

    const coll = await db.matches();

    await expect(coll.find({})).resolves.toStrictEqual([match]);
  });

  test("users", async () => {
    const rawColl = getRawDb(client).collection(USER_COLLECTION_NAME);

    const user: OptionalId<User> = getUser({});
    await rawColl.insertOne(toMongo(user) as OptionalId<Document>);

    const coll = await db.users();

    await expect(coll.find({})).resolves.toStrictEqual([user]);
  });

  test("userMap", async () => {
    const rawColl = getRawDb(client).collection(USER_MAP_COLLECTION_NAME);

    const userIdMap: OptionalId<UserIdMap> = getUserIdMap({});
    await rawColl.insertOne(toMongo(userIdMap) as OptionalId<Document>);

    const coll = await db.userMap();

    await expect(coll.find({})).resolves.toStrictEqual([userIdMap]);
  });
});

describe("raw", () => {
  test("db", async () => {
    await expect(db.raw()).resolves.not.toBeNaN();
  });

  test("client", () => {
    expect(db.rawClient()).not.toBeNaN();
  });
});

describe("isClosed", () => {
  test("closed", async () => {
    expect(db.isClosed()).toBe(false);
    await db.close();
    expect(db.isClosed()).toBe(true);
    // So other tests don't error out
    db = new DbClient();
  });
});

describe("environmental variables", () => {
  test("not set", () => {
    expect(() => {
      delete process.env.DB_CONN_STRING;
      delete process.env.DB_NAME;
      const _ = new DbClient();
    }).toThrow();

    setup();
  });
});
