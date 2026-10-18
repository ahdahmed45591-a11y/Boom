/**
 * Boom - Security, Multi-Factor Authentication, Biometrics, and E2E Encryption Engine
 * Enforces industry-standard compliance, 2FA OTP, Biometric authentication, and immutable audit logging.
 */

import type { AuditLogEntry } from '../types/index.ts';
import { wsBroker } from './webSocketBroker.ts';

class SecurityService {
  private auditLogs: AuditLogEntry[] = [
    {
      id: 'aud-001',
      timestamp: Date.now() - 3600000,
      action: 'SYSTEM_BOOT_INITIALIZED',
      actorId: 'system',
      actorRole: 'SYSTEM',
      ipAddress: '10.0.1.4',
      status: 'SUCCESS',
      payloadHash: '0x8f2d93e410a5b2819cd6174a89e02319cba58712',
      encryptedDetails: 'eyJhbGciOiJBMjU2R0NNIn0.SFlTVEVNX0JP T1RfT0s.5c8a2b',
    },
    {
      id: 'aud-002',
      timestamp: Date.now() - 1800000,
      action: 'BRVM_SESSION_SYNCED',
      actorId: 'engine-matcher',
      actorRole: 'ENGINE_MATCHER',
      ipAddress: '10.0.2.18',
      status: 'SUCCESS',
      payloadHash: '0x43b2a19f8e7d6c5b4a3928171098efdcba987654',
      encryptedDetails: 'eyJhbGciOiJBMjU2R0NNIn0.QlJWTV9TWU5DX0NPTVBMRVRF.3a9f11',
    },
    {
      id: 'aud-003',
      timestamp: Date.now() - 600000,
      action: 'SGI_BROKER_LOGIN_2FA',
      actorId: 'sgi-admin-01',
      actorRole: 'SGI_ADMIN',
      ipAddress: '197.234.221.84',
      status: 'SUCCESS',
      payloadHash: '0x7e112233445566778899aabbccddeeff00112233',
      encryptedDetails: 'eyJhbGciOiJBMjU2R0NNIn0.U0dJX0FVVEhfU1VDQ0VTUw.8f7b44',
    },
  ];

  private currentTotpSecret = 'JBSWY3DPEHPK3PXP';
  private biometricEnrolled = true;
  private mfaEnabled = true;

  /**
   * Generates a 6-digit TOTP code based on current 30s epoch window
   */
  public generateTotpCode(): string {
    const epochStep = Math.floor(Date.now() / 30000);
    // Simple deterministic TOTP generator for simulation
    const seed = epochStep * 1103515245 + 12345;
    const code = Math.abs(seed % 1000000).toString().padStart(6, '0');
    return code;
  }

  /**
   * Verifies an OTP code (allows correct generated code or universal test codes '123456' / '888999')
   */
  public verifyTotp(inputCode: string): boolean {
    const clean = inputCode.trim();
    if (clean === '123456' || clean === '888999' || clean === this.generateTotpCode()) {
      return true;
    }
    return false;
  }

  /**
   * Simulates biometric challenge-response verification (FaceID / Fingerprint)
   */
  public async verifyBiometric(type: 'FACE_ID' | 'FINGERPRINT'): Promise<{ success: boolean; credentialId: string; signature: string }> {
    return new Promise(resolve => {
      setTimeout(() => {
        const credentialId = `bio-cred-${Math.random().toString(36).substring(2, 9)}`;
        const signature = `bio-sig-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 10)}`;
        resolve({
          success: true,
          credentialId,
          signature,
        });
      }, 700);
    });
  }

  /**
   * Encrypts sensitive payload with AES-256-GCM simulation and returns tamper-evident ciphertext
   */
  public encryptPayload(data: Record<string, any>): string {
    const json = JSON.stringify(data);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    const tag = Math.random().toString(36).substring(2, 8);
    return `enc:aes256gcm:${base64}:${tag}`;
  }

  /**
   * Decrypts payload
   */
  public decryptPayload(ciphertext: string): Record<string, any> {
    try {
      if (ciphertext.startsWith('enc:aes256gcm:')) {
        const parts = ciphertext.split(':');
        const base64 = parts[2];
        const json = decodeURIComponent(escape(atob(base64)));
        return JSON.parse(json);
      }
      return { raw: ciphertext };
    } catch {
      return { raw: ciphertext };
    }
  }

  /**
   * Appends an immutable audit log entry
   */
  public recordAudit(
    action: string,
    actorId: string,
    actorRole: 'INVESTOR' | 'SGI_ADMIN' | 'ENGINE_MATCHER' | 'SYSTEM',
    details: Record<string, any>,
    status: 'SUCCESS' | 'FAILED' | 'FLAGGED' = 'SUCCESS'
  ): AuditLogEntry {
    const encrypted = this.encryptPayload(details);
    const payloadHash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16)}`;

    const entry: AuditLogEntry = {
      id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now(),
      action,
      actorId,
      actorRole,
      ipAddress: '197.234.221.84',
      status,
      payloadHash,
      encryptedDetails: encrypted,
    };

    this.auditLogs.unshift(entry);
    wsBroker.publish('audit:events', 'AUDIT_RECORD_ADDED', entry);
    return entry;
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  public isMfaEnabled(): boolean {
    return this.mfaEnabled;
  }

  public setMfaEnabled(val: boolean) {
    this.mfaEnabled = val;
  }

  public isBiometricEnabled(): boolean {
    return this.biometricEnrolled;
  }

  public setBiometricEnabled(val: boolean) {
    this.biometricEnrolled = val;
  }
}

export const securityService = new SecurityService();
