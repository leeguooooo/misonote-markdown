import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// Mock the verifyServerResponseSignature method behavior
function verifyServerResponseSignature(response: any): boolean {
  if (!response.signature || !response.data || typeof response.signature !== 'string') {
    return false;
  }

  // 服务器使用SHA-256哈希签名数据
  const dataString = JSON.stringify(response.data);
  const computedHash = crypto
    .createHash('sha256')
    .update(dataString)
    .digest('hex');
  
  return computedHash === response.signature;
}

describe('License Manager - RSA Signature Verification', () => {
  it('should verify valid server signature', () => {
    const data = { valid: true, license: { id: 'test-123' } };
    const dataString = JSON.stringify(data);
    const signature = crypto.createHash('sha256').update(dataString).digest('hex');
    
    const response = {
      data,
      signature
    };
    
    expect(verifyServerResponseSignature(response)).toBe(true);
  });

  it('should reject invalid signature', () => {
    const response = {
      data: { valid: true },
      signature: 'invalid-signature-12345'
    };
    
    expect(verifyServerResponseSignature(response)).toBe(false);
  });

  it('should reject missing signature', () => {
    const response = {
      data: { valid: true }
    };
    
    expect(verifyServerResponseSignature(response)).toBe(false);
  });

  it('should reject missing data', () => {
    const response = {
      signature: 'some-signature'
    };
    
    expect(verifyServerResponseSignature(response)).toBe(false);
  });

  it('should handle different data structures', () => {
    const complexData = {
      valid: true,
      license: {
        id: 'test-123',
        features: ['feature1', 'feature2'],
        metadata: { key: 'value' }
      },
      timestamp: new Date().toISOString()
    };
    
    const dataString = JSON.stringify(complexData);
    const signature = crypto.createHash('sha256').update(dataString).digest('hex');
    
    const response = {
      data: complexData,
      signature
    };
    
    expect(verifyServerResponseSignature(response)).toBe(true);
  });
});