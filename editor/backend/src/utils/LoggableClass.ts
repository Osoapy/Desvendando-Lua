import { Engine } from '@promisepending/logger.js';

export class LoggableClass {
  public loggerEngine: Engine;
  constructor(engine: Engine) {
    this.loggerEngine = engine;
  }
}
