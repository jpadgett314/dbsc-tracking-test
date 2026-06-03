import { decodeProtectedHeader, importJWK, jwtVerify } from 'jose';

class SessionVerifier {
  constructor(publicKey) {
    this.publicKey = publicKey;
  }

  async verify(jwt, challenge) {
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

    if (!jti || !challenge) {
      return false;
    } 

    return challenge == jti;
  }
}

export { SessionVerifier };
