// Production configuration
export const productionConfig = {
  // Security settings
  secureCookies: true,
  forceHTTPS: true,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Database settings
  db: {
    retryAttempts: 5,
    retryDelay: 5000,
    connectionTimeout: 30000,
    poolSize: 10
  },
  
  // Redis settings
  redis: {
    retryAttempts: 3,
    retryDelay: 2000,
    connectionTimeout: 10000
  },
  
  // MinIO settings
  minio: {
    useSSL: true,
    region: 'us-east-1'
  },
  
  // Session settings
  session: {
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },
  
  // API settings
  api: {
    version: 'v1',
    timeout: 30000
  },
  
  // Logging settings
  logging: {
    level: 'info',
    format: 'json'
  }
};

export default productionConfig;