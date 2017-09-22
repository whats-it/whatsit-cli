"use strict";

var chalk       = require('chalk');
var CLI         = require('clui');
var inquirer    = require('inquirer');
var Spinner     = CLI.Spinner;
var Promise = require('promise');
var WhatsIt  = require('whatsit-sdk-js')
// var WhatsIt  = require('../../../whatsit-sdk-js/dist/WhatsIt')
let aw = new WhatsIt({});
let awProject = aw.getProject();
var Configstore = require('configstore');

var pkg         = require('../../package.json')
let awApi = require('../../api')
const confStore = new Configstore(pkg.name, {foo: 'bar'});

let proUtil = require('../../util/questions');

exports.project = function (options) {

  return new Promise ((resolve, reject) => {

    if (options.list) {
      // Query projects by userId. Doesn't need to type option
      cmdShowProjects()
        .then(() => {
          resolve();
        })
        .catch((err) => {
          console.log('An error occurred : ' + err);
          reject(err);
        });
    } else if (options.name) {
      // create a new project
      cmdCreateProject(options.name)
        .then(() => {
          resolve();
        })
        .catch((err) => {
          console.log('An error occurred : ' + err);
          reject(err);
        });
    }
  });
}

exports.trainset = function (options) {

  return new Promise ((resolve, reject) => {

    if (options.trainset) {
      // export train-set
      cmdExportTrainset(options.trainset)
        .then(() => {
          resolve();
        })
        .catch((err) => {
          console.log('An error occurred : ' + err);
          reject(err);
        });
    } else if (options.trainsettype) {
      // export train-set as specific type
      cmdExportTrainsetType(options.trainsettype)
        .then(() => {
          resolve();
        })
        .catch((err) => {
          console.log('An error occurred : ' + err);
          reject(err);
        });
    }
  });
}

/**
 * command : show all of project
 * @return {*|Promise}
 */
function cmdShowProjects() {

  return new Promise((resolve, reject) => {
    let userId = getUserId();
    if (userId == null) {
      console.log('Firstly, You need to login');
      return ;
    }

    var status = new Spinner('Retrieving your projects ...');

    awApi.getProjectsByUser(userId)
      .then((projects) => {
        showProjects(projects);
        status.stop();
        resolve();
      })
      .catch((err) => {
        status.stop();
        reject(err);
      });
  });
}

/**
 * command : create a project
 * @param name A new project's name
 * @return {*|Promise}
 */
function cmdCreateProject(name) {

  return new Promise((resolve, reject) => {
    if (typeof name == 'boolean') {
      // User just type -a without project name
      askNewProjectName()
        .then((projectName) => {
          // create a new Project as projectName
          return addProject(projectName);
        })
        .then((res) => {
          console.log(JSON.stringify(res, null,2));
          resolve();
        });
    } else {
      // User type -a and projectName
      // create a new Project as projectName
      addProject(options.name)
        .then(()=>{
          resolve();
        });
    }
  });
}

/**
 * command : export trainset
 * @param trainset The trainset's id
 * @return {*|Promise}
 */
function cmdExportTrainset(trainset) {

  return new Promise((resolve, reject) => {
    // Todo : handling reject & exception
    if (typeof trainset == 'boolean') {
      proUtil.askProject()
        .then((projectId)=>{
          return awProject.getTrainset(projectId);
        })
        .then((res) => {
          console.log('Trainset\n' + JSON.stringify(res.data, null, 2));
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    } else {
      awProject.getTrainset(projectId)
        .then((res) => {
          console.log('Trainset\n' + JSON.stringify(res.data, null, 2));
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    }
  });
}

function cmdExportTrainsetType(type) {

  return new Promise((resolve, reject) => {
    // Todo : handling reject & exception
    if (typeof type == 'boolean') {
      proUtil.askProject()
        .then((projectId)=>{
          return askTrainsetType(projectId);
        })
        .then((res) => {
          console.log('Trainset\n' + JSON.stringify(res.data, null, 2));
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    } else {
      awProject.getTrainset(projectId)
        .then((res) => {
          console.log('Trainset\n' + JSON.stringify(res.data, null, 2));
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    }
  });
}

/**
 * Add a new Project with Project Name
 * @param projectName Name of new Project
 * @param resolve
 */
function addProject(projectName) {

  return new Promise( (resolve, reject) => {

    var status = new Spinner('Adding a project ...');
    status.start();
    var data = {
      name: projectName,
      userId: confStore.get('userId'),
      //thumbnail : optional
    };

    // Invoke addProject
    awProject.addProject(data)
      .then((res) => {
        resolve(res.data);
        status.stop();
      })
      .catch(err => {
        status.stop();
        reject(err);
      })
  });
}

/**
 * Asking a new project name
 * @return {*|Promise}
 */
function askNewProjectName() {

  return new Promise((resolve, reject) => {
    var questions = [
      {
        name: 'projectName',
        type: 'input',
        message: 'Enter Project Name : ',
      }
    ];

    inquirer.prompt(questions)
      .then((answers) => {
        resolve(answers.projectName);
      })
      .catch((err) => {
        reject(err);
      })
  });
}

function askTrainsetType(projectId) {

  return new Promise((resolve, reject) => {

    var questions = [
      {
        name: 'type',
        type: 'input',
        message: 'What is type of trainset? ',
      }
    ];

    inquirer.prompt(questions)
      .then((answers) => {
        return awProject.getTrainset(projectId,
          {
            format: answers.type
          });
      })
      .then((res) => {
        resolve(res.data);
        console.log(JSON.stringify(res.data, null, 2));
      })
      .catch((err) =>{
        console.log(JSON.stringify(err));
      });
  });
}

/**
 * Get user id from local storage
 * @return {*}
 */
function getUserId() {
  let _id = confStore.get('userId')
  if (_id == null) {
    console.log('Can not find userId in configstore');
    return null;
  }

  // create query param with userId
  var userId = {
    userId: _id
  };

  return userId;
}

/**
 * Display project list
 * @param projects
 */
function showProjects (projects) {
  console.log('[' + chalk.bold.yellow(confStore.get('login')) + '] Project list >')
  projects.forEach((project, i) => {
    makeProjectFormat(project, i)
  })
}

/**
 * Display format for project list
 * @param project
 * @param index
 */
function makeProjectFormat (project, index) {
  let split = chalk.blue('|')
  console.log(index + '. ' + chalk.green(`${project.name}`) + `${split}ID:${project._id}`)
}
