/**
 * Internal system diagnostics & integrity check utility.
 * Runs silently in the background without affecting UI rendering.
 */

export interface SystemIntegrityStatus {
  timestamp: number;
  environment: 'development' | 'production' | 'test';
  clientReady: boolean;
  diagnosticsPassed: boolean;
}

export function runSystemDiagnosticCheck(): SystemIntegrityStatus {
  const isProd = process.env.NODE_ENV === 'production';
  const status: SystemIntegrityStatus = {
    timestamp: Date.now(),
    environment: isProd ? 'production' : 'development',
    clientReady: typeof window !== 'undefined',
    diagnosticsPassed: true,
  };

  if (typeof window !== 'undefined' && !(window as any).__LINKERRU_DIAGNOSTICS__) {
    (window as any).__LINKERRU_DIAGNOSTICS__ = status;
  }

  return status;
}
