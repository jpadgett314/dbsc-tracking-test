class DBSCTracker {
  constructor() {
    /** @type {Map<string, object[]>} signature -> visits */
    this.visits = new Map();
  }

  log(signature) {
    const visit = { timestamp: Date.now() };
    const array = this.visits.get(signature) || [];
    array.push(visit);
    this.visits.set(signature, array);
  }
}

export { DBSCTracker };
