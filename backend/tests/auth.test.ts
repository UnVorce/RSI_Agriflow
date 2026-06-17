import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../src/utils/password';

describe('Password Utilities', () => {
  it('should hash password correctly', async () => {
    const password = 'testpassword123';
    const hashed = await hashPassword(password);
    
    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(0);
  });

  it('should compare password correctly', async () => {
    const password = 'testpassword123';
    const hashed = await hashPassword(password);
    
    const isValid = await comparePassword(password, hashed);
    expect(isValid).toBe(true);
    
    const isInvalid = await comparePassword('wrongpassword', hashed);
    expect(isInvalid).toBe(false);
  });
});
