/**
* Copyright 2012 Microsoft Corporation
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

/*

  WARNING: whenever you make any of the following changes:
  - product changes affecting wire protocols
  - adding tests
  - removing tests
  - reordering tests 
  you must regenerate the cli.mobile-tests.nock.js file that contains
  the mocked HTTP requests and responses corresponding to the tests in this 
  file. The instructions are below.

  INSTRUCTIONS FOR RE-GENERATING THE cli.mobile-tests.nock.js FILE:

  1. Make sure the tests are passing against live Windows Azure endpoints:
  1.0. Remeber to register your Windows Azure credentials with `azure account import`
  1.1. Set the NOCK_OFF environment variable to `true`
  1.2. Run tests with `npm test`

  2. Re-run the tests against the live Windows Azure endpints while capturing the 
     HTTP traffic:
  2.1. Make sure NOCK_OFF is still set to `true`
  2.2. Set AZURE_MOBILE_NOCK_REC to `true`
  2.3. Run the tests with `npm test`. The new cli.mobile-tests.nock.js will be generated.
  2.4. Manually update the `nockedSubscriptionId` and `nockedServiceName` variables right below
     to the values of subscription Id and service name that had been used during the test pass in #2.3.
     The service name should be displayed in the name of every test that executed.

  3. Validate the new mocks:
  3.1. Unset both NOCK_OFF and AZURE_MOBILE_NOCK_REC environment variables
  3.2. Run the tests with `npm test`. 

*/

var nockedSubscriptionId = 'db1ab6f0-4769-4b27-930e-01e2ef9c123c';
var nockedServiceName = 'clitest98e1b80f-545e-46fc-b62f-a866dc66ffad';

var nockhelper = require('../framework/nock-helper.js');
var https = require('https');
var nocked = process.env.NOCK_OFF ? null : require('../recordings/cli.mobile-tests.nock.js');
var should = require('should');
var url = require('url');
var uuid = require('node-uuid');
var util = require('util');
var executeCmd = require('../framework/cli-executor').execute;
var fs = require('fs');

var scopeWritten;

// polyfill appendFileSync
if (!fs.appendFileSync) {
  fs.appendFileSync = function (file, content) {
    var current = fs.readFileSync(file, 'utf8');
    current += content;
    fs.writeFileSync(file, current);
  }
}

var currentTest = 0;
function setupNock(cmd) {
  if (process.env.NOCK_OFF) {
    return [];
  }
  else if (currentTest < nocked.scopes.length) {
    cmd.push('-s');
    cmd.push(nockedSubscriptionId);

    return nocked.scopes[currentTest++].map(function (createScopeFunc) {
      return createScopeFunc(nockhelper.nock);
    });
  }
  else {
    throw new Error('It appears the cli.mobile-tests.js file has more tests than there are mocked tests in cli.mobile-tests.nock.js. '
      + 'You may need to re-generate the cli.mobile-tests.nock.js using instructions in cli.mobile-test.js.');
  }
}

function checkScopes(scopes) {
  scopes.forEach(function (scope) {
    scope.isDone().should.be.ok;
  });
}

suite('azure mobile', function(){

  // The hardcoded service name may need to be updated every time before a new NOCK recording is made
  var servicename = process.env.NOCK_OFF ? 'clitest' + uuid() : nockedServiceName;

  function cleanupService(callback) {
    // make best effort to remove the service in case of a test failure
    if (process.env.NOCK_OFF) {
      var cmd = ('node cli.js mobile delete ' + servicename + ' -a -q --json').split(' ');
      executeCmd(cmd, function (result) {
        callback();
      });
    } else {
      callback();
    }
  }

  // once before suite runs
  before(function (done) {
    if (process.env.AZURE_MOBILE_NOCK_REC) {
      fs.writeFileSync(__dirname + '/../recordings/cli.mobile-tests.nock.js', 
        '// This file has been autogenerated.\n' +
        '// Check out cli.mobile-tests.js for re-generation instructions.\n\n' +
        'exports.scopes = [');
    }

    cleanupService(done);
  });

  // once after suite runs
  after(function (done) {
    if (process.env.AZURE_MOBILE_NOCK_REC) {
      fs.appendFileSync(__dirname + '/../recordings/cli.mobile-tests.nock.js', '];');
    }

    cleanupService(done);
  });

  // before every test
  setup(function (done) {
    nockhelper.nockHttp();

    if (process.env.AZURE_MOBILE_NOCK_REC) {
      // start nock recoding
      nockhelper.nock.recorder.rec(true);
    }

    done();
  });

  // after every test
  teardown(function (done) {
    if (process.env.AZURE_MOBILE_NOCK_REC) {
      // play nock recording
      var scope = scopeWritten ? ',\n[' : '[';
      scopeWritten = true;
      var lineWritten;
      nockhelper.nock.recorder.play().forEach(function (line) {
        if (line.indexOf('nock') >= 0) {
          // skip async tracking operations that are other than success to speed things up
          if (line.match(/\/operations\//) && !line.match(/\<Status\>Succeeded\<\/Status\>/)) {
            return;
          }
          
          // apply fixups of nock generated mocks

          // do not filter on body of app create request, since it contains random GUIDs that would mismatch
          line = line.replace(/(\.post\('\/[^\/]*\/applications')[^\)]+\)/, '.filteringRequestBody(function (path) { return \'*\';})\n$1, \'*\')');
          // do not filter on body of job create request, since it contains random startTime that would mismatch
          line = line.replace(/(\.post\('\/[^\/]*\/services\/mobileservices\/mobileservices\/[^\/]*\/scheduler\/jobs')[^\)]+\)/, '.filteringRequestBody(function (path) { return \'*\';})\n$1, \'*\')');
          // do not filter on body of job update request, since it contains random startTime that would mismatch
          line = line.replace(/(\.put\('\/[^\/]*\/services\/mobileservices\/mobileservices\/[^\/]*\/scheduler\/jobs')[^\)]+\)/, '.filteringRequestBody(function (path) { return \'*\';})\n$1, \'*\')');
          // do not filter on the body of script upload, since line endings differ between Windows and Mac
          line = line.replace(/(\.put\('[^\']*')\, \"[^\"]+\"\)/, '.filteringRequestBody(function (path) { return \'*\';})\n$1, \'*\')');
          // nock encoding bug
          line = line.replace("'error'", "\\'error\\'");
          // nock is loosing the port number
          line = line.replace("nock('https://management.database.windows.net')", "nock('https://management.database.windows.net:8443')");

          scope += (lineWritten ? ',\n' : '') + 'function (nock) { var result = ' + line + ' return result; }';
          lineWritten = true;
        }
      });
      scope += ']';
      fs.appendFileSync(__dirname + '/../recordings/cli.mobile-tests.nock.js', scope);
      nockhelper.nock.recorder.clear();
    }

    nockhelper.unNockHttp();
    done();
  });

  test('create ' + servicename + ' tjanczuk FooBar#12 --json (create new service)', function(done) {
    var cmd = ('node cli.js mobile create ' + servicename + ' tjanczuk FooBar#12 --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.should.have.property('Name', servicename + 'mobileservice');
      response.should.have.property('Label', servicename);
      response.should.have.property('State', 'Healthy');
      checkScopes(scopes);
      done();
    });
  });

  test('list --json (contains healthy service)', function(done) {
    var cmd = ('node cli.js mobile list --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.some(function (service) { 
        return service.name === servicename && service.state === 'Ready'; 
      }).should.be.ok;
      checkScopes(scopes);
      done();
    });
  });

  test('show ' + servicename + ' --json (contains healthy service)', function(done) {
    var cmd = ('node cli.js mobile show ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.service.name.should.equal(servicename);
      response.service.state.should.equal('Ready');
      response.application.Name.should.equal(servicename + 'mobileservice');
      response.application.Label.should.equal(servicename);
      response.application.State.should.equal('Healthy');
      response.webspace.computeMode.should.equal('Shared');
      response.webspace.numberOfInstances.should.equal(1);
      response.webspace.workerSize.should.equal('Small');
      checkScopes(scopes);
      done();
    });
  });

  test('job list --json (contains no scheduled jobs by default)', function(done) {
    var cmd = ('node cli.js mobile job list ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.length.should.equal(0);
      checkScopes(scopes);
      done();
    });
  });    

  test('job create ' + servicename + ' foobar --json (create default scheduled job)', function(done) {
    var cmd = ('node cli.js mobile job create ' + servicename + ' foobar --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      result.text.should.equal('');
      checkScopes(scopes);
      done();
    });
  });    

  test('job list --json (contains one scheduled job)', function(done) {
    var cmd = ('node cli.js mobile job list ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.length.should.equal(1);
      response[0].name.should.equal('foobar');
      response[0].status.should.equal('disabled');
      response[0].intervalUnit.should.equal('minute');
      response[0].intervalPeriod.should.equal(15);
      checkScopes(scopes);
      done();
    });
  });    

  test('job update ' + servicename + ' foobar -u hour -i 2 -a enabled --json (update scheduled job)', function(done) {
    var cmd = ('node cli.js mobile job update ' + servicename + ' foobar -u hour -i 2 -a enabled --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      result.text.should.equal('');
      checkScopes(scopes);
      done();
    });
  });   

  test('job list --json (contains updated scheduled job)', function(done) {
    var cmd = ('node cli.js mobile job list ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.length.should.equal(1);
      response[0].name.should.equal('foobar');
      response[0].status.should.equal('enabled');
      response[0].intervalUnit.should.equal('hour');
      response[0].intervalPeriod.should.equal(2);
      checkScopes(scopes);
      done();
    });
  });    

  test('job delete ' + servicename + ' foobar --json (delete scheduled job)', function(done) {
    var cmd = ('node cli.js mobile job delete ' + servicename + ' foobar --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      result.text.should.equal('');
      checkScopes(scopes);
      done();
    });
  });   

  test('job list --json (contains no scheduled jobs after deletion)', function(done) {
    var cmd = ('node cli.js mobile job list ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.length.should.equal(0);
      checkScopes(scopes);
      done();
    });
  });    

  test('config list ' + servicename + ' --json (default config)', function(done) {
    var cmd = ('node cli.js mobile config list ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      if (response.service && response.service.applicationSystemKey) {
        response.service.applicationSystemKey = '';
      }

      response.should.include({
        "apns": {
          "mode": "none"
        },
        "live": {},
        "service": {
          "dynamicSchemaEnabled": true,
          "applicationSystemKey": ""
        },
        "auth": []
      });
      checkScopes(scopes);
      done();
    });
  });

  test('config set ' + servicename + ' facebookClientId 123 --json', function(done) {
    var cmd = ('node cli.js mobile config set ' + servicename + ' facebookClientId 123 --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      result.text.should.equal('');
      checkScopes(scopes);
      done();
    });
  });

  test('config get ' + servicename + ' facebookClientId --json (value was set)', function(done) {
    var cmd = ('node cli.js mobile config get ' + servicename + ' facebookClientId --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.facebookClientId.should.equal('123');
      checkScopes(scopes);
      done();
    });
  });

  test('config get ' + servicename + ' apns --json (by default apns certificate is not set)', function(done) {
    var cmd = ('node cli.js mobile config get ' + servicename + ' apns --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.apns.should.equal('none');
      checkScopes(scopes);
      done();
    });
  });

  test('config set ' + servicename + ' apns dev:foobar:' + __dirname + '/mobile/cert.pfx --json (set apns certificate)', function(done) {
    var cmd = ('node cli.js mobile config set ' + servicename + ' apns').split(' ');
    cmd.push('dev:foobar:' + __dirname + '/mobile/cert.pfx');
    cmd.push('--json');

    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.errorText.should.equal('');
      result.exitStatus.should.equal(0);
      result.text.should.equal('');
      checkScopes(scopes);
      done();
    });
  });

  test('config get ' + servicename + ' apns --json (apns certificate was set)', function(done) {
    var cmd = ('node cli.js mobile config get ' + servicename + ' apns --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.errorText.should.equal('');
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.apns.should.equal('dev');
      checkScopes(scopes);
      done();
    });
  });

  test('table list ' + servicename + ' --json (no tables by default)', function(done) {
    var cmd = ('node cli.js mobile table list ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      Array.isArray(response).should.be.ok;
      response.length.should.equal(0);
      checkScopes(scopes);
      done();
    });
  });

  test('table create ' + servicename + ' table1 --json (add first table)', function(done) {
    var cmd = ('node cli.js mobile table create ' + servicename + ' table1 --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      result.text.should.equal('');
      checkScopes(scopes);
      done();
    });
  });

  test('table list ' + servicename + ' --json (contains one table)', function(done) {
    var cmd = ('node cli.js mobile table list ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      Array.isArray(response).should.be.ok;
      response.length.should.equal(1);
      response[0].name.should.equal('table1');
      checkScopes(scopes);
      done();
    });
  });

  test('table show ' + servicename + ' table1 --json (default table config)', function(done) {
    var cmd = ('node cli.js mobile table show ' + servicename + ' table1 --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      ['insert', 'read', 'update', 'delete'].forEach(function (permission) {
        response.permissions[permission].should.equal('application');
      });
      response.table.name.should.equal('table1');
      Array.isArray(response.columns).should.be.ok;
      response.columns.length.should.equal(1);
      response.columns[0].name.should.equal('id');
      checkScopes(scopes);
      done();
    });
  });

  test('table update ' + servicename + ' table1 -p *=admin,insert=public --json (update permissions)', function(done) {
    var cmd = ('node cli.js mobile table update ' + servicename + ' table1 -p *=admin,insert=public --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      result.text.should.equal('');
      checkScopes(scopes);
      done();
    });
  });

  test('table show ' + servicename + ' table1 --json (updated permissions)', function(done) {
    var cmd = ('node cli.js mobile table show ' + servicename + ' table1 --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      ['read', 'update', 'delete'].forEach(function (permission) {
        response.permissions[permission].should.equal('admin');
      });
      response.permissions.insert.should.equal('public');
      response.table.name.should.equal('table1');
      Array.isArray(response.columns).should.be.ok;
      response.columns.length.should.equal(1);
      response.columns[0].name.should.equal('id');
      checkScopes(scopes);
      done();
    });
  });

  function insert5Rows(callback) {
    var success = 0;
    var failure = 0;

    function tryFinish() {
      if ((success + failure) < 5) {
        return;
      }

      callback(success, failure);
    }

    for (var i = 0; i < 5; i++) {
      var options = {
        host: servicename + '.azure-mobile.net',
        port: 443,
        path: '/tables/table1',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      var req = https.request(options, function (res) {
        res.on('end', function () {
          res.statusCode >= 400 ? failure++ : success++;
          tryFinish();  
        });
      });

      req.on('error', function () {
        failure++;
        tryFinish();
      });

      req.end(JSON.stringify({ rowNumber: i, foo: 'foo', bar: 7, baz: true }));
    }
  };

  test('(add 5 rows of data to table with public insert permission)', function(done) {
    var scopes = setupNock([]);
    insert5Rows(function (success, failure) {
      failure.should.equal(0);
      checkScopes(scopes);
      done();
    });
  });    

  test('table show ' + servicename + ' table1 --json (new rows and columns)', function(done) {
    var cmd = ('node cli.js mobile table show ' + servicename + ' table1 --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.table.metrics.recordCount.should.equal(5);
      Array.isArray(response.columns).should.be.ok;
      response.columns.length.should.equal(5);
      [ { name: 'id', indexed: true },
        { name: 'rowNumber', indexed: false },
        { name: 'foo', indexed: false },
        { name: 'bar', indexed: false },
        { name: 'baz', indexed: false } ].forEach(function (column, columnIndex) {
          response.columns[columnIndex].name.should.equal(column.name);
          response.columns[columnIndex].indexed.should.equal(column.indexed);
        });
      checkScopes(scopes);
      done();
    });
  });

  test('data read ' + servicename + ' table1 --json (show 5 rows of data)', function(done) {
    var cmd = ('node cli.js mobile data read ' + servicename + ' table1 --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      Array.isArray(response).should.be.ok;
      response.length.should.equal(5);
      checkScopes(scopes);
      done();
    });
  });

  test('data read ' + servicename + ' table1 --top 1 --json (show top 1 row of data)', function(done) {
    var cmd = ('node cli.js mobile data read ' + servicename + ' table1 --top 1 --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      Array.isArray(response).should.be.ok;
      response.length.should.equal(1);
      checkScopes(scopes);
      done();
    });
  });

  test('table update ' + servicename + ' table1 --deleteColumn foo --addIndex bar,baz -q --json (delete column, add indexes)', function(done) {
    var cmd = ('node cli.js mobile table update ' + servicename + ' table1  --deleteColumn foo --addIndex bar,baz -q --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      result.text.should.equal('');
      checkScopes(scopes);
      done();
    });
  });

  test('table show ' + servicename + ' table1 --json (fewer columns, more indexes)', function(done) {
    var cmd = ('node cli.js mobile table show ' + servicename + ' table1 --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      Array.isArray(response.columns).should.be.ok;
      response.columns.length.should.equal(4);
      [ { name: 'id', indexed: true },
        { name: 'rowNumber', indexed: false },
        { name: 'bar', indexed: true },
        { name: 'baz', indexed: true } ].forEach(function (column, columnIndex) {
          response.columns[columnIndex].name.should.equal(column.name);
          response.columns[columnIndex].indexed.should.equal(column.indexed);
        });
      checkScopes(scopes);
      done();
    });
  });

  test('data truncate ' + servicename + ' table1 -q --json (delete all data from table)', function(done) {
    var cmd = ('node cli.js mobile data truncate ' + servicename + ' table1 -q --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.didTruncate.should.equal(true);
      response.rowCount.should.equal(5);
      checkScopes(scopes);
      done();
    });
  });    

  test('script list ' + servicename + ' --json (no scripts by default)', function(done) {
    var cmd = ('node cli.js mobile script list ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.should.include({
        "table": []
      });
      checkScopes(scopes);
      done();
    });
  });

  test('script upload ' + servicename + ' table/table1.insert -f ' + __dirname + '/mobile/table1.insert.js --json (upload one script)', function(done) {
    var cmd = ('node cli.js mobile script upload ' + servicename + ' table/table1.insert -f').split(' ');
    cmd.push(__dirname + '/mobile/table1.insert.js');
    cmd.push('--json');

    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.errorText.should.equal('');
      result.exitStatus.should.equal(0);
      result.text.should.equal('');
      checkScopes(scopes);
      done();
    });
  });

  test('script list ' + servicename + ' --json (insert script uploaded)', function(done) {
    var cmd = ('node cli.js mobile script list ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      Array.isArray(response.table).should.be.ok;
      response.table.length.should.equal(1);
      response.table[0].table.should.equal('table1');
      response.table[0].operation.should.equal('insert');
      checkScopes(scopes);
      done();
    });
  });

  test('log ' + servicename + ' --json (no logs by default)', function(done) {
    var cmd = ('node cli.js mobile log ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.should.include({
        "results": []
      });
      checkScopes(scopes);
      done();
    });
  });

  test('(add 5 more rows of data to invoke scripts)', function(done) {
    var scopes = setupNock([]);
    insert5Rows(function (success, failure) {
      failure.should.equal(0);
      checkScopes(scopes);
      done();
    });
  });      

  test('log ' + servicename + ' --json (10 log entries added)', function(done) {
    var cmd = ('node cli.js mobile log ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      Array.isArray(response.results).should.be.ok;
      response.results.length.should.equal(10);
      checkScopes(scopes);
      done();
    });
  });

  test('log ' + servicename + ' --type error --json (5 error log entries added)', function(done) {
    var cmd = ('node cli.js mobile log ' + servicename + ' --type error --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      Array.isArray(response.results).should.be.ok;
      response.results.length.should.equal(5);
      checkScopes(scopes);
      done();
    });
  });

  test('log ' + servicename + ' --top 3 --json (list 3 top log entries)', function(done) {
    var cmd = ('node cli.js mobile log ' + servicename + ' --top 3 --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      Array.isArray(response.results).should.be.ok;
      response.results.length.should.equal(3);
      checkScopes(scopes);
      done();
    });
  });

  test('table delete ' + servicename + ' table1 -q --json (delete existing table)', function(done) {
    var cmd = ('node cli.js mobile table delete ' + servicename + ' table1 -q --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.text.should.equal('');
      result.exitStatus.should.equal(0);
      checkScopes(scopes);
      done();
    });
  });

  test('table list ' + servicename + ' --json (no tables after table deletion)', function(done) {
    var cmd = ('node cli.js mobile table list ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      Array.isArray(response).should.be.ok;
      response.length.should.equal(0);
      checkScopes(scopes);
      done();
    });
  });

  test('table delete ' + servicename + ' table1 -q --json (delete nonexisting table)', function(done) {
    var cmd = ('node cli.js mobile table delete ' + servicename + ' table1 -q --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(1);
      result.errorText.should.include('The table \'table1\' was not found');
      checkScopes(scopes);
      done();
    });
  });

  test('scale show ' + servicename + ' --json (show default scale settings)', function(done) {
    var cmd = ('node cli.js mobile scale show ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.computeMode.should.equal('Shared');
      response.numberOfInstances.should.equal(1);
      response.workerSize.should.equal('Small');
      checkScopes(scopes);
      done();
    });
  });

  test('scale change ' + servicename + ' -c Reserved -i 2 --json (rescale to 2 reserved instances)', function(done) {
    var cmd = ('node cli.js mobile scale change ' + servicename + ' -c Reserved -i 2 --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      result.text.should.equal('');
      checkScopes(scopes);
      done();
    });
  });

  test('scale show ' + servicename + ' --json (show updated scale settings)', function(done) {
    var cmd = ('node cli.js mobile scale show ' + servicename + ' --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      var response = JSON.parse(result.text);
      response.computeMode.should.equal('Dedicated');
      response.numberOfInstances.should.equal(2);
      response.workerSize.should.equal('Small');
      checkScopes(scopes);
      done();
    });
  });

  test('scale change ' + servicename + ' -c Free -i 1 --json (rescale back to default)', function(done) {
    var cmd = ('node cli.js mobile scale change ' + servicename + ' -c Free -i 1 --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      result.text.should.equal('');
      checkScopes(scopes);
      done();
    });
  });

  test('delete ' + servicename + ' -a -q --json (delete existing service)', function(done) {
    var cmd = ('node cli.js mobile delete ' + servicename + ' -a -q --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.text.should.equal('');
      result.exitStatus.should.equal(0);
      checkScopes(scopes);
      done();
    });
  });

  test('list --json (no services exist)', function(done) {
    var cmd = ('node cli.js mobile list --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(0);
      if (result.text !== '') {
        var response = JSON.parse(result.text);
        response.some(function (service) { 
          return service.name === servicename; 
        }).should.not.be.ok;
      }
      checkScopes(scopes);
      done();
    });
  });

  test('delete ' + servicename + ' -a -q --json (delete nonexisting service)', function(done) {
    var cmd = ('node cli.js mobile delete ' + servicename + ' -a -q --json').split(' ');
    var scopes = setupNock(cmd);
    executeCmd(cmd, function (result) {
      result.exitStatus.should.equal(1);
      result.errorText.should.include('The application name was not found');
      checkScopes(scopes);
      done();
    });
  });
});