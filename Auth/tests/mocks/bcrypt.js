// Mock implementation of bcrypt
module.exports = {
  hash: jest.fn().mockImplementation((data, salt, callback) => {
    if (callback) {
      callback(null, `hashed_${data}`);
      return;
    }
    return Promise.resolve(`hashed_${data}`);
  }),
  
  compare: jest.fn().mockImplementation((data, hash, callback) => {
    const matches = hash === `hashed_${data}` || hash === 'hashed_password';
    if (callback) {
      callback(null, matches);
      return;
    }
    return Promise.resolve(matches);
  }),
  
  genSalt: jest.fn().mockImplementation((rounds, callback) => {
    if (callback) {
      callback(null, 10);
      return;
    }
    return Promise.resolve(10);
  })
};