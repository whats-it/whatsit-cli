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

exports.schedule = function (options) {
  return new Promise ((resolve, reject) => {
    let userId = confStore.get('userId')
    if (options.list) {
      if (options.projectId == true) {
        awApi.getProjectsByUser(userId)
          .then((projects) => awApi.selectProject(projects))
          .then((project) => awApi.getSchedulesByProject(project))
          .then((schedules) => showSchedules(schedules))
          .then(() => resolve())
      } else if (options.projectId != null) {
        awApi.getProject(options.projectId)
          .then((project) => awApi.getSchedulesByProject(project))
          .then((schedules) => showSchedules(schedules))
          .then(() => resolve())
      } else if (options.projectId == undefined) {
        let userId = confStore.get('userId')
        awApi.getSchedulesByUser(userId)
          .then((schedules) => showSchedules(schedules))
          .then(() => resolve())
      }
    } else if (options.add) {
      if (options.projectId != null) {
        awApi.getProject(options.projectId)
          .then((project) => awApi.createSchedule(project))
          .then((schedule) => showCreateResultMessage(schedule))
          .then(() => resolve())
      } else if (options.projectId == undefined) {
        awApi.getProjectsByUser(userId)
          .then((projects) => awApi.selectProject(projects))
          .then((project) => awApi.createSchedule(project))
          .then((schedule) => showCreateResultMessage(schedule))
          .then(() => resolve())
      }
    } else if (options.delete) {
      if (options.projectId != null) {
        awApi.getProject(options.projectId)
          .then((project) => awApi.getSchedulesByProject(project))
          .then((schedules) => awApi.selectSchedule(schedules))
          .then((schedule) => awApi.deleteSchedule(schedule))
          .then((schedule) => awApi.deleteScheduleInScheduler(schedule))
          .then((schedule) => showDeleteResultMessage(schedule))
          .then(() => resolve())
      } else if (options.projectId == true) {
        awApi.getProjectsByUser(userId)
          .then((projects) => awApi.selectProject(projects))
          .then((project) => awApi.getSchedulesByProject(project))
          .then((schedules) => awApi.selectSchedule(schedules))
          .then((schedule) => awApi.deleteSchedule(schedule))
          .then((schedule) => awApi.deleteScheduleInScheduler(schedule))
          .then((schedule) => showDeleteResultMessage(schedule))
          .then(() => resolve())
      } else if (options.scheduleId == true) {
        reject('Error : Please input scheduleId')
      } else if (options.scheduleId != null) {
        awApi.getSchedule(options.scheduleId)
          .then((schedule) => awApi.deleteScheduleInScheduler(schedule))
          .then((schedule) => awApi.deleteSchedule(schedule))
          .then((schedule) => showDeleteResultMessage(schedule))
          .then(() => resolve())
      } else if (options.projectId == undefined) {
        awApi.getSchedulesByUser(userId)
          .then((schedules) => awApi.selectSchedule(schedules))
          .then((schedule) => awApi.deleteSchedule(schedule))
          .then((schedule) => awApi.deleteScheduleInScheduler(schedule))
          .then((schedule) => showDeleteResultMessage(schedule))
          .then(() => resolve())
      }
    } else if (options.start) {
      if (options.projectId != null) {
        awApi.getSchedule(options.projectId)
          .then((schedule) => awApi.deleteScheduleInScheduler(schedule))
          .then((schedule) => awApi.deleteSchedule(schedule))
          .then((schedule) => showDeleteResultMessage(schedule))
          .then(() => resolve())
      } else if (options.projectId == undefined) {
        awApi.getProjectsByUser(userId)
          .then((projects) => awApi.selectProject(projects))
          .then((project) => awApi.getSchedulesByProject(project))
          .then((schedules) => awApi.selectSchedule(schedules))
          .then((schedule) => awApi.stopSchedule(schedule))
          .then((schedule) => awApi.deleteScheduleInScheduler(schedule))
          .then((schedule) => showDeleteResultMessage(schedule))
          .then(() => resolve())
      }
    } else if (options.scheduleId) {
      if (options.scheduleId == true) {
        reject('Error : Need a scheduleId')
      }
      awApi.getSchedule(options.scheduleId)
        .then((schedule) => showScheduleInfo(schedule))
        .then(() => resolve())
    }
  })
}

function updateScheduleCron (projectId, cron) {
  return new Promise ((resolve, reject) => {
    console.log(cron)
    awProject.updateScheduleCron(projectId, cron).then(res => {
      if (res != null) {
        resolve(res.data.data)
      }
    }).catch(err => {
      console.error(err)
      reject(err)
    })
  })
}

function updateScheduleInterval (projectId, interval) {
  return new Promise ((resolve, reject) => {
    awProject.updateScheduleInterval(projectId, interval).then(res => {
      if (res != null) {
        resolve(res.data.data)
      }
    }).catch(err => {
      console.error(err)
      reject(err)
    })
  })
}

function updateScheduleWhen (projectId, when) {
  return new Promise ((resolve, reject) => {
    awProject.updateScheduleWhen(projectId, when).then(res => {
      if (res != null) {
        resolve(res.data.data)
      }
    }).catch(err => {
      console.error(err)
      reject(err)
    })
  })
}

function showCreateResultMessage (schedule) {
  console.log(chalk.bold.green(`${confStore.get(conf.LAST_SELECTED_PROJECT)}`) + '\'s new schedule'  + ' is successfully created('  + chalk.green(`${schedule._id}`) + ')')
}

function showDeleteResultMessage (schedule) {
  console.log(chalk.bold.green(`${schedule._id}`) + ' is successfully deleted')
}

function showScheduleInfo (schedule) {
  console.log(chalk.bold.yellow('Schedule Information : '))
  makeScheduleInfoFormat(schedule)
}

function showSchedules (schedules) {
  console.log('[' + chalk.bold.yellow(confStore.get('login')) + '] Schedule list >')
  schedules.forEach((schedule, i) => {
    makeScheduleFormat(schedule, i)
  })
}

function makeScheduleFormat (schedule, index) {
  let split = chalk.blue('|')
  console.log(index + '. ' + chalk.green(`${confStore.get(conf.LAST_SELECTED_PROJECT).full_name}`) + `${split}ID:${schedule._id}`)
}

function makeScheduleInfoFormat (schedule) {
  Object.keys(schedule).map(function(key ) {
    console.log(chalk.blue(`${key}`) + `:${schedule[key]}`)
  });
}

