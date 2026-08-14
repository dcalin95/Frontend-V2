describe('Sky Control feature flag', () => {
  const loadConstants = () => {
    jest.resetModules();
    return require('../constants');
  };

  afterEach(() => {
    delete process.env.REACT_APP_SKY_CONTROL_ENABLED;
  });

  it('is disabled by default', () => {
    const { isSkyControlEnabled } = loadConstants();
    expect(isSkyControlEnabled({ NODE_ENV: 'test' })).toBe(false);
  });

  it('is enabled only by the explicit public build flag', () => {
    const { isSkyControlEnabled } = loadConstants();
    expect(isSkyControlEnabled({ NODE_ENV: 'test', REACT_APP_SKY_CONTROL_ENABLED: 'true' })).toBe(true);

    expect(isSkyControlEnabled({ NODE_ENV: 'test', REACT_APP_SKY_CONTROL_ENABLED: 'TRUE' })).toBe(false);
  });

  it('keeps the approved private shell enabled in production builds without a local env file', () => {
    const { isSkyControlEnabled } = loadConstants();
    expect(isSkyControlEnabled({ NODE_ENV: 'production' })).toBe(true);
  });
});
