async = require('async')

module.exports = (grunt) ->

  # register "ghostinspector" task
  grunt.registerMultiTask 'ghostinspector', 'Execute your Ghost Inspector tests', () ->

    # reference to Grunt done() function
    gruntDone = @async()

    # get options
    options = @options()

    # get suites to execute
    suites = ensureArray @data.suites

    # get tests to execute
    tests = ensureArray @data.tests

    # create Ghost Inspector object
    GhostInspector = require('ghost-inspector')(options.apiKey)

    executeTest = (testId, done) ->
      GhostInspector.executeTest testId, options, (err, data, passing) ->
        if err then return done('Error executing test "' + data.test.name + '" (' + testId + '): ' + err)
        if passing
          grunt.log.ok('Test "' + data.test.name + '" (' + testId + ') passed')
          if !data.screenshotComparePassing
            grunt.log.error('- Screenshot comparison failed')
        else
          grunt.log.error('Test "' + data.test.name + '" (' + testId + ') failed')
        done()

    gruntError = (err) ->
      grunt.log.error(err)
      return gruntDone(false)

    # execute any specified suites
    if suites.length then grunt.log.writeln('Executing suites...')
    async.eachSeries suites, (suiteId, done) ->
      grunt.log.writeln('Suite (' + suiteId + ')')
      GhostInspector.getSuiteTests suiteId, (err, tests) ->
        if err then return gruntError(err)

        async.each tests, (test, done) ->
          executeTest(test._id, done)
        , (err) ->
          # done with suites, bail if we hit an error
          if err then return gruntError(err)
          done()

    , (err) ->
      # done with suites, bail if we hit an error/failure
      if err then return gruntError(err)

      # execute any specified tests
      if tests.length then grunt.log.writeln('Executing tests...')
      async.eachSeries tests, (testId, done) ->
        executeTest(testId, done)
      , (err) ->

        # done with tests, bail if we hit an error/failure
        if err then return gruntError(err)

        # done with suites and tests
        gruntDone()

ensureArray = (items) ->
  if typeof items is 'string'
    return [items]
  else if items not instanceof Array
    return []

  items
