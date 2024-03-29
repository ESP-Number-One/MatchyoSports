import type {
  Collection,
  Document,
  Filter,
  OptionalId,
  Sort,
  UpdateFilter,
} from "mongodb";
import type { MongoDBItem, ObjectId } from "@esp-group-one/types";
import type { FilterOptions, ReplaceObjectId } from "./types.js";
import { toInternal, toMongo } from "./types.js";

/**
 * This is here to give a much nicer interface which handles the types
 * correctly
 *
 * This can be inherited from down the line if we want to add more specific
 * functions
 */
export class CollectionWrap<T extends MongoDBItem> {
  private collection: Collection;

  constructor(collection: Collection) {
    this.collection = collection;
  }

  /**
   * Deletes the object with the given id
   *
   * @param id - the id to delete
   */
  public async delete(id: ObjectId): Promise<void> {
    await this.collection.deleteOne({ _id: toMongo(id) });
  }

  /**
   * Edits a given object with the id with the update filter
   *
   * @param id - the id of the object to update
   * @param update - the update object to apply to the object
   */
  public async edit(
    id: ObjectId,
    update: UpdateFilter<T> | Partial<T>,
  ): Promise<void> {
    await this.collection.updateOne(toMongo({ _id: id }), toMongo(update));
  }

  /**
   * Edits a given object with the id with the update filter
   *
   * @param query - the query to get the objects to edit
   * @param update - the update object to apply to the object
   */
  public async editWithQuery(
    query: Filter<T>,
    update: UpdateFilter<T> | Partial<T>,
  ): Promise<void> {
    await this.collection.updateMany(
      toMongo(query) as Filter<Document>,
      toMongo(update) as UpdateFilter<Document> | Partial<Document>,
    );
  }

  /**
   * @returns if there are more than one element with your specific query
   */
  public async exists(query: Filter<T>): Promise<boolean> {
    return (await this.page({ query, pageSize: 1 })).length > 0;
  }

  /**
   * This is mostly here for internal reasons, please consider to use the page
   * function instead to reduce load on the database, api and client
   *
   * @returns all items found which match the query in the collection
   */
  public async find(query: Filter<T>): Promise<T[]> {
    const q = toMongo(query) as unknown as Filter<Document>;
    return toInternal<T[]>(
      (await this.collection.find(q).toArray()) as unknown[] as ReplaceObjectId<
        T[]
      >,
    );
  }

  /**
   * @returns the object with the given ObjectId
   */
  public async get(id: ObjectId): Promise<T | undefined> {
    return (await this.page({ query: { _id: id }, pageSize: 1 })).at(0);
  }

  /**
   * Inserts all given items to the collection
   *
   * @returns the ids of the items inserted
   */
  public insert(...items: OptionalId<T>[]): Promise<ObjectId[]> {
    return this.collection
      .insertMany(toMongo(items) as unknown as OptionalId<Document>[])
      .then((res) =>
        toInternal<ObjectId[]>(
          Object.values(res.insertedIds) as unknown as ReplaceObjectId<
            ObjectId[]
          >,
        ),
      );
  }

  /**
   * This allows us to easily page a collection and not return all the results.
   * Reducing load on client + database
   *
   * @returns opts.pageSize sized array (or less) with the items that match the
   *   query
   */
  public async page(opts: FilterOptions<T>): Promise<T[]> {
    // When page size is 0, it will use all the memory :(
    if (opts.pageSize !== undefined && opts.pageSize < 1) opts.pageSize = 1;

    const req = this.collection
      .find(toMongo(opts.query) as Filter<Document>)
      .skip(opts.pageStart ?? 0)
      .limit(opts.pageSize ?? 20);

    if (opts.sort) req.sort(opts.sort as Sort);

    return toInternal<T[]>(
      (await req.toArray()) as unknown[] as ReplaceObjectId<T>[],
    );
  }

  public raw(): Collection {
    return this.collection;
  }
}
