import { decodeProtectedHeader, importJWK, jwtVerify } from 'jose';

class SessionVerifier {
  /**
   * @param {CryptoKey | null} publicKey 
   */
  constructor(publicKey) {
    this.publicKey = publicKey;
  }

  /**
   * @param {object} jwt 
   * @param {string} challenge 
   * @returns 
   */
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

    let transformed;

    try {
      transformed = await jwtVerify(jwt, this.publicKey);
    } catch (e) {
      console.error(
        "--- Challenge Verification Error ---\n",
        `publickey: ${this.publicKey}\n`,
        `challenge: ${challenge}\n`,
        `jwt: `, jwt,
      );
      throw e;
    }

    const jti = transformed?.payload?.jti;

    if (!jti || !challenge || challenge !== jti) {
      console.error(
        "--- Challenge Verification Failed ---\n",
        `publickey: ${this.publicKey}\n`,
        `challenge: ${challenge}\n`,
        `jti: `, jti,
        `jwt: `, jwt,
      )
    }

    if (!jti || !challenge) {
      return false;
    } 

    return challenge == jti;
  }
}

export { SessionVerifier };
