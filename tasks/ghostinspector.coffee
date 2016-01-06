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

    # execute any specified suites
    if suites.length then grunt.log.writeln('Executing suites...')
    async.eachSeries suites, (suiteId, done) ->
      # execute suite
      GhostInspector.executeSuite suiteId, options, (err, data, passing) ->
        # evaluate api response
        if err then return done('Error executing suite "' + suiteId + '": ' + err)
        if passing
          grunt.log.ok('Suite "' + suiteId + '" passed.')
          if !data.screenshotComparePassing
            grunt.log.error('- Screenshot comparison failed')
          done()
        else
          done('Suite "' + suiteId + '" failed.')
    , (err) ->

      # done with suites, bail if we hit an error/failure
      if err
        grunt.log.error(err)
        return gruntDone(false)

      # execute any specified tests
      if tests.length then grunt.log.writeln('Executing tests...')
      async.eachSeries tests, (testId, done) ->
        # execute test
        GhostInspector.executeTest testId, options, (err, data, passing) ->
          # evaluate api response
          if err then return done('Error executing test "' + data.test.name + '" (' + testId + '): ' + err)
          if passing
            grunt.log.ok('Test "' + data.test.name + '" (' + testId + ') passed.')
            if !data.screenshotComparePassing
              grunt.log.error('- Screenshot comparison failed')
            done()
          else
            done('Test "' + data.test.name + '" (' + testId + ') failed')
      , (err) ->

        # done with tests, bail if we hit an error/failure
        if err
          grunt.log.error(err)
          return gruntDone(false)

        # done with suites and tests
        gruntDone()

ensureArray = (items) ->
  if typeof items is 'string'
    return [items]
  else if items not instanceof Array
    return []

  items
