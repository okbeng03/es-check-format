#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const prog = require('caporal')
const pkg = require('./package.json')
const esCheck = require('./index')
const argsArray = process.argv

/**
 * es-check 🏆
 * fork from es-check
 * ----
 * - define the EcmaScript version to check for against a glob of JavaScript files
 * - match the EcmaScript version option against a glob of files
 *   to to test the EcmaScript version of each file
 * - error failures
*/
prog
  .version(pkg.version)
  .argument(
    '[ecmaVersion]',
    'ecmaVersion to check files against. Can be: es3, es4, es5, es6/es2015, es7/es2016, es8/es2017, es9/es2018, es10/es2019'
  ).argument(
    '[files...]',
    'a glob of files to to test the EcmaScript version against'
  )
  .option('--module', 'use ES modules')
  .option('--allow-hash-bang', 'if the code starts with #! treat it as a comment')
  .option('--not', 'folder or file names to skip', prog.LIST)
  .action((args, options, logger) => {

    const context = process.cwd()
    const configFilePath = path.resolve(context, '.escheckrc')
    let config = {}

    /**
     * Check for a configuration file. If one exists, default to those options
     * if no command line arguments are passed in
     */
    if (fs.existsSync(configFilePath)) {
      config = JSON.parse(fs.readFileSync(configFilePath))
    }

    const files = args.files.length
      ? [].concat(args.files)
      : config.files
        ? [].concat(config.files)
        : []

    if (!files.length) {
      logger.error(
        'No files were passed in please pass in a list of files to es-check!'
      )
      process.exit(1)
    }

    const configs = {
      context,
      files
    }

    if (args.ecmaVersion) {
      configs.ecmaVersion = args.ecmaVersion
      logger.debug(`ES-Check: Going to check files using version ${args.ecmaVersio}`)
    }

    if (options.module) {
      configs.module = true
      logger.debug('ES-Check: esmodule is set')
    }

    if (options.allowHashBang) {
      configs.allowHashBang = true
      logger.debug('ES-Check: allowHashBang is set')
    }

    if (options.not) {
      configs.not = options.not
    }

    logger.info(`ES-Check start`)

    esCheck(configs).then((errArray) => {
      if (errArray.length > 0) {
        logger.error(`ES-Check: there were ${errArray.length} ES version matching errors.`)
        errArray.forEach((o) => {
          logger.info(`
            ES-Check Error:
            ----
            · erroring file: ${o.file}
            · source file: ${o.source}
            . location: { line: ${o.line}, column: ${o.column} }
            . code: ${o.code}
            ----\n
          `)
        })
        process.exit(1)
      } else {
        logger.error(`ES-Check: there were no ES version matching errors!  🎉`)
      }
    })
  })

prog.parse(argsArray)

