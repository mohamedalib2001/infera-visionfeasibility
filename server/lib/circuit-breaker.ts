type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenRequests: number;
}

interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailure: Date | null = null;
  private lastSuccess: Date | null = null;
  private halfOpenAttempts = 0;
  private readonly options: CircuitBreakerOptions;
  private readonly name: string;

  constructor(name: string, options?: Partial<CircuitBreakerOptions>) {
    this.name = name;
    this.options = {
      failureThreshold: options?.failureThreshold ?? 5,
      resetTimeout: options?.resetTimeout ?? 60000,
      halfOpenRequests: options?.halfOpenRequests ?? 3,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
        this.halfOpenAttempts = 0;
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker '${this.name}' is open. Service unavailable.`,
          this.getStats()
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailure) return false;
    return Date.now() - this.lastFailure.getTime() >= this.options.resetTimeout;
  }

  private onSuccess(): void {
    this.successes++;
    this.lastSuccess = new Date();

    if (this.state === 'half-open') {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.options.halfOpenRequests) {
        this.reset();
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = new Date();

    if (this.state === 'half-open') {
      this.state = 'open';
      return;
    }

    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
    }
  }

  private reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.halfOpenAttempts = 0;
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
    };
  }

  isOpen(): boolean {
    return this.state === 'open';
  }

  forceOpen(): void {
    this.state = 'open';
  }

  forceClose(): void {
    this.reset();
  }
}

export class CircuitBreakerError extends Error {
  readonly stats: CircuitBreakerStats;

  constructor(message: string, stats: CircuitBreakerStats) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.stats = stats;
  }
}

export const circuitBreakers = {
  ai: new CircuitBreaker('ai-service', {
    failureThreshold: 3,
    resetTimeout: 30000,
    halfOpenRequests: 2,
  }),
  stripe: new CircuitBreaker('stripe-service', {
    failureThreshold: 5,
    resetTimeout: 60000,
    halfOpenRequests: 3,
  }),
  email: new CircuitBreaker('email-service', {
    failureThreshold: 3,
    resetTimeout: 30000,
    halfOpenRequests: 2,
  }),
};
