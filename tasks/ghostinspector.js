var async, ensureArray;

async = require('async');

module.exports = function(grunt) {
  return grunt.registerMultiTask('ghostinspector', 'Execute your Ghost Inspector tests', function() {
    var GhostInspector, executeTest, gruntDone, gruntError, options, suites, tests;
    gruntDone = this.async();
    options = this.options();
    suites = ensureArray(this.data.suites);
    tests = ensureArray(this.data.tests);
    GhostInspector = require('ghost-inspector')(options.apiKey);
    executeTest = function(testId, done) {
      return GhostInspector.executeTest(testId, options, function(err, data, passing) {
        if (err) {
          return done('Error executing test "' + data.test.name + '" (' + testId + '): ' + err);
        }
        if (passing) {
          grunt.log.ok('Test "' + data.test.name + '" (' + testId + ') passed');
          if (!data.screenshotComparePassing) {
            grunt.log.error('- Screenshot comparison failed');
          }
        } else {
          grunt.log.error('Test "' + data.test.name + '" (' + testId + ') failed');
        }
        return done();
      });
    };
    gruntError = function(err) {
      grunt.log.error(err);
      return gruntDone(false);
    };
    if (suites.length) {
      grunt.log.writeln('Executing suites...');
    }
    return async.eachSeries(suites, function(suiteId, done) {
      grunt.log.writeln('Suite (' + suiteId + ')');
      return GhostInspector.getSuiteTests(suiteId, function(err, tests) {
        if (err) {
          return gruntError(err);
        }
        return async.each(tests, function(test, done) {
          return executeTest(test._id, done);
        }, function(err) {
          if (err) {
            return gruntError(err);
          }
          return done();
        });
      });
    }, function(err) {
      if (err) {
        return gruntError(err);
      }
      if (tests.length) {
        grunt.log.writeln('Executing tests...');
      }
      return async.eachSeries(tests, function(testId, done) {
        return executeTest(testId, done);
      }, function(err) {
        if (err) {
          return gruntError(err);
        }
        return gruntDone();
      });
    });
  });
};

ensureArray = function(items) {
  if (typeof items === 'string') {
    return [items];
  } else if (!(items instanceof Array)) {
    return [];
  }
  return items;
};
