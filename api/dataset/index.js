"use strict";

var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Spinner     = CLI.Spinner;
var _           = require('lodash');
var Promise = require('promise');
var WhatsIt  = require('whatsit-sdk-js')
// var WhatsIt  = require('../../../whatsit-sdk-js/dist/WhatsIt')
let aw = new WhatsIt({});
let awDataset = aw.getDataset();
var inquirer    = require('inquirer');

let proUtil = require('../../util/questions');

exports.dataset = function (options) {

  return new Promise((resolve, reject) => {

    if (options.projectId) {
      cmdRetrieveDataset(options.projectId)
        .then((res) => {
          console.log(JSON.stringify(res, null, 2));
          resolve(res);
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        })
    } else if (options.add) {
      cmdAddDataset(options.add)
        .then((res) => {
          console.log(JSON.stringify(res, null, 2));
        })
    } else if (options.get) {
      cmdGetDataset(options.get)
        .then((res) => {
          console.log(JSON.stringify(res, null, 2));
          resolve();
        });
    } else if (options.put) {

    } else if (options.contents) {
      cmdGetContents(options.contents);
    }
  });
}

/**
 * Retrieve dataset
 * @param projectId
 * @return {*|Promise}
 */
function cmdRetrieveDataset(projectId) {

  return new Promise((resolve, reject) => {
    if (typeof projectId == 'boolean') {
      proUtil.askProject()
        .then((projectId)=>{
          return awDataset.getDatasetByProjectId(
            {
              projectId: projectId
            })
        })
        .then((res) => {
          resolve(res.data);
        });
    } else {
      awDataset.getDatasetByProjectId(
        {
          projectId: projectId
        })
        .then((res) => {
          resolve(res.data);
        });
    }
  });
}

/**
 * Update a dataset
 * @param add
 * @return {*|Promise}
 */
function cmdAddDataset(add) {

  return new Promise((resolve, reject) => {
    proUtil.askProject()
      .then((projectId) => {
        return askDatasetName(projectId);
      })
      .then((options) => {
        return awDataset.addDataset(options);
      })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        console.log('An error : ' + err);
      });
  });
}

/**
 * Retrieve dataset ad dataset's id
 * @param get
 * @return {*|Promise}
 */
function cmdGetDataset(get) {

  return new Promise((resolve, reject) => {
    if (typeof get == 'boolean') {
      proUtil.askProject()
        .then((projectId) => {
          return cmdRetrieveDataset(projectId);
        })
        .then((res) => {
          return createDatasetList(res);
        })
        .then((res) => {
          return askChoiceDataset(res);
        })
        .then((id) => {
          return awDataset.getDatasetByDatasetId(id);
        })
        .then((res) => {
          resolve(res.data);
        });
    } else {
      awDataset.getDatasetByDatasetId(id)
        .then((res) => {
          resolve(res.data);
        });
    }
  });
}

function cmdGetContents(contents) {

  return new Promise((resolve, reject) => {
    proUtil.askProject()
      .then((projectId) => {
        return cmdRetrieveDataset(projectId);
      })
      .then((res) => {
        return createDatasetList(res);
      })
      .then((res) => {
        return askChoiceDataset(res);
      })
      .then((id) => {
        return askContentsCount(id);
      })
      .then((params) => {

        return awDataset.getDatasetContent(
          {
            count: params.count
          },
          params.datasetId);
      })
      .then((res) => {
        // console.log('####' + JSON.stringify(res, null, 2))
        resolve(res.data);
      })
      .catch((err) => {
        console.log('An error : ' + err);
      });
  });
}

/**
 * Questions for making dataset by cli
 * @param projectId
 * @return {*|Promise}
 */
function askDatasetName(projectId) {

  return new Promise((resolve, reject) => {
    let questions = [
      {
        name: 'name',
        type: 'input',
        message: 'Enter dataset name'
      },
      {
        name: 'desc',
        type: 'input',
        message: 'Enter description for dataset'
      },
      {
        name: 'type',
        type: 'input',
        message: 'Enter type of dataset'
      },
      {
        name: 'guide',
        type: 'input',
        message: 'Data will be created with dummy. To continue, hit a any key'
      }
    ];

    inquirer.prompt(questions)
      .then((answers) => {
        answers.projectId = projectId;
        var options = makeDummy4Dataset(answers);
        resolve(options);
      });
  });
}


/**
 * Showing datasets list
 * @param res getDatasets's response message
 * @return {*|Promise}
 */
function createDatasetList(res) {

  return new Promise((resolve, reject) => {

    if (res.responseStatus != 200 ) {
      return reject('Can not get datasets');
    }
    var list = [];
    res.data.Datasets.forEach((dataset) => {

      var temp = dataset.name + ' - ' + dataset._id;

      list.push(temp);
    });

    resolve(list);

  });
}

/**
 * Questionnaire for choice one of dataset
 * @param list Datasets' list
 * @return {*|Promise}
 */
function askChoiceDataset(list) {

  return new Promise((resolve, reject) => {

    var questions = [
      {
        name: 'dataset',
        type: 'list',
        message: 'Please select of dataset to query',
        choices: list
      }
    ];

    inquirer.prompt(questions)
      .then((answers) => {
        var temp = answers.dataset.split(' - ');

        resolve(temp[1]);
      });
  });
}

function askContentsCount(id) {

  return new Promise((resolove, reject) => {

    var questions = [
      {
        name: 'count',
        type: 'input',
        message: 'Please enter count to query'
      }
    ];

    inquirer.prompt(questions)
      .then((answer) => {

        var ret = {
          datasetId: id,
          count: answer.count
        }

        console.log('Answer ' + JSON.stringify(ret, null,2));

        resolove(ret);
      });
  });
}
/**
 * prepare dummy data for testing postDataset
 * @param answers
 * @return {{projectId: *, name, desc: *, status: string, type}}
 */
function makeDummy4Dataset(answers) {
  var options = {
    projectId: answers.projectId,
    name: answers.name,
    desc: answers.desc,
    status: 'preparing',
    type: answers.type,
  };
  options.data = [];

  var data = {
    name: answers.name+'-data',
    source: 'https://bluehack.net',
  };

  data.sections = [
    1504858057,1504858080
  ];

  options.data.push(data);

  return options;
}
