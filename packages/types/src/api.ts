import type { CensoredUser } from "./user.js";
import type { Sport } from "./utils.js";

export interface Success<T> {
  success: true;
  data: T;
}

export interface Error {
  success: false;
  error: string;
}

export type WithError<T> = Success<T> | Error;

export type UserMatchReturn = { u: CensoredUser; sport: Sport }[];

export function newAPISuccess<T>(data: T): WithError<T> {
  return { success: true, data };
}

export function newAPIError<T>(message: string): WithError<T> {
  return { success: false, error: message };
}
