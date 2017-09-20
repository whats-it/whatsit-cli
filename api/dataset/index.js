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
// var WhatsIt  = require('../../../whatsit-sdk-js/dist/WhatsIt')
let aw = new WhatsIt({});
let awDataset = aw.getDataset();
var Configstore = require('configstore');
var pkg         = require('../../package.json')
const conf = require('../../util/config')
let awApi = require('../../api')
var inquirer    = require('inquirer');

var async = require('async');

const confStore = new Configstore(pkg.name, {foo: 'bar'});

exports.dataset = function (options) {
  console.log(JSON.stringify(options, null,2));

  // Below code is for local server. Please use below code, if you want to test on your machine
  // aw.setBase("http://127.0.0.1:3000");
  return new Promise((resolve, reject) => {

    // CRUD for dataset
    if (!options.projectId && options.list) {

      let userId = getUserId();
      // To retrieve list of project
      // let _id = confStore.get('userId')
      // var userId = {
      //   userId: _id
      // };

      awApi.getProjectsByUser(userId)
        .then((projects) => {

          var fineProjects = extractProjectName(projects);

          // Todo : use async.waterfall
          if (fineProjects.length != 0) {

            // User has some project
            askOneofProject(fineProjects, (selectedProject) => {
              // select one of project
              getProjectIdByName(projects, selectedProject, (projectId) => {
                // retrieve projectId by project name
                var queryParam = {
                  projectId: projectId
                }

                awDataset.getDatasetByProjectId(queryParam)
                  .then((res) => {
                    if (res != null) {
                      // Todo : handling error message in response
                      console.log(JSON.stringify(res.data, null, 2));
                      resolve(res.data.data._id)
                    } else {
                      console.log('Response is null');
                    }
                  })
                  .catch(err => {
                    console.error(err)
                  });

              });
            });
          }
        });
    } else if (options.projectId) {
      // retrieve all of datasets
      // var queryParam = {
      //   projectId: '59ba47911f7a3746a77558e3'
      // }
      //
      // awDataset.getDatasetByProjectId(queryParam)
      //   .then((res) => {
      //     if (res != null) {
      //       // Todo : handling error message in response
      //       console.log(JSON.stringify(res.data, null, 2));
      //       resolve(res.data.data._id)
      //     } else {
      //       console.log('Response is null');
      //     }
      //   })
      //   .catch(err => {
      //     console.error(err)
      //   });
    } else if (options.add) {
      // To retrieve list of project
      let _id = confStore.get('userId')
      var userId = {
        userId: _id
      };

      awApi.getProjectsByUser(userId)
        .then((projects) => {

          console.log(JSON.stringify(projects));

          var fineProjects = extractProjectName(projects);

          console.log(JSON.stringify(fineProjects));

          // Todo : use async.waterfall
          if (fineProjects.length != 0) {
            // User has some project
            askOneofProject(fineProjects, (selectedProject) => {
              // select one of project
              getProjectIdByName(projects, selectedProject, (projectId) => {
                // retrieve projectId by project name

                var questions = [
                  // ask about type of data
                  {
                    name: 'datatype',
                    type: 'input',
                    message: 'Type data type. For example, video, image',
                  },
                  // ask about name
                  {
                    name: 'name',
                    type: 'input',
                    message: 'type data\'s name'
                  },
                  // ask about source
                  {
                    name: 'source',
                    type: 'input',
                    message: 'type source url'
                  },
                  {
                    name: 'desc',
                    type: 'input',
                    message: 'type description for data'
                  }
                ];

                inquirer.prompt(questions).then((res) => {
                  console.log(JSON.stringify(res, null, 2));

                  // var options = {
                  //   projectId: projectId,
                  //   name: res.name,
                  //   desc: res.desc,
                  //   type: res.datatype,
                  // };
                  //
                  // options.data = {
                  //   name: res.name+'-data',
                  //   source: res.source,
                  // };
                  //
                  // options.data.sections = [
                  //   1504858057,1504858080
                  // ];

                  var options = makeDummy4Dataset(projectId, res);

                  console.log('addDataset options is ' + JSON.stringify(options, null, 2));

                  awDataset.addDataset(options)
                    .then((res) => {
                      if (res != null) {
                        // Todo : handling error message in response
                        console.log(JSON.stringify(res.data, null, 2));
                        resolve(res.data.data._id)
                      } else {
                        console.log('Response is null');
                      }
                    })
                    .catch(err => {
                      console.error(err)
                    });
                });
              });
            });
          }
        });
    }
  });

}

function getUserId() {
  let _id = confStore.get('userId')
  var userId = {
    userId: _id
  };

  return userId;
}
function makeDummy4Dataset(projectId, res) {
  var options = {
    projectId: projectId,
    name: res.name,
    desc: res.desc,
    type: res.datatype,
  };

  options.data = {
    name: res.name+'-data',
    source: res.source,
  };

  options.data.sections = [
    1504858057,1504858080
  ];
  return options;
}
/**
 * Ask user selection
 * @param fineProjects array of project name
 * @param cb callback
 */
function askOneofProject(fineProjects, cb) {
  var questions = [
    {
      name: 'selectedProject',
      type: 'list',
      message: 'Select one of projects',
      choices: fineProjects,
    }
  ];

  inquirer.prompt(questions).then((answers) => {
    cb(answers.selectedProject);
  });
}

/**
 * To extract project name
 * @param projects [array] projects data
 */
function extractProjectName(projects) {

  var ret = [];
  projects.forEach((project) => {
    ret.push(project.name);
  });

  return ret;
}

/**
 * Retrieve ProjectId by ProjectName
 * @param projects list of project
 * @param name project name
 * @param cb callback
 * @return {*} projectId
 */
function getProjectIdByName(projects, name, cb) {

  if (projects.length == 0) {
    return cb(0);
  }

  projects.forEach((project) => {
    if (project.name == name) {
      cb(project._id);
    }
  });
}
