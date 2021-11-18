import { MatchResult } from "path-to-regexp";
import { StateMethods } from "../State";

export interface RequestParams {
  state: (objectName?: string) => StateMethods;
  matches: MatchResult<any>;
  body: any;
  headers: Headers;
}