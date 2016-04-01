var async, ensureArray;

async = require('async');

module.exports = function(grunt) {
  return grunt.registerMultiTask('ghostinspector', 'Execute your Ghost Inspector tests', function() {
    var GhostInspector, executeTest, failures, finishRun, gruntDone, gruntError, options, suites, tests;
    gruntDone = this.async();
    options = this.options();
    suites = ensureArray(this.data.suites);
    tests = ensureArray(this.data.tests);
    failures = {
      tests: [],
      screenshots: []
    };
    GhostInspector = require('ghost-inspector')(options.apiKey);
    executeTest = function(testId, done) {
      return GhostInspector.executeTest(testId, options, function(err, data, passing) {
        var errorText;
        if (err) {
          return done('Error executing test "' + data.test.name + '" (' + testId + '): ' + err);
        }
        if (passing) {
          grunt.log.ok('Test "' + data.test.name + '" (' + testId + ') passed');
          if (data.screenshotComparePassing === false) {
            errorText = '- Screenshot comparison failed';
            grunt.log.error(errorText);
            failures.screenshots.push(['screenshot', errorText]);
          }
        } else {
          errorText = 'Test "' + data.test.name + '" (' + testId + ') failed';
          grunt.log.error(errorText);
          failures.tests.push(['test', errorText]);
        }
        return done();
      });
    };
    gruntError = function(err) {
      grunt.log.error(err);
      return finishRun(false);
    };
    finishRun = function(status) {
      if (options.abortOnTestFailure && failures.tests.length > 0) {
        grunt.fail.warn(failures.tests.length + ' had errors');
      }
      if (options.abortOnScreenshotFailure && failures.screenshots.length > 0) {
        grunt.fail.warn(failures.screenshots.length + ' had errors');
      }
      return gruntDone(status);
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
        return finishRun();
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
