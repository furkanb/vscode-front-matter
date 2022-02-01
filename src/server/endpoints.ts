import { Express } from "express";
import { media } from './endpoints/media';

export interface Endpoint {
  handler?: (app: Express) => Promise<void> | void | undefined;
}

export const Endpoints: Endpoint[] = [
  { handler: media },
]