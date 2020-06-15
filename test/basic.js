'use strict'

/* global describe, it, beforeEach, afterEach */

const rimraf = require('rimraf')
const path = require('path')
const assert = require('assert')

const migrate = require('../')
const db = require('./util/db')

const BASE = path.join(__dirname, 'fixtures', 'basic')
const STATE = path.join(BASE, '.migrate')

describe('migration set', function () {
  let set

  function assertNoPets () {
    assert.strictEqual(db.pets.length, 0)
  }

  function assertPets () {
    assert.strictEqual(db.pets.length, 3)
    assert.strictEqual(db.pets[0].name, 'tobi')
    assert.strictEqual(db.pets[0].email, 'tobi@learnboost.com')
  }

  function assertPetsWithDogs () {
    assert.strictEqual(db.pets.length, 5)
    assert.strictEqual(db.pets[0].name, 'tobi')
    assert.strictEqual(db.pets[0].email, 'tobi@learnboost.com')
    assert.strictEqual(db.pets[4].name, 'suki')
  };

  function assertFirstMigration () {
    assert.strictEqual(db.pets.length, 2)
    assert.strictEqual(db.pets[0].name, 'tobi')
    assert.strictEqual(db.pets[1].name, 'loki')
  }

  function assertSecondMigration () {
    assert.strictEqual(db.pets.length, 3)
    assert.strictEqual(db.pets[0].name, 'tobi')
    assert.strictEqual(db.pets[1].name, 'loki')
    assert.strictEqual(db.pets[2].name, 'jane')
  }

  beforeEach(function (done) {
    migrate
      .load({
        stateStore: STATE,
        migrationsDirectory: BASE,
        filterFunction: function (each) {
          return each !== '.migrate'
        }
      })
      .then(s => {
        set = s
        done()
      })
      .catch(err => done(err))
  })

  it('should handle basic promise migration', async function () {
    await set.up()
    assertPets()

    await set.up()
    assertPets()

    await set.down()
    assertNoPets()

    await set.down()
    assertNoPets()
  })

  it('should add a new migration', async function () {
    set.addMigration('add dogs', async function () {
      db.pets.push({ name: 'simon' })
      db.pets.push({ name: 'suki' })
    }, async function () {
      db.pets.pop()
      db.pets.pop()
    })

    await set.up()
    assertPetsWithDogs()

    await set.up()
    assertPetsWithDogs()

    await set.down()
    assertNoPets()
  })

  it('should emit events', async function () {
    set.addMigration('4-adjust-emails.js', async function () {
      db.pets.forEach(function (pet) {
        if (pet.email) { pet.email = pet.email.replace('learnboost.com', 'lb.com') }
      })
    }, async function () {
      db.pets.forEach(function (pet) {
        if (pet.email) { pet.email = pet.email.replace('lb.com', 'learnboost.com') }
      })
    })

    let saved = 0
    let migrations = []
    let expectedMigrations = [
      '1-add-guy-ferrets.js',
      '2-add-girl-ferrets.js',
      '3-add-emails.js',
      '4-adjust-emails.js'
    ]

    set.on('save', function () {
      saved++
    })

    set.on('migration', function (migration, direction) {
      migrations.push(migration.title)
      assert.strictEqual(typeof direction, 'string')
    })

    await set.up()

    assert.strictEqual(saved, 4)
    assert.strictEqual(db.pets[0].email, 'tobi@lb.com')
    assert.deepStrictEqual(migrations, expectedMigrations)

    migrations = []
    expectedMigrations = expectedMigrations.reverse()

    await set.down()
    assert.strictEqual(saved, 8)
    assert.deepStrictEqual(migrations, expectedMigrations)
    assertNoPets()
  })

  it('should migrate to named migration', async function () {
    assertNoPets()
    await set.up('1-add-guy-ferrets.js')

    assertFirstMigration()
    await set.up('2-add-girl-ferrets.js')

    assertSecondMigration()
    await set.down('2-add-girl-ferrets.js')

    assertFirstMigration()
    await set.up('2-add-girl-ferrets.js')

    assertSecondMigration()
    assert.strictEqual(set.lastRun, '2-add-girl-ferrets.js')
    await set.down('2-add-girl-ferrets.js')

    assert.strictEqual(set.lastRun, '1-add-guy-ferrets.js')
  })

  it('should load migration descriptions', async function () {
    assert.strictEqual(set.migrations[0].description, 'Adds two pets')
  })

  afterEach(function (done) {
    db.nuke()
    rimraf(STATE, done)
  })
})
