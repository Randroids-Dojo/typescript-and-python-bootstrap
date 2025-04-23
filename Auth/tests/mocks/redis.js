// Improved Redis mock with more functionality
const redisMock = {
  __esModule: true,
  default: {
    get: jest.fn().mockImplementation(() => Promise.resolve(null)),
    set: jest.fn().mockImplementation(() => Promise.resolve('OK')),
    del: jest.fn().mockImplementation(() => Promise.resolve(1)),
    expire: jest.fn().mockImplementation(() => Promise.resolve(1)),
    keys: jest.fn().mockImplementation(() => Promise.resolve([])),
    ping: jest.fn().mockImplementation(() => Promise.resolve('PONG')),
    quit: jest.fn().mockImplementation(() => Promise.resolve('OK')),
    on: jest.fn().mockImplementation(() => {}),
    once: jest.fn().mockImplementation(() => {}),
    connect: jest.fn().mockImplementation(() => Promise.resolve())
  },
  // Add createRedisClient export for the new function
  createRedisClient: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      get: jest.fn().mockImplementation(() => Promise.resolve(null)),
      set: jest.fn().mockImplementation(() => Promise.resolve('OK')),
      del: jest.fn().mockImplementation(() => Promise.resolve(1)),
      expire: jest.fn().mockImplementation(() => Promise.resolve(1)),
      keys: jest.fn().mockImplementation(() => Promise.resolve([])),
      ping: jest.fn().mockImplementation(() => Promise.resolve('PONG')),
      quit: jest.fn().mockImplementation(() => Promise.resolve('OK')),
      on: jest.fn().mockImplementation(() => {}),
      once: jest.fn().mockImplementation(() => {})
    });
  }),
  // Export a Redis constructor for ESM compatibility
  RedisClientType: function() {},
  Redis: jest.fn().mockImplementation(() => {
    return redisMock.default;
  })
};

module.exports = redisMock;