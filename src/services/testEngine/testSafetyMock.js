/**
 * Test Safety Mock & Interceptor
 * ==============================================================================
 * Prevents automated Playwright and in-browser tests from executing
 * destructive operations against physical hardware, PLCs, or production DBs.
 * ==============================================================================
 */

export const DANGEROUS_OPERATIONS = [
  'machine.start',
  'machine.stop',
  'machine.resetAlarm',
  'plc.writeTag',
  'plc.setCoil',
  'database.delete',
  'database.truncate',
  'quality.createNCR',
  'erp.postTransaction'
];

export class TestSafetyMock {
  constructor(options = {}) {
    this.mode = options.mode || 'TEST'; // 'TEST', 'STAGING', 'PRODUCTION'
    this.auditLog = [];
    this.customMocks = new Map();
  }

  isDangerous(operation) {
    if (!operation) return false;
    const op = String(operation).trim();
    return DANGEROUS_OPERATIONS.some(danger => op.toLowerCase() === danger.toLowerCase() || op.endsWith(`.${danger}`));
  }

  registerMock(operation, mockResult) {
    this.customMocks.set(operation, mockResult);
  }

  async intercept(operation, params = {}, executor = null) {
    const timestamp = new Date().toISOString();

    if (this.isDangerous(operation)) {
      const mockResult = this.customMocks.get(operation) || {
        status: 'MOCKED_SUCCESS',
        operation,
        simulated: true,
        message: `[SAFETY INTERCEPT] Hazardous operation "${operation}" safely simulated in ${this.mode} mode.`,
        data: { id: `mock_${Date.now()}`, ...params }
      };

      const auditEntry = {
        timestamp,
        operation,
        params,
        blocked: true,
        mode: this.mode,
        result: mockResult
      };
      this.auditLog.push(auditEntry);
      console.warn(`🛡️ [TestSafetyMock] Intercepted dangerous operation: ${operation}`, auditEntry);
      return mockResult;
    }

    // Non-dangerous or explicitly authorized
    if (executor && typeof executor === 'function') {
      try {
        const result = await executor(params);
        this.auditLog.push({ timestamp, operation, params, blocked: false, status: 'EXECUTED' });
        return result;
      } catch (err) {
        this.auditLog.push({ timestamp, operation, params, blocked: false, error: err.message });
        throw err;
      }
    }

    return { status: 'OK', simulated: true };
  }

  getAuditLog() {
    return [...this.auditLog];
  }

  clearAuditLog() {
    this.auditLog = [];
  }
}

export const globalTestSafety = new TestSafetyMock();
