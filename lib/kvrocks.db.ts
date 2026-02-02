/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import { BaseRedisStorage } from './redis-base.db';
import { getEnvConfig } from './runtime-config';

export class KvrocksStorage extends BaseRedisStorage {
  constructor() {
    const envConfig = getEnvConfig();
    const config = {
      url: envConfig.KVROCKS_URL,
      clientName: 'Kvrocks'
    };
    const globalSymbol = Symbol.for('__MOONTV_KVROCKS_CLIENT__');
    super(config, globalSymbol);
  }
}