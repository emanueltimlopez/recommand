#!/usr/bin/env node
const program = require('commander')
const fs = require('fs')
const { exec } = require('shelljs')
const { prompt } = require('inquirer');

const RECORDING = 'recording'
const PLAY = 'play'
const LIST = 'list'

function routerCommands() {
  /**
   * Checks for directory and files
   */
  if (!fs.existsSync(config.dir)) fs.mkdirSync(config.dir)
  const exist = fs.existsSync(config.getSessionDir)

  /**
   * Start flows
   */
  if (config.action === RECORDING && !exist) {
    startSaving()
  } else if (config.action === PLAY && exist) {
    executeCommands()  
  } else if (config.action === LIST) {
    listSessions()
  } else if (config.action) {
    console.error(`Session ${config.name} ${!exist ? 'not ' : ''}exist.`)
  } else {
    console.error('¯\\_(ツ)_/¯ -h for help')
  }
}

function getSessions() {
  return fs.readdirSync(config.dir)
    .filter(file => file.match(new RegExp(`.${config.extension}`)))
    .map(file => file.replace(`.${config.extension}`, ''))
}

function listSessions() {
  config.promptSessions[0].choices = getSessions()
  prompt(config.promptSessions)
    .then(value => { 
      config.name = value.list
      executeCommands()
    })
    .catch(err => console.error(err))
}

function continueOrExit() {
  prompt(config.prompt)
    .then(value => {
      if (value['command'] !== 'exit') {
        fs.appendFile(config.getSessionDir, `${value['command']}\n`, () => {})
        continueOrExit()
        return
      }
      prompt(config.promptRun)
        .then(value => { 
          if (value.run) executeCommands() 
        })
        .catch(err => console.error(err))
    })
    .catch(err => console.error(err))
}

function startSaving() {
  /**
   * Create file
   */
  const file = fs.openSync(config.getSessionDir, 'w');

  console.log('Session %s recording! Type "exit" to quit', config.name)
  continueOrExit()
}

/**
 * 
 * @param {string} com 
 */
async function enterCommand(com) {
  return await exec(com, {async: true})
}

function executeCommands() {
    console.log('Session %s started! Ctrl + C to quit', config.name)
    for(command of fs.readFileSync(config.getSessionDir).toString().split("\n")) {
      if (command) enterCommand(command)
    }
}

program
  .option('-l, --list', 'List the sessions')
  .option('-r, --rec <session>', 'Start recording commands')
  .option('-p, --play <session>', 'Ejecute the session saved')
  .parse(process.argv)

const config = {
  action: program.rec ? RECORDING : null || program.play ? PLAY : null || program.list ? LIST : null,
  name: program.rec || program.play,
  dir: './.sessions',
  extension: 'cmmd',
  prompt: [{type: 'input', name: 'command', message: '> '}],
  promptRun: [{type: 'confirm', name: 'run', message: 'Do you want to run the session?'}],
  promptSessions: [{type: 'list', name: 'list', message: 'Select the session you want to run'}],
  get getSessionDir () { return `${this.dir}/${this.name}.${this.extension}` },
}

routerCommands()