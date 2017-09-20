#!/usr/bin/env node
"use strict";

const prog = require('caporal');
var chalk       = require('chalk');
var figlet      = require('figlet');
var packageInfo = require('./package.json');
var awUser = require('./api/user');
var awProject = require('./api/project');
var awDataset = require('./api/dataset');

console.log(
  chalk.blue(
    figlet.textSync('WhatsIt', { horizontalLayout: 'full' })
  )
);

prog
  .version(packageInfo.version)
  .command('login', 'Login to whatsit.net')
  .help(`Login with OAuth`)
  .alias('sign-in')
  .option('-o, --oauth <oauth-provider>', 'OAuth provider (default: github)', ["github"])
  .action((args, options, logger) => {
    awUser.login()
  })

  // the logout command
  .command('logout', 'Logout from whatsit.net')
  .help('Logout from whatsit.net')
  .alias('logout')
  .action((args, options, logger) => {
    awUser.logout()
  })

  // the add command
  .command('add', 'Add a project')
  .help('')
  .alias('Add-Project')
  .option('-n, --projectName <projectName>', 'Project name')
  .action((args, options, logger) => {
    awProject.add(options).then(() => {
    })
  })

  // the project command
  .command('project', "Project command for whatsit.net")
  .help('')
  .option('-l, --list', 'Show project list')
  .option('-a, --name <name>', 'Create a new Project')
  .option('-g, --trainset <trainset>', 'To get train-set')
  .option('-t, --trainsettype <trainsettype>', 'To get train-set as specific type')
  .action((args, options, logger) => {
    if (!options.list
    && !options.name
    && !options.trainset
    && !options.trainsettype) {
      showHelp()
    }
    awProject.project(options).then((res) => {
    }, (err) => {
      showHelp(err)
    })
  })

  // the dataset command
  .command('dataset', "Dataset command for whatsit.net")
  .help('')
  .option('-l, --list <list>', 'All List of dataset')
  .option('-a, --add <add>', 'Add a new Dataset')
  .option('-p, --projectId <projectId>', 'Project ID')
  .action((args, options, logger) => {
    if (!options.add && !options.delete
      && !options.projectId
      && !options.list) {
      showHelp()
    }
    awDataset.dataset(options).then((res) => {
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

