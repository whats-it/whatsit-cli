"use strict";

var chalk       = require('chalk');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Spinner     = CLI.Spinner;
var github = require('../github');
var _           = require('lodash');
var Promise = require('promise');
var git         = require('simple-git')();
var touch       = require('touch');
var fs          = require('fs');
var files       = require('../../lib/files');
var WhatsIt  = require('whatsit-sdk-js')
let aw = new WhatsIt({});
let awUser = aw.getUser();
let awProject = aw.getProject();
let awInstance = aw.getInstance();
let awSchedule = aw.getSchedule();
let awScheduler = aw.getScheduler();
var Configstore = require('configstore');
var pkg         = require('../../package.json')
const conf = require('../../util/config')
let awApi = require('../../api')
const confStore = new Configstore(pkg.name, {});

exports.scheduler = function (options) {
  return new Promise ((resolve, reject) => {
    let userId = confStore.get('userId')
    if (options.list) {
      awApi.getSchedulers()
        .then((schedulers) => showSchedulers(schedulers))
        .then(() => resolve())
    } else if (options.schedulerId) {
      if (options.schedulerId == true) {
        reject('Error : Need a schedulerId')
      }
      awApi.getScheduler(options.schedulerId)
        .then((scheduler) => showSchedulerInfo(scheduler))
        .then(() => resolve())
    } else if (options.delete) {
      if (options.delete == true) {
        awApi.getSchedulers()
          .then((schedulers) => awApi.selectScheduler(schedulers))
          .then((scheduler) => awApi.deleteScheduler(scheduler))
          .then((scheduler) => showDeleteResultMessage(scheduler))
          .then(() => resolve())
      } else if (options.delete != null) {
        awApi.deleteScheduler(options.delete)
          .then((id) => showDeleteResultMessage2(id))
          .then(() => resolve())
      }
    }
  })
}

function showCreateResultMessage (schedule) {
  console.log(chalk.bold.green(`${confStore.get(conf.LAST_SELECTED_PROJECT)}`) + '\'s new schedule'  + ' is successfully created('  + chalk.green(`${schedule._id}`) + ')')
}

function showDeleteResultMessage (scheduler) {
  console.log(chalk.bold.green(`${scheduler._id}`) + ' is successfully deleted')
}

function showDeleteResultMessage2 (id) {
  console.log(chalk.bold.green(`${id}`) + ' is successfully deleted')
}

function showSchedulerInfo (scheduler) {
  console.log(chalk.bold.yellow('Scheduler Information : '))
  makeSchedulerInfoFormat(scheduler)
}

function showSchedulers (schedulers) {
  console.log('Scheduler list >')
  schedulers.forEach((scheduler, i) => {
    makeSchedulerFormat(scheduler, i)
  })
}

function makeSchedulerFormat (scheduler, index) {
  let split = chalk.blue('|')
  console.log(index + '. ' +  `${split}ID:${scheduler._id}`)
}

function makeSchedulerInfoFormat (scheduler) {
  Object.keys(scheduler).map(function(key ) {
    console.log(chalk.blue(`${key}`) + `:${scheduler[key]}`)
  });
}

