describe('Sky Control feature flag', () => {
  const loadFlag = () => {
    jest.resetModules();
    return require('../constants').ENABLE_SKY_CONTROL;
  };

  afterEach(() => {
    delete process.env.REACT_APP_SKY_CONTROL_ENABLED;
  });

  it('is disabled by default', () => {
    delete process.env.REACT_APP_SKY_CONTROL_ENABLED;
    expect(loadFlag()).toBe(false);
  });

  it('is enabled only by the explicit public build flag', () => {
    process.env.REACT_APP_SKY_CONTROL_ENABLED = 'true';
    expect(loadFlag()).toBe(true);

    process.env.REACT_APP_SKY_CONTROL_ENABLED = 'TRUE';
    expect(loadFlag()).toBe(false);
  });
});
