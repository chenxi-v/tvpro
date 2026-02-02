/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 运行时环境变量配置
 * 这个模块用于在运行时读取环境变量，而不是在构建时静态替换
 * 这样可以通过重启服务来更新所有环境变量
 */

// 服务器端环境变量配置
export interface EnvConfig {
  // 站点配置
  SITE_NAME: string;
  STORAGE_TYPE: string;
  SEARCH_MAX_PAGE: number;
  DOUBAN_PROXY_TYPE: string;
  DOUBAN_PROXY: string;
  DOUBAN_IMAGE_PROXY_TYPE: string;
  DOUBAN_IMAGE_PROXY: string;
  DISABLE_YELLOW_FILTER: boolean;
  FLUID_SEARCH: boolean;
  ANNOUNCEMENT: string;
  
  // 认证配置
  USERNAME: string;
  PASSWORD: string;
  
  // 服务器配置
  HOSTNAME: string;
  PORT: string;
  
  // 存储配置
  REDIS_URL: string;
  KVROCKS_URL: string;
  UPSTASH_URL: string;
  UPSTASH_TOKEN: string;
  
  // 其他配置
  NODE_ENV: string;
  DOCKER_ENV: string;
}

// 默认配置值
const defaultConfig: EnvConfig = {
  SITE_NAME: 'MoonTV',
  STORAGE_TYPE: 'localstorage',
  SEARCH_MAX_PAGE: 5,
  DOUBAN_PROXY_TYPE: 'cmliussss-cdn-tencent',
  DOUBAN_PROXY: '',
  DOUBAN_IMAGE_PROXY_TYPE: 'cmliussss-cdn-tencent',
  DOUBAN_IMAGE_PROXY: '',
  DISABLE_YELLOW_FILTER: false,
  FLUID_SEARCH: true,
  ANNOUNCEMENT: '本网站仅提供影视信息搜索服务，所有内容均来自第三方网站。本站不存储任何视频资源，不对任何内容的准确性、合法性、完整性负责。',
  
  USERNAME: '',
  PASSWORD: '',
  
  HOSTNAME: 'localhost',
  PORT: '3000',
  
  REDIS_URL: '',
  KVROCKS_URL: '',
  UPSTASH_URL: '',
  UPSTASH_TOKEN: '',
  
  NODE_ENV: 'development',
  DOCKER_ENV: 'false',
};

/**
 * 获取运行时环境变量配置
 * 这个函数在运行时读取环境变量，支持通过重启服务更新配置
 */
export function getEnvConfig(): EnvConfig {
  // 在服务器端，直接从process.env读取
  // 注意：NEXT_PUBLIC_前缀的变量可能在构建时被替换，所以我们使用不带前缀的版本
  // 但为了向后兼容，我们也检查NEXT_PUBLIC_前缀的变量
  
  const config: EnvConfig = {
    SITE_NAME: process.env.SITE_NAME || 
               process.env.NEXT_PUBLIC_SITE_NAME || 
               defaultConfig.SITE_NAME,
    
    STORAGE_TYPE: process.env.STORAGE_TYPE || 
                  process.env.NEXT_PUBLIC_STORAGE_TYPE || 
                  defaultConfig.STORAGE_TYPE,
    
    SEARCH_MAX_PAGE: parseInt(
      process.env.SEARCH_MAX_PAGE || 
      process.env.NEXT_PUBLIC_SEARCH_MAX_PAGE || 
      defaultConfig.SEARCH_MAX_PAGE.toString()
    ),
    
    DOUBAN_PROXY_TYPE: process.env.DOUBAN_PROXY_TYPE || 
                       process.env.NEXT_PUBLIC_DOUBAN_PROXY_TYPE || 
                       defaultConfig.DOUBAN_PROXY_TYPE,
    
    DOUBAN_PROXY: process.env.DOUBAN_PROXY || 
                  process.env.NEXT_PUBLIC_DOUBAN_PROXY || 
                  defaultConfig.DOUBAN_PROXY,
    
    DOUBAN_IMAGE_PROXY_TYPE: process.env.DOUBAN_IMAGE_PROXY_TYPE || 
                             process.env.NEXT_PUBLIC_DOUBAN_IMAGE_PROXY_TYPE || 
                             defaultConfig.DOUBAN_IMAGE_PROXY_TYPE,
    
    DOUBAN_IMAGE_PROXY: process.env.DOUBAN_IMAGE_PROXY || 
                        process.env.NEXT_PUBLIC_DOUBAN_IMAGE_PROXY || 
                        defaultConfig.DOUBAN_IMAGE_PROXY,
    
    DISABLE_YELLOW_FILTER: process.env.DISABLE_YELLOW_FILTER === 'true' || 
                           process.env.NEXT_PUBLIC_DISABLE_YELLOW_FILTER === 'true' || 
                           defaultConfig.DISABLE_YELLOW_FILTER,
    
    FLUID_SEARCH: process.env.FLUID_SEARCH !== 'false' && 
                  process.env.NEXT_PUBLIC_FLUID_SEARCH !== 'false' && 
                  defaultConfig.FLUID_SEARCH,
    
    ANNOUNCEMENT: process.env.ANNOUNCEMENT || defaultConfig.ANNOUNCEMENT,
    
    USERNAME: process.env.USERNAME || defaultConfig.USERNAME,
    PASSWORD: process.env.PASSWORD || defaultConfig.PASSWORD,
    
    HOSTNAME: process.env.HOSTNAME || defaultConfig.HOSTNAME,
    PORT: process.env.PORT || defaultConfig.PORT,
    
    REDIS_URL: process.env.REDIS_URL || defaultConfig.REDIS_URL,
    KVROCKS_URL: process.env.KVROCKS_URL || defaultConfig.KVROCKS_URL,
    UPSTASH_URL: process.env.UPSTASH_URL || defaultConfig.UPSTASH_URL,
    UPSTASH_TOKEN: process.env.UPSTASH_TOKEN || defaultConfig.UPSTASH_TOKEN,
    
    NODE_ENV: process.env.NODE_ENV || defaultConfig.NODE_ENV,
    DOCKER_ENV: process.env.DOCKER_ENV || defaultConfig.DOCKER_ENV,
  };
  
  return config;
}

/**
 * 获取客户端可用的环境变量配置
 * 这个配置会被注入到HTML中，供客户端使用
 */
export function getClientEnvConfig() {
  const envConfig = getEnvConfig();
  
  // 只返回客户端需要的配置
  return {
    SITE_NAME: envConfig.SITE_NAME,
    STORAGE_TYPE: envConfig.STORAGE_TYPE,
    SEARCH_MAX_PAGE: envConfig.SEARCH_MAX_PAGE,
    DOUBAN_PROXY_TYPE: envConfig.DOUBAN_PROXY_TYPE,
    DOUBAN_PROXY: envConfig.DOUBAN_PROXY,
    DOUBAN_IMAGE_PROXY_TYPE: envConfig.DOUBAN_IMAGE_PROXY_TYPE,
    DOUBAN_IMAGE_PROXY: envConfig.DOUBAN_IMAGE_PROXY,
    DISABLE_YELLOW_FILTER: envConfig.DISABLE_YELLOW_FILTER,
    FLUID_SEARCH: envConfig.FLUID_SEARCH,
    ANNOUNCEMENT: envConfig.ANNOUNCEMENT,
  };
}

/**
 * 检查是否在浏览器环境中
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * 获取环境变量值（兼容服务器端和客户端）
 * @param key 环境变量键名
 * @param defaultValue 默认值
 */
export function getEnv(key: keyof EnvConfig, defaultValue?: string): string {
  if (isBrowser()) {
    // 在客户端，尝试从window.RUNTIME_CONFIG读取
    const runtimeConfig = (window as any).RUNTIME_CONFIG;
    if (runtimeConfig && runtimeConfig[key] !== undefined) {
      return runtimeConfig[key];
    }
  }
  
  // 在服务器端或未找到配置时，从getEnvConfig读取
  const envConfig = getEnvConfig();
  const value = envConfig[key];
  
  if (value !== undefined && value !== null && value !== '') {
    return value.toString();
  }
  
  return defaultValue || '';
}

/**
 * 获取布尔值环境变量
 */
export function getEnvBool(key: keyof EnvConfig, defaultValue: boolean = false): boolean {
  const value = getEnv(key, defaultValue.toString());
  return value === 'true' || value === '1';
}

/**
 * 获取数值环境变量
 */
export function getEnvNumber(key: keyof EnvConfig, defaultValue: number = 0): number {
  const value = getEnv(key, defaultValue.toString());
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}