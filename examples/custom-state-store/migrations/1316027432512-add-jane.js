'use strict'

const db = require('../db')

exports.up = async function () {
  const pets = db('pets')
  await pets.push({ name: 'jane' })
}

exports.down = async function () {
  const pets = db('pets')
  await pets.pop()
}
