
var chalk       = require('chalk');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Spinner     = CLI.Spinner;
var WhatsIt  = require('whatsit-sdk-js')
let aw = new WhatsIt({});
let awProject = aw.getProject();
let awInstance = aw.getInstance();
let awSchedule = aw.getSchedule();
let awScheduler = aw.getScheduler();
var Configstore = require('configstore');
var pkg         = require('../package.json')
const conf = require('../util/config')
const confStore = new Configstore(pkg.name, {});

exports.getProjectsByUser = function (userId) {
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


function getSchedulesByProject (project) {
  return new Promise ((resolve, reject) => {
    var status = new Spinner('Getting schedules ...');
    status.start();
    awSchedule.getSchedulesByProject(project._id).then(res => {
      if (res!= null) {
        status.stop()
        console.log(res.data)
        resolve(res.data.data.schedules)
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

function promptSchedules (schedules, callback) {
  var questions = [
    {
      name: 'schedule',
      type: 'list',
      message: 'Select a schedule',
      choices: schedules
    }
  ];
  inquirer.prompt(questions).then(callback);
}

function promptSchedulers (schedulers, callback) {
  var questions = [
    {
      name: 'scheduler',
      type: 'list',
      message: 'Select a scheduler',
      choices: schedulers
    }
  ];
  inquirer.prompt(questions).then(callback);
}

function deleteProject(project) {
  return new Promise ((resolve, reject) => {
    awProject.deleteProject(project._id).then(res => {
      if (res != null) {
        resolve(project)
      }
    }).catch(err => {
      console.error(err)
      reject(err)
    })
  })
}

function deleteScheduleInScheduler (schedule) {
  return new Promise ((resolve, reject) => {
    console.log(schedule)
    awScheduler.deleteSchedule(schedule._id).then(res => {
      if (res != null) {
        resolve(schedule)
      }
    }).catch(err => {
      console.error(err)
      reject(err)
    })
  })
}

function deleteSchedule (schedule) {
  return new Promise ((resolve, reject) => {
    awSchedule.deleteSchedule(schedule._id).then(res => {
      if (res != null) {
        resolve(schedule)
      }
    }).catch(err => {
      console.error(err)
      reject(err)
    })
  })
}

function deleteScheduler (scheduler) {
  return new Promise ((resolve, reject) => {
    awScheduler.deleteScheduler(scheduler._id).then(res => {
      if (res != null) {
        resolve(scheduler)
      }
    }).catch(err => {
      console.error(err)
      reject(err)
    })
  })
}

function deleteSchedulerById (id) {
  return new Promise ((resolve, reject) => {
    awScheduler.deleteScheduler(id).then(res => {
      if (res != null) {
        resolve(id)
      }
    }).catch(err => {
      console.error(err)
      reject(err)
    })
  })
}

function getSchedule (id) {
  return new Promise ((resolve, reject) => {
    var status = new Spinner('Getting a schedule ...');
    status.start();
    awSchedule.getSchedule(id).then(res => {
      if (res!= null) {
        status.stop()
        resolve(res.data.data)
      }
    }).catch(err => {
      console.error(err)
      status.stop()
      reject(err)
    })
  })
}

function getSchedulesByUser (userId) {
  return new Promise ((resolve, reject) => {
    var status = new Spinner('Getting schedules ...');
    status.start();
    awSchedule.getSchedulesByUser(userId).then(res => {
      if (res!= null) {
        status.stop()
        resolve(res.data.data.schedules)
      }
    }).catch(err => {
      console.error(err)
      status.stop()
      reject(err)
    })
  })
}

function selectSchedule (schedules) {
  return new Promise ((resolve, reject) => {
    var tmpSchedules = new Map();
    let array = []
    schedules.forEach(schedule => {
      if (schedule._id) {
        array.push(schedule._id)
        tmpSchedules.set(schedule._id, schedule)
      }
    })
    promptSchedules(array, (data) => {
      resolve(tmpSchedules.get(data.schedule))
    })
  })
}

function selectScheduler (schedulers) {
  return new Promise ((resolve, reject) => {
    var tmpSchedulers = new Map();
    let array = []
    schedulers.forEach(scheduler => {
      if (scheduler._id) {
        array.push(scheduler._id)
        tmpSchedulers.set(scheduler._id, scheduler)
      }
    })
    promptSchedulers(array, (data) => {
      resolve(tmpSchedulers.get(data.scheduler))
    })
  })
}

function runProject (project) {
  return new Promise ((resolve, reject) => {
    var status = new Spinner('Running project ...');
    status.start();
    confStore.set(conf.LAST_RUN_PROJECT, project.full_name)
    awInstance.addInstance({projectId: project._id}).then(res => {
      if (res!= null) {
        status.stop()
        resolve(res.data.data)
      }
    }).catch(err => {
      console.error(err)
      status.stop()
      reject(err)
    })
  })
}

function createSchedule (project) {
  return new Promise ((resolve, reject) => {
    var status = new Spinner('Creating schedule ...');
    status.start();
    confStore.set(conf.LAST_RUN_PROJECT, project.full_name)
    let options = confStore.get(conf.OPTIONS)
    let cron = options.cron ? options.cron : null
    let data = {
      projectId: project._id,
      owner: project.owner,
      cron: cron
    }
    awSchedule.addSchedule(data).then(res => {
      if (res!= null) {
        status.stop()
        resolve(res.data.data)
      }
    }).catch(err => {
      console.error(err)
      status.stop()
      reject(err)
    })
  })
}

function updateBranch (projectId, branch) {
  return new Promise ((resolve, reject) => {
    let data = {
      default_branch: branch
    }
    awProject.updateProject(projectId, data).then(res => {
      if (res != null) {
        console.log(chalk.bold.green(`${res.data.data.full_name}`) + ' is successfully updated as follow.')
        resolve(res.data.data)
      }
    }).catch(err => {
      console.error(err)
      reject(err)
    })
  })
}

function addEmailSubscriber (projectId, email) {
  return new Promise ((resolve, reject) => {
    let options = {
      email: email
    }
    awProject.addEmailSubscriber(projectId, options).then(res => {
      if (res != null) {
        resolve(res.data.data)
      }
    }).catch(err => {
      console.error(err)
      reject(err)
    })
  })
}

function deleteEmailSubscriber (projectId, email) {
  return new Promise ((resolve, reject) => {
    let options = {
      email: email
    }
    awProject.deleteEmailSubscriber(projectId, options).then(res => {
      if (res != null) {
        resolve(res.data)
      }
    }).catch(err => {
      console.error(err)
      reject(err)
    })
  })
}

function updateSubscriber (projectId, subscriber) {
  return new Promise ((resolve, reject) => {
    let subArr = subscriber.replace(' ','').split(',')
    let data = {
      subscriber: subscriber.replace(' ','').split(',')
    }
    awProject.updateProject(projectId, data).then(res => {
      if (res != null) {
        console.log(chalk.bold.green(`${res.data.data.full_name}`) + ' is successfully updated as follow.')
        resolve(res.data.data)
      }
    }).catch(err => {
      console.error(err)
      reject(err)
    })
  })
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

function startSchedule (schedule) {
  return new Promise ((resolve, reject) => {
    var status = new Spinner('Starting schedule ...');
    status.start();
    let data = {
      projectId: project._id,
      owner: project.owner,
      cron: cron
    }
    awSchedule.startSchedule(data).then(res => {
      if (res!= null) {
        status.stop()
        resolve(res.data.data)
      }
    }).catch(err => {
      console.error(err)
      status.stop()
      reject(err)
    })
  })
}

function getSchedulers () {
  return new Promise ((resolve, reject) => {
    var status = new Spinner('Getting schedulers ...');
    status.start();
    awScheduler.getSchedulers().then(res => {
      if (res!= null) {
        status.stop()
        resolve(res.data.data.schedulers)
      }
    }).catch(err => {
      console.error(err)
      status.stop()
      reject(err)
    })
  })
}

function getScheduler (id) {
  return new Promise ((resolve, reject) => {
    var status = new Spinner('Getting scheduler ...');
    status.start();
    awScheduler.getScheduler(id).then(res => {
      if (res!= null) {
        status.stop()
        resolve(res.data.data)
      }
    }).catch(err => {
      console.error(err)
      status.stop()
      reject(err)
    })
  })
}

exports.getProject = getProject
exports.getSchedule = getSchedule
exports.runProject = runProject
exports.deleteProject = deleteProject
exports.deleteSchedule = deleteSchedule
exports.deleteScheduler = deleteScheduler
exports.deleteScheduleInScheduler = deleteScheduleInScheduler
exports.promptProjects = promptProjects
exports.getSchedulesByProject  = getSchedulesByProject
exports.getSchedulesByUser = getSchedulesByUser
exports.selectProject  = selectProject
exports.selectSchedule = selectSchedule
exports.selectScheduler = selectScheduler
exports.createSchedule = createSchedule
exports.updateScheduleCron = updateScheduleCron
exports.updateSubscriber = updateSubscriber
exports.updateBranch = updateBranch
exports.addEmailSubscriber = addEmailSubscriber
exports.deleteEmailSubscriber = deleteEmailSubscriber
exports.getSchedulers = getSchedulers
exports.getScheduler = getScheduler
