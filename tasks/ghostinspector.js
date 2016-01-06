var async, ensureArray;

async = require('async');

module.exports = function(grunt) {
  return grunt.registerMultiTask('ghostinspector', 'Execute your Ghost Inspector tests', function() {
    var GhostInspector, gruntDone, options, suites, tests;
    gruntDone = this.async();
    options = this.options();
    suites = ensureArray(this.data.suites);
    tests = ensureArray(this.data.tests);
    GhostInspector = require('ghost-inspector')(options.apiKey);
    if (suites.length) {
      grunt.log.writeln('Executing suites...');
    }
    return async.eachSeries(suites, function(suiteId, done) {
      return GhostInspector.executeSuite(suiteId, options, function(err, data, passing) {
        if (err) {
          return done('Error executing suite "' + suiteId + '": ' + err);
        }
        if (passing) {
          grunt.log.ok('Suite "' + suiteId + '" passed.');
          if (!data.screenshotComparePassing) {
            grunt.log.error('- Screenshot comparison failed');
          }
          return done();
        } else {
          return done('Suite "' + suiteId + '" failed.');
        }
      });
    }, function(err) {
      if (err) {
        grunt.log.error(err);
        return gruntDone(false);
      }
      if (tests.length) {
        grunt.log.writeln('Executing tests...');
      }
      return async.eachSeries(tests, function(testId, done) {
        return GhostInspector.executeTest(testId, options, function(err, data, passing) {
          if (err) {
            return done('Error executing test "' + data.test.name + '" (' + testId + '): ' + err);
          }
          if (passing) {
            grunt.log.ok('Test "' + data.test.name + '" (' + testId + ') passed.');
            if (!data.screenshotComparePassing) {
              grunt.log.error('- Screenshot comparison failed');
            }
            return done();
          } else {
            return done('Test "' + data.test.name + '" (' + testId + ') failed');
          }
        });
      }, function(err) {
        if (err) {
          grunt.log.error(err);
          return gruntDone(false);
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
