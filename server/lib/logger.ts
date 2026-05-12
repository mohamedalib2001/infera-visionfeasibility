type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
  userId?: number;
  duration?: number;
}

class StructuredLogger {
  private source: string;

  constructor(source: string) {
    this.source = source;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      source: this.source,
      metadata,
    };
  }

  private output(entry: LogEntry): void {
    const jsonLine = JSON.stringify(entry);
    
    if (process.env.NODE_ENV === 'production') {
      console.log(jsonLine);
    } else {
      const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const levelColors: Record<LogLevel, string> = {
        debug: '\x1b[36m',
        info: '\x1b[32m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
      };
      const reset = '\x1b[0m';
      console.log(
        `${formattedTime} ${levelColors[entry.level]}[${entry.source}]${reset} ${entry.message}`,
        entry.metadata ? entry.metadata : ''
      );
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.createEntry('debug', message, metadata));
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.createEntry('info', message, metadata));
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.createEntry('warn', message, metadata));
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.createEntry('error', message, metadata));
  }

  withContext(context: Partial<LogEntry>): StructuredLogger {
    const contextLogger = new StructuredLogger(this.source);
    const originalOutput = contextLogger.output.bind(contextLogger);
    contextLogger.output = (entry: LogEntry) => {
      originalOutput({ ...entry, ...context });
    };
    return contextLogger;
  }
}

export function createLogger(source: string): StructuredLogger {
  return new StructuredLogger(source);
}

export const logger = {
  express: createLogger('express'),
  stripe: createLogger('stripe'),
  ai: createLogger('ai'),
  db: createLogger('db'),
  auth: createLogger('auth'),
  email: createLogger('email'),
};
