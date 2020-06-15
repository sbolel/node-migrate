'use strict'

const fs = require('fs')

const pWriteFile = fs.promises.writeFile
const pReadFile = fs.promises.readFile

module.exports = FileStore

function FileStore (path) {
  this.path = path
}

/**
 * Save the migration data.
 *
 * @api public
 */

FileStore.prototype.save = function (set) {
  const state = {
    lastRun: set.lastRun,
    migrations: set.migrations
  }

  return pWriteFile(this.path, JSON.stringify(state, null, '  '))
}

/**
 * Load the migration data and call `fn(err, obj)`.
 *
 * @param {Function} fn
 * @return {Type}
 * @api public
 */

FileStore.prototype.load = function () {
  return pReadFile(this.path, 'utf8')
    .then((json) => JSON.parse(json))
    .catch((err) => {
      if (err && err.code === 'ENOENT') {
        return {}
      }

      return Promise.reject(err)
    })
}
