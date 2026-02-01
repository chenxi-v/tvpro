/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import { BaseRedisStorage } from './redis-base.db';
import { getEnvConfig } from './runtime-config';

export class RedisStorage extends BaseRedisStorage {
  constructor() {
    const envConfig = getEnvConfig();
    const config = {
      url: envConfig.REDIS_URL,
      clientName: 'Redis'
    };
    const globalSymbol = Symbol.for('__MOONTV_REDIS_CLIENT__');
    super(config, globalSymbol);
  }
}