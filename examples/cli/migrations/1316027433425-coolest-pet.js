'use strict'

const db = require('../db')

exports.up = async function () {
  const pets = db('pets')

  const taylor = await pets
    .chain()
    .find({ name: 'tobi' })
    .assign({ coolest: true })
    .value()

  console.log('taylor', taylor)
}

exports.down = async function () {
  const pets = db('pets')

  await pets
    .chain()
    .find({ name: 'tobi' })
    .unset('coolest')
    .value()
}
