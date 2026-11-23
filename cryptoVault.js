/**
 * @module CryptoVault
 * @description AES-256-GCM Web Crypto persistence layer for cart & VIP reservations.
 */
export class CryptoVault {
  constructor(namespace = 'BAHR_CAFE_VAULT_V1') {
    this.namespace = namespace;
    this.keyPromise = this.#deriveSessionKey();
  }

  async #deriveSessionKey() {
    if (!window.crypto || !window.crypto.subtle) return null;
    const rawSeed = new TextEncoder().encode('BAHR-ROYAL-ROASTERY-1998-SECURE-SEED');
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      rawSeed,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('BAHR-SALT-2026'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async saveEncrypted(keyName, payload) {
    try {
      const cryptoKey = await this.keyPromise;
      const serialized = JSON.stringify(payload);
      if (!cryptoKey) {
        localStorage.setItem(`${this.namespace}:${keyName}`, serialized);
        return;
      }
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(serialized);
      const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encoded
      );
      const record = {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(cipherBuffer))
      };
      localStorage.setItem(`${this.namespace}:${keyName}`, JSON.stringify(record));
    } catch (err) {
      console.warn('[CryptoVault] Fallback storage active:', err);
    }
  }

  async loadEncrypted(keyName, fallback = null) {
    try {
      const raw = localStorage.getItem(`${this.namespace}:${keyName}`);
      if (!raw) return fallback;
      const cryptoKey = await this.keyPromise;
      const parsed = JSON.parse(raw);
      if (!cryptoKey || !parsed.iv || !parsed.data) return parsed;
      const iv = new Uint8Array(parsed.iv);
      const cipherBytes = new Uint8Array(parsed.data);
      const plainBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        cipherBytes
      );
      return JSON.parse(new TextDecoder().decode(plainBuffer));
    } catch {
      return fallback;
    }
  }
}
