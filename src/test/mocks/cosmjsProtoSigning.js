class Registry {
  constructor(types = []) {
    this.types = types;
  }

  register(typeUrl, type) {
    this.types.push([typeUrl, type]);
  }

  lookupType(typeUrl) {
    const entry = this.types.find(([registeredTypeUrl]) => registeredTypeUrl === typeUrl);
    return entry ? entry[1] : undefined;
  }
}

module.exports = {
  Registry,
};
