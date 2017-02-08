## Test Modes

Tests can be executed in three different modes as follows:
For Windows use **set** and for OSX, Linux use **export**
* **LIVE**
Tests will be run against the Live Service, no recording happens
To run the tests in **LIVE** mode, set the following environment variable:
```
set NOCK_OFF=true 
```

* **RECORD**
Tests will be run against the Live Service and the HTTP traffic will be recorded to a file at "azure-xplat-cli/tests/recordings/{test-suite}/{full-test-title}.nock.js"
To run the tests in **RECORD** mode, set the following environment variable:
```
set NOCK_OFF=
set AZURE_NOCK_RECORD=true
```

* **PLAYBACK**
Tests will run against the previously recorded HTTP traffic, vs a Live Service. The Travis CI runs tests in this mode.
To run tests in **PLAYBACK** mode, unset the following environment variables:
```
set NOCK_OFF=
set AZURE_NOCK_RECORD=
```
The recordings will get saved in azure-xplat-cli/test/recordings/{test-suite} directory

## Partial recordings

#### Recording tests related to a specific service/feature
If you plan on adding some tests / features and do not need to regenerate the full set of test recordings, you can open the file: 
```
test/testlist.txt (if you are writing tests for commands in asm mode)
test/testlist-arm.txt (if you are writing tests for commands in arm mode)
```
and comment out the tests you do not wish to run during the recording process.

To do so, use a leading \# character. i.e.:

\# commands/cli.cloudservice-tests.js <br />
\# commands/cli.deployment-tests.js <br />
commands/cli.site-tests.js <br />
\# commands/cli.site.appsetting-tests <br />

In the above example only the cli.site-tests.js tests would be run.

#### Recording a particular test in a suite

A test-file can have multiple suites and multiple tests within a suite.

* Executing a specific test from the entire suite: "it.only()"
```js
describe.('list', function () {
  it.only('should work', function (done) {
    suite.execute('location list --json', function (result) {
      result.exitStatus.should.equal(0);
      //verify the command indeed produces something valid such as a well known provider: sql provider
      var allResources = JSON.parse(result.text);
      allResources.some(function (res) {
        return res.name.match(/Microsoft.Sql\/servers/gi);
      }).should.be.true;
      done();
    });
  });

  it('should not work', function (done) {
    suite.execute('location list --json', function (result) {
      result.exitStatus.should.equal(1);
      //verify the command indeed produces something valid such as a well known provider: sql provider
      var allResources = JSON.parse(result.text);
      allResources.some(function (res) {
        return res.name.match(/Microsoft.Sql\/servers/gi);
      }).should.be.false;
      done();
    });
  });
});
```
* Skipping an entire suite, will not execute the entire suite. This can de achieved by using the "skip" keyword 
```js
describe.skip('list', function () {
  it('should work', function (done) {
    suite.execute('location list --json', function (result) {
      result.exitStatus.should.equal(0);
      //verify the command indeed produces something valid such as a well known provider: sql provider
      var allResources = JSON.parse(result.text);
      allResources.some(function (res) {
        return res.name.match(/Microsoft.Sql\/servers/gi);
      }).should.be.true;
      done();
    });
  });

  it('should not work', function (done) {
    suite.execute('location list --json', function (result) {
      result.exitStatus.should.equal(1);
      //verify the command indeed produces something valid such as a well known provider: sql provider
      var allResources = JSON.parse(result.text);
      allResources.some(function (res) {
        return res.name.match(/Microsoft.Sql\/servers/gi);
      }).should.be.false;
      done();
    });
  });
});
```
* Skipping a particular test in a suite. This can be achieved in two ways
  * it.skip() **OR**
  * passing null as the second argument to the test
```js
describe('list', function () {
  //The first test will not be run as it is marked skip
  it.skip('should work', null, function (done) {
    suite.execute('location list --json', function (result) {
      result.exitStatus.should.equal(0);
      //verify the command indeed produces something valid such as a well known provider: sql provider
      var allResources = JSON.parse(result.text);
      allResources.some(function (res) {
        return res.name.match(/Microsoft.Sql\/servers/gi);
      }).should.be.true;
      done();
    });
  });
  //The second test will not be run as null is provided as the second argument to the test function.
  it('should not work', null, function (done) {
    suite.execute('location list --json', function (result) {
      result.exitStatus.should.equal(1);
      //verify the command indeed produces something valid such as a well known provider: sql provider
      var allResources = JSON.parse(result.text);
      allResources.some(function (res) {
        return res.name.match(/Microsoft.Sql\/servers/gi);
      }).should.be.false;
      done();
    });
  });
  
  it('should always work', function (done) {
    suite.execute('location list --json', function (result) {
      result.exitStatus.should.equal(0);
      //verify the command indeed produces something valid such as a well known provider: sql provider
      var allResources = JSON.parse(result.text);
      allResources.some(function (res) {
        return res.name.match(/Microsoft.Sql\/servers/gi);
      }).should.be.false;
      done();
    });
  });
});
```
