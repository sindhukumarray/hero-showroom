/**
 * Structured Application Logger
 * Lightweight, zero-dependency, production-ready logging engine with
 * correlation ID support, automatic credential redaction, and multi-level routing.
 */

const { redact } = require('./redact');

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**
 * Resolves active minimum logging level from environment.
 * @returns {number}
 */
const getActiveLevelThreshold = () => {
  const envLevel = (process.env.LOG_LEVEL || '').toLowerCase();
  if (Object.prototype.hasOwnProperty.call(LOG_LEVELS, envLevel)) {
    return LOG_LEVELS[envLevel];
  }
  // Production defaults to 'info'; development/test defaults to 'debug'
  return process.env.NODE_ENV === 'production' ? LOG_LEVELS.info : LOG_LEVELS.debug;
};

class Logger {
  constructor() {
    this.testSink = null; // Optional test listener for assertions
  }

  /**
   * Internal output dispatcher.
   * @private
   */
  _log(level, message, context = {}) {
    const threshold = getActiveLevelThreshold();
    const currentWeight = LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : LOG_LEVELS.info;

    if (currentWeight > threshold) {
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      const requestId = context?.requestId || context?.reqId || undefined;

      // Extract context without mutating input
      const sanitizedContext = { ...context };
      delete sanitizedContext.requestId;
      delete sanitizedContext.reqId;

      const redactedMessage = typeof message === 'string' ? redact(message) : redact(String(message));
      const redactedContext = Object.keys(sanitizedContext).length > 0 ? redact(sanitizedContext) : undefined;

      const isProduction = process.env.NODE_ENV === 'production' || process.env.LOG_FORMAT === 'json';

      const payload = {
        timestamp,
        level,
        message: redactedMessage,
        ...(requestId ? { requestId } : {}),
        ...(redactedContext ? { context: redactedContext } : {})
      };

      // Notify test hook if active
      if (typeof this.testSink === 'function') {
        this.testSink(payload);
      }

      if (isProduction) {
        const jsonLine = JSON.stringify(payload);
        if (level === 'error') {
          process.stderr.write(`${jsonLine}\n`);
        } else {
          process.stdout.write(`${jsonLine}\n`);
        }
      } else {
        const reqPrefix = requestId ? ` [${requestId}]` : '';
        const ctxSuffix = redactedContext ? ` ${JSON.stringify(redactedContext)}` : '';
        const formatted = `[${timestamp}] [${level.toUpperCase()}]${reqPrefix} ${redactedMessage}${ctxSuffix}`;
        if (level === 'error') {
          process.stderr.write(`${formatted}\n`);
        } else {
          process.stdout.write(`${formatted}\n`);
        }
      }
    } catch (err) {
      // Fail-safe: never crash application if logging fails
    }
  }

  info(message, context) {
    this._log('info', message, context);
  }

  warn(message, context) {
    this._log('warn', message, context);
  }

  error(message, context) {
    this._log('error', message, context);
  }

  debug(message, context) {
    this._log('debug', message, context);
  }

  /**
   * Attach a callback sink for unit/integration testing assertions.
   * @param {((entry: object) => void)|null} sink
   */
  setTestSink(sink) {
    this.testSink = sink;
  }
}

const logger = new Logger();

module.exports = logger;
