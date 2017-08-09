#!/usr/bin/env node
"use strict";

const prog = require('caporal');
var chalk       = require('chalk');
var figlet      = require('figlet');
// var _           = require('lodash');
var packageInfo = require('./package.json');
var awUser = require('./api/user');
var awProject = require('./api/project');
var awInstance = require('./api/instance');
var awSchedule = require('./api/schedule');
var awScheduler = require('./api/scheduler');
var awSubscribe = require('./api/subscribe');
var util = require('./util');

var Configstore = require('configstore');
var pkg         = require('./package.json')
const conf      = require('./util/config')
const confStore = new Configstore(pkg.name, {foo: 'bar'});
util.clear()

console.log(
  chalk.blue(
    figlet.textSync('WhatsIt', { horizontalLayout: 'full' })
  )
);

prog
  .version(packageInfo.version)
  // the "login" command
  .command('login', 'Login to whatsit.net')
  .help(`Login with OAuth`)
  .alias('sign-in')
  .option('-o, --oauth <oauth-provider>', 'OAuth provider (default: github)', ["github"])
  .action((args, options, logger) => {
    awUser.login()
    // logger.info("Command 'order' called with:");
    // logger.info("arguments: %j", args);
    // logger.info("options: %j", options);
  })

  // the add command
  .command('add', "Add a project")
  .help('')
  .option('-r, --repo <repo>', 'repository name')
  .option('-o, --owner <owner>', 'A owner of a repository')
  .action((args, options, logger) => {
    if (options.repo == true) {
      console.log(chalk.red('Need a repository name'));
      showHelp()
    }
    if (options.owner == true) {
      console.log(chalk.red('Need a owner name'));
      showHelp()
    }
    awProject.add(options).then(() => {
    })
  })

  // the project command
  .command('project', "Project command for whatsit.net")
  .help('')
  .option('-p, --projectId <projectId>', 'Specify a projectID')
  .option('-l, --list', 'Show project list')
  .option('-s, --subscriber <subscriber>',
    'Set subscriber email to notify test result \n' +
    '  (e.g.) -s aaa@gmail.com,bbb@emil.com')
  .option('-d, --delete <projectId>', 'Delete a project with projectId')
  .option('-b, --branch <branch>', 'Change branch')
  .action((args, options, logger) => {
    if (!options.list && !options.delete
        && !options.projectId
        && !options.branch
        && !options.subscriber
        && !options.when && !options.interval && !options.cron) {
      showHelp()
    }
    awProject.project(options).then((res) => {
    }, (err) => {
      showHelp(err)
    })
  })

  // the run command
  .command('run', "Project command for whatsit.net")
  .help('')
  .option('-p, --project <projectFullName>', 'Project name (ex. bluehackmaster/whatsit-cli')
  .option('-l, --list', 'Show run history')
  .option('-i, --instanceId <instanceId>', 'Show a information of instance')
  .action((args, options, logger) => {
    if (!options.project && !options.list && !options.instanceId) {
      showHelp()
    }
    awInstance.run(options).then((res) => {
    }, (err) => {
      showHelp(err)
    })
  })

  // the schedule command
  .command('schedule', "Schedule command for whatsit.net")
  .help('')
  .option('-p, --projectId <projectId>', 'Specify a projectID')
  .option('-a, --add', 'Add a Schedule')
  .option('-l, --list',
    'Show all of user\'s Schedule\n' +
    '  $ whatsit schedule -l \n' +
    'Show all of Project\'s Schedule \n' +
    '  $ whatsit schedule -p <projectId> -l \n' +
    'Show all of Project\'s Schedule (Interactive Mode) \n' +
    '  $ whatsit schedule -p -l \n')
  .option('-s, --start', 'Start the Schedule')
  .option('-e, --stop', 'Stop the schedule')
  .option('-i, --scheduleId <scheduleId>',
    'Show information of Schedule \n' +
    '  $ whatsit schedule -i <scheduleId> \n' +
    'Delete a Schedule \n' +
    '  $ whatsit schedule -i <scheduleId> -d \n')
  .option('-t, --interval <interval>',
    'Set schedule with interval time \n' +
    '  (e.g.) 1h, 4h, 1d, 2d \n' +
    'Range: 1h~24h, 1d~31d')
  .option('-w, --when <when>',
    'Set schedule with time \n' +
    '  (e.g.) 45m = 01:45, 02:45, ... , 24:45 \n' +
    '         13h = 13:00 Sun, 13:00 Mon, ... , 13:00 Sat)  \n' +
    'Range: 1m ~ 59m, 1h~24h')
  .option('-c, --cron <cron>',
    'Set schedule with cron expression\n' +
    '  (e.g.) * */1 * * * = 01:00, 02:00 ... every hour \n' +
    '         * * */3 * * = every three days  \n')
  .option('-d, --delete <projectId>', 'Delete a project with projectId')
  .action((args, options, logger) => {
    if (!options.list && !options.delete
      && !options.projectId
      && !options.add
      && !options.scheduleId
      && !options.start
      && !options.stop
      && !options.when && !options.interval && !options.cron) {
      showHelp()
    }
    confStore.set(conf.OPTIONS, options)
    awSchedule.schedule(options).then((res) => {
    }, (err) => {
      showHelp(err)
    })
  })

  // the scheduler command
  .command('scheduler', "Scheduler command for whatsit.net")
  .help('')
  .option('-l, --list', "Show all of Scheduler list")
  .option('-i, --schedulerId <schedulerId>',
    'Show information of Scheduler \n' +
    '  $ whatsit scheduler -i <schedulerId> \n')
  .option('-d, --delete <schedulerId>', 'Delete a Scheduler with schedulerID')
  .action((args, options, logger) => {
    if (!options.list && !options.delete
      && !options.schedulerId) {
      showHelp()
    }
    confStore.set(conf.OPTIONS, options)
    awScheduler.scheduler(options).then((res) => {
    }, (err) => {
      showHelp(err)
    })
  })

  // the subscribe command
  .command('subscribe', "Subscribe command for whatsit.net")
  .help('')
  .option('-a, --add <email>', 'Add subscriber')
  .option('-d, --delete <email>', 'Add subscriber')
  .option('-p, --projectId <projectId>', 'Specify a projectID')
  .option('-l, --list', 'Show subscriber list')
  .action((args, options, logger) => {
    if (!options.add && !options.delete
      && !options.projectId
      && !options.list) {
      showHelp()
    }
    awSubscribe.subscribe(options).then((res) => {
    }, (err) => {
      showHelp(err)
    })
  })

prog.parse(process.argv);

function showHelp(err) {
  if (err) {
    console.log(chalk.red(err));
  }
  let argv = []
  process.argv.forEach(arg => {
    argv.push(arg)
  })
  argv[3] = '-h'
  prog.parse(argv)
}

