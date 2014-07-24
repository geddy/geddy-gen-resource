var path = require('path')
  , assert = require('assert')
  , fs = require('fs')
  , exec = require('child_process').exec
  , utilities = require('utilities')
  , tests;

var testAppDir = path.join(__dirname, 'tmp', 'geddy-test-app');
var modelsDir = path.join(testAppDir, 'app', 'models');
var migrationsDir = path.join(testAppDir, 'db', 'migrations');
var controllersDir = path.join(testAppDir, 'app', 'controllers');
var testsDir = path.join(testAppDir, 'test', 'models');

function createResource(name, argv, cb)
{
  if (!argv) {
    argv = []
  }

  if (typeof argv === 'function') {
    cb = argv;
    argv = [];
  }

  var p = exec(path.join(__dirname, 'helpers', 'exec.js') + ' ' + name + ' ' + argv.join(' '), cb);
  p.stdout.pipe(process.stdout);
}

function checkFile(name)
{
  var filePath = path.join(modelsDir, name +'.js');
  assert.equal(fs.existsSync(filePath), true);
  assert.equal(fs.readFileSync(filePath, {encoding:'utf8'}), fs.readFileSync(path.join(__dirname, 'fixtures', 'models', name + '.js'), { encoding: 'utf8'}));

  filePath = path.join(testsDir, name +'.js');
  assert.equal(fs.existsSync(filePath), true);
  assert.equal(fs.readFileSync(filePath, {encoding:'utf8'}), fs.readFileSync(path.join(__dirname, 'fixtures', 'tests', name + '.js'), { encoding: 'utf8'}));

  name = utilities.string.getInflection(name, 'filename', 'plural');

  var migrationFiles = new jake.FileList();
  migrationFiles.include(path.join(migrationsDir, '*_create_' + name +'.js'));
  migrationFiles = migrationFiles.toArray();

  assert.ok(migrationFiles.length > 0);
  filePath = migrationFiles[migrationFiles.length - 1];
  assert.equal(fs.existsSync(filePath), true);
  assert.equal(fs.readFileSync(filePath, {encoding:'utf8'}), fs.readFileSync(path.join(__dirname, 'fixtures', 'migrations', 'create_' + name + '.js'), { encoding: 'utf8'}));

  filePath = path.join(controllersDir, name + '.js');
  assert.equal(fs.existsSync(filePath), true);
  assert.equal(fs.readFileSync(filePath, {encoding:'utf8'}), fs.readFileSync(path.join(__dirname, 'fixtures', 'controllers', name + '.js'), { encoding: 'utf8'}));
}

tests = {
  'beforeEach': function() {
    // go to app root
    process.chdir(path.join(__dirname, 'tmp', 'geddy-test-app'));
  },
  'Call outside of test app\'s root': function(next) {
    process.chdir('./app');
    createResource('foo', function(err, stdout, stderr) {
      assert.equal(stderr.split('\n')[1], 'Error: You must run this generator from the root of your application.');
      next();
    });
  },
  'Create a user resource': function(next) {
    createResource('user', ['username:string', 'email:string', 'password:string', 'firstName:string', 'lastName:string', 'token:string', 'active:boolean'], function(err, stdout, stderr) {
      if (err) {
        console.log(err);
        fail();
        return;
      }

      checkFile('user');
      next();
    });
  },
  'Create a zooby resource': function(next) {
    createResource('zooby', [], function(err, stdout, stderr) {
      if (err) {
        console.log(err);
        fail();
        return;
      }

      checkFile('zooby');
      next();
    });
  },
  'Re-create the same zooby resource': function(next) {
    createResource('zooby', [], function(err, stdout, stderr) {
      assert.equal(stderr.split('\n')[1], 'Error: Model already exists. Use -f to replace it.');
      next();
    });
  },
  'Overwrite the zooby resource': function(next) {
    createResource('zooby',['-f'], function(err, stdout, stderr) {
      assert.equal(stderr, '');
      checkFile('zooby');

      createResource('zooby',['--force'], function(err, stdout, stderr) {
        assert.equal(stderr, '');
        checkFile('zooby');
        next();
      });
    });
  }
};

module.exports = tests;