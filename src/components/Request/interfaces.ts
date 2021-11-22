import { MatchResult } from "path-to-regexp";
import { StateFn } from "../State";

export interface RequestParams {
  state: StateFn;
  matches: MatchResult<any>;
  body: any;
  headers: Headers;
}

export type Handler = ((params: RequestParams) => Response | Promise<Response>);