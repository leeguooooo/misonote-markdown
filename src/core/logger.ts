// 客户端安全的logger实现
let winston: any;
if (typeof window === 'undefined') {
  winston = require('winston');
}

// 创建 Winston 日志器，专门为 PM2 优化（仅服务器端）
let logger: any;

if (typeof window === 'undefined' && winston) {
  logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }: { timestamp?: string; level: string; message: string; [key: string]: any }) => {
      let log = `${timestamp} [${level.toUpperCase()}] ${message}`;

      // 添加额外的元数据
      if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
      }

      return log;
    })
  ),
  transports: [
    // 控制台输出 - PM2 会捕获这个
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      handleExceptions: true,
      handleRejections: true
    }),

    // 文件输出
    new winston.transports.File({
      filename: './logs/app-error.log',
      level: 'error',
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    new winston.transports.File({
      filename: './logs/app-combined.log',
      level: 'debug',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exitOnError: false
  });

  // 在开发环境中添加更详细的格式
  if (process.env.NODE_ENV === 'development') {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }));
  }
} else {
  // 客户端使用console
  logger = {
    debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
    info: (message: string, meta?: any) => console.info(`[INFO] ${message}`, meta || ''),
    warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
    error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
    verbose: (message: string, meta?: any) => console.log(`[VERBOSE] ${message}`, meta || ''),
    silly: (message: string, meta?: any) => console.log(`[SILLY] ${message}`, meta || ''),
    // 添加winston兼容的方法
    write: (message: string) => console.log(message),
    log: (level: string, message: string, meta?: any) => {
      const logMethod = (console as any)[level] || console.log;
      logMethod(`[${level.toUpperCase()}] ${message}`, meta || '');
    }
  };
}

// 导出便捷的日志方法
export const log = {
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
    // 强制刷新到控制台
    process.stdout.write('');
  },

  info: (message: string, meta?: any) => {
    logger.info(message, meta);
    process.stdout.write('');
  },

  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
    process.stdout.write('');
  },

  error: (message: string, meta?: any) => {
    logger.error(message, meta);
    process.stderr.write('');
  },

  // 特殊的认证日志
  auth: (message: string, meta?: any) => {
    logger.info(`🔐 AUTH: ${message}`, meta);
    process.stdout.write('');
  },

  // 特殊的环境变量日志
  env: (message: string, meta?: any) => {
    logger.info(`🔍 ENV: ${message}`, meta);
    process.stdout.write('');
  },

  // 特殊的 API 日志
  api: (message: string, meta?: any) => {
    logger.info(`🌐 API: ${message}`, meta);
    process.stdout.write('');
  },

  // 启动日志
  startup: (message: string, meta?: any) => {
    logger.info(`🚀 STARTUP: ${message}`, meta);
    process.stdout.write('');
  }
};

// 确保日志目录存在（仅在服务器端）
if (typeof window === 'undefined') {
  try {
    const { mkdirSync } = require('fs');
    mkdirSync('./logs', { recursive: true });
  } catch (error) {
    // 目录已存在，忽略错误
  }
}

export default logger;
