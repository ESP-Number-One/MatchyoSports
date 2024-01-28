import type {
  Collection,
  Document,
  Filter,
  InsertManyResult,
  ObjectId,
  OptionalId,
  Sort,
} from "mongodb";

export interface QueryOptions {
  query?: Filter<Document>;
  sort?: Sort;
  pageStart?: number; // Defaults to 0
  pageSize?: number; // Defaults to 20
}

/**
 * This is here to give a much nicer interface which handles the types
 * correctly
 *
 * This can be inherited from down the line if we want to add more specific
 * functions
 */
export class CollectionWrap<T> {
  private collection: Collection;

  constructor(collection: Collection) {
    this.collection = collection;
  }

  /**
   * This is mostly here for internal reasons, please consider to use the page
   * function instead to reduce load on the database, api and client
   */
  public async find(query: Filter<Document>): Promise<T[]> {
    return (await this.collection.find(query).toArray()) as unknown[] as T[];
  }

  public async get(id: ObjectId): Promise<T> {
    return (await this.find({ id }))[0];
  }

  public insert(...items: OptionalId<T>[]): Promise<InsertManyResult> {
    return this.collection.insertMany(items);
  }

  public async page(opts: QueryOptions): Promise<T[]> {
    const req = this.collection
      .find(opts.query ?? {})
      .skip(opts.pageStart ?? 0)
      .limit(opts.pageSize ?? 20);

    if (opts.sort) req.sort(opts.sort);

    return (await req.toArray()) as unknown[] as T[];
  }
}
