'use strict'

const path = require('path')
const fs = require('fs')
const slug = require('slug')
const formatDate = require('dateformat')

module.exports = async function templateGenerator (opts) {
  // Setup default options
  opts = opts || {}
  const name = opts.name
  const dateFormat = opts.dateFormat
  const templateFile = opts.templateFile || path.join(__dirname, 'template.js')
  const migrationsDirectory = opts.migrationsDirectory || 'migrations'
  const extention = opts.extention || '.js'

  const template = await loadTemplate(templateFile)

  // Ensure migrations directory exists
  await fs.promises.readdir(migrationsDirectory)

  // Create date string
  const formattedDate = dateFormat ? formatDate(new Date(), dateFormat) : Date.now()

  // Fix up file path
  const p = path.join(process.cwd(), migrationsDirectory, slug(formattedDate + (name ? '-' + name : '')) + extention)

  // Write the template file
  await fs.promises.writeFile(p, template)

  return p
}

const _templateCache = {}
function loadTemplate (tmpl) {
  if (_templateCache[tmpl]) {
    return Promise.resolve(_templateCache)
  }

  return fs.promises.readFile(tmpl, { encoding: 'utf8' })
    .then(content => {
      _templateCache[tmpl] = content
      return content
    })
}
