"use strict";

var chalk       = require('chalk');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Spinner     = CLI.Spinner;
var github = require('../github');
var _           = require('lodash');
var git         = require('simple-git')();
var touch       = require('touch');
var fs          = require('fs');
var files       = require('../../lib/files');
var WhatsIt  = require('whatsit-sdk-js')
let aw = new WhatsIt({});
let awUser = aw.getUser();
var Configstore = require('configstore');
var pkg         = require('../../package.json')
const conf = new Configstore(pkg.name, {foo: 'bar'});

exports.login = function () {
  github.githubAuth(function(err, authed) {
    if (err) {
      switch (err.code) {
        case 401:
          console.log(chalk.red('Couldn\'t log you in. Please try again.'));
          break;
        case 422:
          console.log(chalk.red('You already have an access token.'));
          console.log(chalk.red('Delete the old access token (Go to https://github.com/settings/tokens)'));
          // Todo : To check whether token is stored or not in local storage(configstore)
          break;
      }
    }
    if (authed) {
      github.getProfile((data) => {
        var status = new Spinner('Update profile to whatsit.net ...');
        status.start();
        awUser.updateProfile({
          login: data.login,
          avatarUrl: data.avatar_url,
          email: data.email,
          oauthProvider: "github"
        }).then((res) => {
          if (res.data.data._id) {
            conf.set('userId', res.data.data._id)
            conf.set('login', data.login)
          }
          status.stop()
        })
      })
      console.log(chalk.green('Sucessfully authenticated!'));
    }
  });
}

exports.logout = function() {
  conf.clear();
  console.log('Clean Data in local storage');
}