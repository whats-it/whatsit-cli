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
var Configstore = require('configstore');
var pkg         = require('../../package.json')
const conf = require('../../util/config')
let awApi = require('../../api')
const confStore = new Configstore(pkg.name, {foo: 'bar'});
var repos = new Map();
var tmpProjects = new Map();

exports.add  = function (options) {
  return new Promise ((resolve, reject) => {

    if (!options.owner && !options.repo) {
        github.getOrgs()
          .then((orgs) => selectLogin(orgs))
          .then((login) => selectRepo(login))
          .then((repo) => addRepo(repo))
          .then((projectId) => {
            showAddProjectDoneMsg(confStore.get(conf.LAST_ADDED_PROJECT), projectId)
            resolve()
          })
    } else if (options.owner == null && options.repo != null) {
        github.getOrgs()
          .then((orgs) => selectLogin(orgs))
          .then((login) => checkRepo(login, options.repo))
          .then((repo) => addRepo(repo))
          .then((projectId) => {
            showAddProjectDoneMsg(confStore.get(conf.LAST_ADDED_PROJECT), projectId)
            resolve()
          })
    } else if (options.owner != null && options.repo == null) {
        selectRepo(options.owner)
          .then((repo) => addRepo(repo))
          .then((projectId) => {
            showAddProjectDoneMsg(confStore.get(conf.LAST_ADDED_PROJECT), projectId)
            resolve()
        })
    } else if (options.owner != null && options.repo != null) {
        checkRepo(options.owner, options.repo)
          .then((repo) => addRepo(repo))
          .then((projectId) => {
            showAddProjectDoneMsg(confStore.get(conf.LAST_ADDED_PROJECT), projectId)
            resolve()
        })
    }
  })
}

exports.project = function (options) {
  return new Promise ((resolve, reject) => {
    let userId = confStore.get('userId')
    if (options.list == true) {
      awApi.getProjectsByUser(userId)
        .then((projects) => {
          showProjects(projects)
          resolve()
          })
    } else if (options.subscriber == true) {
      reject('Error : -s <subscriber> | Need subscriber emails')
    } else if (options.subscriber != null) {
      if (options.projectId == true) {
        awApi.getProjectsByUser(userId)
          .then((projects) => awApi.selectProject(projects))
          .then((project) => awApi.updateSubscriber(project._id, options.subscriber))
          .then((project) => showProjectInfo(project))
          .then(() => resolve())
      } else if (options.projectId != null) {
        awApi.updateSubscriber(options.projectId, options.subscriber)
          .then((project) => showProjectInfo(project))
          .then(() => resolve())
      }
    } else if (options.branch == true) {
      reject('Error : -d <branch> | Need a branch name')
    } else if (options.branch != null) {
      if (options.projectId != null) {
        updateBranch(options.projectId, options.branch)
          .then((project) => showProjectInfo(project))
          .then(() => resolve())
      } else {
        awApi.getProjectsByUser(userId)
          .then((projects) => awApi.selectProject(projects))
          .then((project) => updateBranch(project._id, options.branch))
          .then((project) => showProjectInfo(project))
          .then(() => resolve())
      }
    } else if (options.delete == true) {
      awApi.getProjectsByUser(userId)
        .then((projects) => awApi.selectProject(projects))
        .then((project) => deleteProjectByProjectId(project._id))
        .then(() => resolve())
    } else if (options.delete != null) {
      deleteProjectByProjectId(options.delete)
    } else if (options.when == true || options.interval == true || options.cron == true) {
      reject('Error : Please input time')
    } else if (options.when != null) {
      if (options.projectId == true) {
        awApi.getProjectsByUser(userId)
          .then((projects) => awApi.selectProject(projects))
          .then((project) => updateScheduleWhen(project._id, options.when))
          .then((project) => showProjectInfo(project))
          .then(() => resolve())
      } else if (options.projectId != null) {
        updateScheduleWhen(options.projectId, options.when)
          .then((project) => showProjectInfo(project))
          .then(() => resolve())
      }
    } else if (options.interval != null) {
      if (options.projectId == true) {
        awApi.getProjectsByUser(userId)
          .then((projects) => awApi.selectProject(projects))
          .then((project) => updateScheduleInterval(project._id, options.interval))
          .then((project) => showProjectInfo(project))
          .then(() => resolve())
      } else if (options.projectId != null ) {
        updateScheduleInterval(options.projectId, options.interval)
          .then((project) => showProjectInfo(project))
          .then(() => resolve())
      }
    } else if (options.cron != null) {
      if (options.projectId != null) {
        awApi.updateScheduleCron(options.projectId, options.interval)
          .then(() => resolve())
      } else {
        awApi.getProjectsByUser(userId)
          .then((projects) => awApi.selectProject(projects))
          .then((project) => awApi.updateScheduleCron(project._id, options.interval))
          .then(() => resolve())
      }
    } else if (!options.list && !options.interval && !options.when
      && !options.cron && !options.delete
      && !options.subscriber
      && !options.branch) {
      if (options.projectId == true) {
        awApi.getProjectsByUser(userId)
          .then((projects) => awApi.selectProject(projects))
          .then((project) => showProjectInfo(project))
          .then(() => resolve())
      } else if (options.projectId != null) {
        awApi.getProject(options.projectId)
          .then((project) => showProjectInfo(project))
          .then(() => resolve())
      }
    }
  })
}

function checkRepo(owner, repo) {
  return new Promise ((resolve, reject) => {
    let options = {
      owner: owner,
      repo: repo
    }
    github.checkRepo(options, function (repo) {
      resolve(repo)
    })
  })
}

function selectRepo(login) {
  return new Promise ((resolve, reject) => {
    github.getRepos(login, function (data) {
      let repoArray = []
      data.forEach(repo => {
        repoArray.push(repo.full_name)
        repos.set(repo.full_name, repo)
      })
      promptRepos(repoArray, (data) => {
        resolve(repos.get(data.repo))
      })
    })
  })
}

function selectLogin(orgs) {
  return new Promise ((resolve, reject) => {
    let orgArray = [confStore.get('login')]
    orgs.forEach(org => {
      orgArray.push(org.login)
    })
    promptOrg(orgArray, (data) => {
      resolve(data.user)
    })
  })
}

function promptRepos(repos, callback) {
  var questions = [
    {
      name: 'repo',
      type: 'list',
      message: 'Select a repository',
      choices: repos
    }
  ];
  inquirer.prompt(questions).then(callback);
}

function promptOrg(orgs, callback) {
  var questions = [
    {
      name: 'user',
      type: 'list',
      message: 'Select a user or organization',
      choices: orgs,
      default: [confStore.get('userId')],
    }
  ];
  inquirer.prompt(questions).then(callback);
}


function getInstancesByProject (project) {
  return new Promise ((resolve, reject) => {
    var status = new Spinner('Getting instances ...');
    status.start();
    confStore.set(conf.LAST_ADDED_PROJECT, project.full_name)
    awInstance.getInstancesByProject(project._id).then(res => {
      if (res!= null) {
        status.stop()
        resolve(res.data.data.instances)
      }
    }).catch(err => {
      console.error(err)
      status.stop()
      reject(err)
    })
  })
}

function addRepo (repo) {
  return new Promise ((resolve, reject) => {
    var data = {
      name: repo.name,
      full_name: repo.full_name,
      owner: confStore.get('userId'),
      html_url: repo.html_url,
      git_url: repo.git_url,
      default_branch: repo.default_branch,
      provider: "github"
    }
    confStore.set(conf.LAST_ADDED_PROJECT, repo.full_name)
    awProject.addProject(data).then(res => {
      if (res != null) {
        resolve(res.data.projectId)
      }
    }).catch(err => {
      console.error(err)
      confStore.delete(conf.LAST_ADDED_PROJECT)
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

function deleteProjectByProjectId (projectId) {
  return new Promise ((resolve, reject) => {
    awProject.deleteProject(projectId).then(res => {
      if (res != null) {
        resolve()
      }
    }).catch(err => {
      console.error(err)
      reject(err)
    })
  })
}

function showProjectInfo (project) {
  console.log(chalk.bold.yellow('Project Information : '))
  makeProjectInfoFormat(project)
}

function showProjects (projects) {
  console.log('[' + chalk.bold.yellow(confStore.get('login')) + '] Project list >')
  projects.forEach((project, i) => {
    makeProjectFormat(project, i)
  })
}

function makeProjectFormat (project, index) {
  let split = chalk.blue('|')
  console.log(index + '. ' + chalk.green(`${project.full_name}`) + `${split}ID:${project._id}`)
}

function makeProjectInfoFormat (project) {
  Object.keys(project).map(function(key ) {
    console.log(chalk.blue(`${key}`) + `:${project[key]}`)
  });
}

function showAddProjectDoneMsg (projectName, projectId) {
  console.log(chalk.bold.green(`${projectName}`) + ' is successfully added.')
}

function showInstances (instances) {
  console.log('[' + chalk.bold.yellow(confStore.get(conf.LAST_ADDED_PROJECT)) + '] Run History >')
  instances.forEach((instance, i) => {
    makeInstanceFormat(instance, i)
  })
}

function makeInstanceFormat (instance, index) {
  let status
  if (instance.status == "PASS") {
    status = chalk.green(`${instance.status}  `)
  } else if (instance.status == "FAIL") {
    status = chalk.magenta(`${instance.status}  `)
  } else if (instance.status == "BROKEN") {
    status = chalk.red(`${instance.status}`)
  }
  console.log(index + '. ' + status + `:${instance._id}:`)
}

