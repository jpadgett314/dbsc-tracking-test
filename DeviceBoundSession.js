import { decodeProtectedHeader, importJWK, jwtVerify } from 'jose';

class DeviceBoundSession {
  constructor(sessionId, challenge, publicKey) {
    this.sessionId = sessionId;
    this.challenge = challenge;
    this.publicKey = publicKey;
  }

  async verify(jwt) {
    let header;
    
    try {
      header = decodeProtectedHeader(jwt);
    } catch {
      // Not all proofs come with the public key
    }

    if (header?.jwk) {
      this.publicKey = await importJWK(header.jwk, header.alg);
    }

    if (!this.publicKey) {
      return false;
    }

    const transformed = await jwtVerify(jwt, this.publicKey);
    const jti = transformed?.payload?.jti;

    if (!jti || !this.challenge) {
      return false;
    } 

    return this.challenge == jti;
  }
}

export { DeviceBoundSession };
