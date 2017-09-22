"use strict";

var Promise = require('promise');
var inquirer    = require('inquirer');
var Configstore = require('configstore');
var pkg         = require('../package.json')
const confStore = new Configstore(pkg.name, {foo: 'bar'});
var WhatsIt  = require('whatsit-sdk-js')
// var WhatsIt  = require('../../whatsit-sdk-js/dist/WhatsIt')
let awApi = require('../api')

exports.askProject = function() {

  return new Promise((resolve, reject) => {
    askProjectName()
      .then((res) => {
        return getProjectIdByName(res);
      })
      .then((projectId) => {
        resolve(projectId);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function askProjectName() {

  let userId = getUserId();

  return new Promise( (resolve, reject) => {
    awApi.getProjectsByUser(userId)
      .then((projects) => {
        // ask choice project in list
        var fineProjects = extractProjectName(projects);

        // Todo : use async.waterfall
        if (fineProjects.length != 0) {
          var questions = [
            {
              name: 'selectedProject',
              type: 'list',
              message: 'Select Project',
              choices: fineProjects
            }
          ];
          inquirer.prompt(questions)
            .then((answers) => {
              resolve({
                projects: projects,
                selected: answers.selectedProject
              });
            });
        } else {
          reject('Reject : There is no project');
        }
      })
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
 * Make a project list which has only each project name
 * @param projects All project info.
 * @return {Array}
 */
function extractProjectName(projects) {

  var ret = [];
  projects.forEach((project) => {
    ret.push(project.name);
  });

  return ret;
}

/**
 * Retrieve selected projectId
 * @param res projects and ID of selected project
 * @return {*|Promise}
 */
function getProjectIdByName(res) {

  return new Promise((resolve, reject) => {

    if (res.projects.length == 0) {
      reject('There is no project');
    }

    res.projects.forEach((project) => {
      if (project.name == res.selected) {
        resolve(project._id);
      }
    });

    reject('There is no matched project');
  });
}
