//GitHubApi Document : https://mikedeboer.github.io/node-github/

var chalk       = require('chalk');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Configstore = require('configstore');
var Spinner     = CLI.Spinner;
var GitHubApi   = require('github');
var _           = require('lodash');
var git         = require('simple-git')();
var touch       = require('touch');
var fs          = require('fs');
var files       = require('../../lib/files');
var pkg         = require('../../package.json')
const conf = new Configstore(pkg.name, {foo: 'bar'});


// if (files.directoryExists('.git')) {
//   console.log(chalk.red('Already a git repository!'));
//   process.exit();
// }

var github = new GitHubApi({
  version: '3.0.0'
});

function getGithubCredentials(callback) {
  var questions = [
    {
      name: 'username',
      type: 'input',
      message: 'Enter your Github username or e-mail address:',
      validate: function( value ) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter your username or e-mail address';
        }
      }
    },
    {
      name: 'password',
      type: 'password',
      message: 'Enter your password:',
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter your password';
        }
      }
    }
  ];

  inquirer.prompt(questions).then(callback);
}

function getGithubToken(callback) {
  if (conf.get('github.token')) {
    return callback(null, conf.get('github.token'))
  }

  getGithubCredentials(function(credentials) {
    var status = new Spinner('Authenticating you, please wait...');
    status.start();

    github.authenticate(
      _.extend(
        {
          type: 'basic',
        },
        credentials
      )
    );

    github.authorization.create({
      scopes: ['user', 'public_repo', 'repo', 'repo:status'],
      note: 'whatsit, the command-line tool for whatsit.net'
    }, function(err, res) {
      status.stop();
      if ( err ) {
        return callback( err );
      }
      if (res.data.token) {
        conf.set('github.token', res.data.token)
        return callback(null, res.data.token);
      }
      return callback();
    });
  });
}

function createRepo(callback) {
  var argv = require('minimist')(process.argv.slice(2));

  var questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter a name for the repository:',
      default: argv._[0] || files.getCurrentDirectoryBase(),
      validate: function( value ) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter a name for the repository';
        }
      }
    },
    {
      type: 'input',
      name: 'description',
      default: argv._[1] || null,
      message: 'Optionally enter a description of the repository:'
    },
    {
      type: 'list',
      name: 'visibility',
      message: 'Public or private:',
      choices: [ 'public', 'private' ],
      default: 'public'
    }
  ];

  inquirer.prompt(questions).then(function(answers) {
    var status = new Spinner('Creating repository...');
    status.start();

    var data = {
      name : answers.name,
      description : answers.description,
      private : (answers.visibility === 'private')
    };

    github.repos.create(
      data,
      function(err, res) {
        status.stop();
        if (err) {
          return callback(err);
        }
        return callback(null, res.ssh_url);
      }
    );
  });
}

function createGitignore(callback) {
  var filelist = _.without(fs.readdirSync('.'), '.git', '.gitignore');

  if (filelist.length) {
    inquirer.prompt(
      [
        {
          type: 'checkbox',
          name: 'ignore',
          message: 'Select the files and/or folders you wish to ignore:',
          choices: filelist,
          default: ['node_modules', 'bower_components']
        }
      ]
    ).then(function( answers ) {
        if (answers.ignore.length) {
          fs.writeFileSync( '.gitignore', answers.ignore.join( '\n' ) );
        } else {
          touch( '.gitignore' );
        }
        return callback();
      }
    );
  } else {
    touch('.gitignore');
    return callback();
  }
}

function setupRepo(url, callback) {
  var status = new Spinner('Setting up the repository...');
  status.start();

  git
    .init()
    .add('.gitignore')
    .add('./*')
    .commit('Initial commit')
    .addRemote('origin', url)
    .push('origin', 'master')
    .then(function(){
      status.stop();
      return callback();
    });
}

function githubAuth(callback) {
  getGithubToken(function(err, token) {
    if (err) {
      return callback(err);
    }
    github.authenticate({
      type : 'oauth',
      token : token
    });
    return callback(null, token);
  });
}

exports.getOrgs = function () {
  return new Promise ((resolve, reject) => {
    var status = new Spinner('Getting orgs ...');
    status.start();
    github.authenticate({
      type: "oauth",
      token: conf.get('github.token')
    });
    github.users.getOrgs({}, (err, res) => {
      if (err) {
        status.stop();
        reject(err)
      } else {
        status.stop();
        resolve(res.data)
      }
    })
  })
}

exports.checkRepo = function (options, callback) {
  var status = new Spinner('Checking repo ...');
  status.start();
  github.repos.get({
    owner: options.owner,
    repo: options.repo},
    (err, res) => {
      status.stop()
      if (res.data.full_name == `${options.owner}/${options.repo}`) {
        callback(res.data)
      }
  })
}

exports.getRepos = function (login, callback) {
  var status = new Spinner('Getting repos ...');
  status.start();
  github.authenticate({
    type: "oauth",
    token: conf.get('github.token')
  });

  if (login == conf.get('login')) {
    github.repos.getAll({type:'owner', per_page:300}, (err, res) => {
      status.stop()
      callback(res.data)
    })
  } else {
    github.repos.getForOrg({org:login}, (err, res) => {
      status.stop()
      callback(res.data)
    })
  }
}

exports.getProfile = function (callback) {
  var status = new Spinner('Getting profile from Github ...');
  status.start();
  github.users.get({}, (err, res) => {
    status.stop();
    callback(res.data)
  })
}

exports.githubAuth = githubAuth
