'use strict'

const fs = require('fs')
const path = require('path')
const acorn = require('acorn')
const glob = require('glob')
const sourceMap = require('source-map')

/**
 * options { Object }
 * --context The base directory, an absolute path, default process.cwd()
 * --files Array of glob pattern
 * --ecmaVersion Indicates the ECMAScript version to parse.Default is es5.
 * --module use ES modules, default false
 * --allowHashBang supports files that start with hash bang, default false
 * --not=folderName1,folderName2 An array of file/folder names that you would like to ignore. Defaults to `[]`.
 */
function check (options = {}) {
  const configs = {
    context: process.cwd(),
    files: [],
    ecmaVersion: 'es5',
    module: false,
    allowHashBang: false,
    not: []
  }

  const configFilePath = path.resolve(options.context || configs.context, '.escheckrc')
  let config = {}

  /**
   * Check for a configuration file. If one exists, default to those options
   * if no command line arguments are passed in
   */
  if (fs.existsSync(configFilePath)) {
    config = JSON.parse(fs.readFileSync(configFilePath))
  }

  Object.assign(configs, config, options)

  const { context, ecmaVersion, module: esmodule, allowHashBang, not: pathsToIgnore } = configs
  const files = [].concat(configs.files)

  if (!files || !files.length) {
    reject(new Error('No files were passed in please pass in a list of files to es-check!'))
  }

  /**
   * define ecmaScript version
   * - Default ecmaScript version is '5'
   */
  let e

  switch (ecmaVersion) {
    case 'es3':
      e = '3'
      break
    case 'es4':
      e = '4'
      break
    case 'es5':
      e = '5'
      break
    case 'es6':
      e = '6'
      break
    case 'es7':
      e = '7'
      break
    case 'es8':
      e = '8'
      break
    case 'es9':
      e = '9'
      break
    case 'es10':
      e = '10'
      break
    case 'es2015':
      e = '6'
      break
    case 'es2016':
      e = '7'
      break
    case 'es2017':
      e = '8'
      break
    case 'es2018':
      e = '9'
      break
    case 'es2019':
      e = '10'
      break
    default:
      throw new Error('Invalid ecmaScript version, please pass a valid version');
  }

  const errArray = []
  const globOpts = { root: context, nodir: true }
  const acornOpts = { ecmaVersion: e, silent: true }
  const filterForIgnore = (globbedFiles) => {
    if (pathsToIgnore && pathsToIgnore.length > 0) {
      const filtered = globbedFiles.filter((filePath) => !pathsToIgnore
        .some(ignoreValue => filePath.includes(ignoreValue)))
      return filtered
    }
    return globbedFiles
  }

  if (esmodule) {
    acornOpts.sourceType = 'module'
  }

  if (allowHashBang) {
    acornOpts.allowHashBang = true
  }

  return new Promise(async (resolve, reject) => {
    files.forEach((pattern) => {
      /**
       * pattern => glob or array
       */
      const globbedFiles = glob.sync(pattern, globOpts)
      console.log(globOpts, pattern, globbedFiles)
      if (globbedFiles.length === 0) {
        reject(new Error(`ES-Check: Did not find any files to check for ${pattern}.`))
      }

      const filteredFiles = filterForIgnore(globbedFiles);

      filteredFiles.forEach(async (file) => {
        const code = fs.readFileSync(file, 'utf8')

        try {
          acorn.parse(code, acornOpts)
        } catch (err) {
          let errorObj = {
            err,
            stack: err.stack,
            ...err.loc,
            file
          }

          errArray.push(errorObj)
        }
      })
    })

    if (errArray.length) {
      const errors = await getSource(errArray)
      resolve(errors)
    } else {
      resolve([])
    }
  })
}

async function getSource (errors) {
  for (let err of errors) {
    try {
      // 如果有sourcemap文件，通过sourcemap定位到源文件
      const source = fs.readFileSync(err.file + '.map').toString()
      const consumer = await new sourceMap.SourceMapConsumer(source)
      const sm = consumer.originalPositionFor({
        line: err.line,
        column: err.column
      })
      const sources = consumer.sources
      const smIndex = sources.indexOf(sm.source)
      const smContent = consumer.sourcesContent[smIndex]
      const rawLines = smContent.split(/\r?\n/g)

      err.source = sm.source
      err.line = sm.line
      err.column = sm.column
      err.code = rawLines[sm.line - 1]
    } catch (rErr) {
      err.source = '-'
      err.code = '-'
    }
  }

  return errors
}

module.exports = check
