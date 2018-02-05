function thunkify(fn, ...args) {
  if (typeof fn !== 'function') throw new Error('thunkify\'s first paramter must be a function.');

  return new Promise(function (resolve, reject) {
    function cb(err, data) {
      if (err) reject(err);
      resolve(data);
    }
    args.push(cb);

    fn.apply(this, args);
  });
}

module.exports = {
  thunkify
};