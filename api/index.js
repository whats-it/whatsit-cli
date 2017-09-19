
var chalk       = require('chalk');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Spinner     = CLI.Spinner;
// var WhatsIt  = require('whatsit-sdk-js')
var WhatsIt  = require('../../whatsit-sdk-js/dist/WhatsIt')

let aw = new WhatsIt({});
let awProject = aw.getProject();
var Configstore = require('configstore');
var pkg         = require('../package.json')
const conf = require('../util/config')
const confStore = new Configstore(pkg.name, {});

exports.getProjectsByUser = function (userId) {
  if (userId == null) {
    console.log('User Id is null so You can not get a list of project');
    return;
  }

  return new Promise ((resolve, reject) => {
    var status = new Spinner('Getting projects ...');
    status.start();

    awProject.getProjectsByUser(userId).then(res => {
      if (res!= null) {
        status.stop()
        resolve(res.data.data.projects)
      }
    }).catch(err => {
      console.error(err)
      status.stop()
      reject(err)
      console.log('error ' + JSON.stringify(err, null, 2));
    })
  })
}

function getProject (projectId) {
  return new Promise ((resolve, reject) => {
    var status = new Spinner('Getting a project ...');
    status.start();
    awProject.getProject(projectId).then(res => {
      if (res != null) {
        status.stop()
        console.log(res.data)
        confStore.set(conf.LAST_SELECTED_PROJECT, res.data.data.full_name)
        resolve(res.data.data)
      }
    }).catch(err => {
      console.error(err)
      status.stop()
      reject(err)
    })
  })
}

function promptProjects (projects, callback) {
  var questions = [
    {
      name: 'project',
      type: 'list',
      message: 'Select a project',
      choices: projects
    }
  ];
  inquirer.prompt(questions).then(callback);
}

function selectProject (projects) {
  return new Promise ((resolve, reject) => {
    var tmpProjects = new Map();
    let array = []
    projects.forEach(project => {
      if (project.full_name) {
        array.push(project.full_name)
        tmpProjects.set(project.full_name, project)
      }
    })
    promptProjects(array, (data) => {
      resolve(tmpProjects.get(data.project))
    })
  })
}

exports.getProject = getProject
exports.promptProjects = promptProjects