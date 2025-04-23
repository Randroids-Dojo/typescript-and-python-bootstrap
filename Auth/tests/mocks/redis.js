module.exports = {
  __esModule: true,
  default: {
    get: jest.fn().mockImplementation(() => Promise.resolve(null)),
    set: jest.fn().mockImplementation(() => Promise.resolve('OK')),
    del: jest.fn().mockImplementation(() => Promise.resolve(1)),
    quit: jest.fn().mockImplementation(() => Promise.resolve('OK')),
    on: jest.fn().mockImplementation(() => {}),
    once: jest.fn().mockImplementation(() => {})
  }
};