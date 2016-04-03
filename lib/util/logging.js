/**
* Copyright (c) Microsoft.  All rights reserved.
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

'use strict';

//
// Logging infrastructure for the xplat CLI
//

var log = require('winston');
var eyes = require('eyes');
var os = require('os');
var Table = require('easy-table');
var util = require('util');
var wrap = require('wordwrap');

require('./sillyTransport');

var tty = require('tty');
var winston = require('winston');
var config = require('winston/lib/winston/config');
var common = require('winston/lib/winston/common');

// use cli output settings by default
log.cli();

/*
    This patch overrides the winston 'Console.log' and 'common.log' methods
    See "patch:" comments for alterations.
*/
var isatty1 = tty.isatty(1);
var isatty2 = tty.isatty(2);

winston.transports.Console.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }
  var isStdErr = level === 'error' || level === 'debug';
  var isatty = isStdErr ? isatty2 : isatty1;
  
  var self = this, output = common.log({
        colorize: isatty ? this.colorize : false, /* patch: do not colorize file and pipe output */
        json: this.json,
        terse: this.terse, /* patch: terse flag added as an option */
        level: level,
        message: msg,
        meta: meta,
        stringify: this.stringify,
        timestamp: this.timestamp
      });
  
  if (isatty) {
    /* patch: use util only for tty output */
    if (isStdErr) {
      console.error(output);
    }
    else {
      console.log(output);
    }
    
    //
    // Emit the `logged` event immediately because the event loop
    // will not exit until `process.stdout` has drained anyway.
    //
    self.emit('logged');
  } else {
    /* patch: remove all colorization for file or pipe output */
    var out = output.replace(/\x1b\[[0-9]+m/g, '') + '\n';
    
    if (isStdErr) {
      process.stderr.write(out);
    } else {
      var writeResult = process.stdout.write(out);
      log.shouldWaitForStdoutDrained = !writeResult;
    }
  }
  callback(null, true);
};

common.log = function (options) {
  var timestampFn = typeof options.timestamp === 'function' ? options.timestamp : common.timestamp,
      timestamp = options.timestamp ? timestampFn() : null,
      meta = options.meta, /* patch: don't do common.clone */
      output;
  
  /* patch: only format data as json */
  if (options.json && options.level === 'data') {
    output = meta || {};
    /* patch: don't include level and message into the json output */
    /*
    output.level   = options.level;
    output.message = options.message;
    */

    if (timestamp) {
      output.timestamp = timestamp;
    }
    
    /* patch: JSON.stringify to output indented json */
    return typeof options.stringify === 'function' ? options.stringify(output) : JSON.stringify(output, null, 2);
  }
  
  output = timestamp ? timestamp + ' - ' : '';
  
  /* patch: terse flag will not add 'level: ' to output lines */
  if (options.terse) {
    output += options.message;
  } else {
    output += options.colorize ? config.colorize(options.level) : options.level;
    output += (': ' + options.message);
  }
  
  if (meta) {
    if (typeof meta !== 'object') {
      output += ' ' + meta;
    } else if (Object.keys(meta).length > 0) {
      output += ' ' + common.serialize(meta);
    }
  }
  
  return output;
};


log.add(log.transports.Silly, {
  silent: process.env.AZURE_CLI_DISABLE_LOG_CAPTURE
});

log.format = function (options) {
  for (var i in log['default'].transports) {
    if (log['default'].transports.hasOwnProperty(i) && i !== 'silly') {
      var transport = log['default'].transports[i];
      if (arguments.length === 0) {
        return {
          json: transport.json,
          terse: transport.terse,
          level: transport.level,
          logo: log.format.logo
        };
      }

      if (options.json) {
        log.padLevels = false;
        log.stripColors = true;
        transport.json = true;
        transport.terse = true;
      } else {
        log.padLevels = true;
        log.stripColors = false;
        transport.json = false;
        transport.terse = false;
      }

      if (options.terse) {
        log.padLevels = false;
        transport.terse = true;
      }

      if (options.level) {
        transport.level = options.level;
      }

      if (options.logo) {
        log.format.logo = options.logo;
      }
    }
  }
};

log.json = function (level, data) {
  if (arguments.length == 1) {
    data = level;
    level = 'data';
  }

  if (log.format().json) {
    log.log(level, typeof data, data);
  } else {
    var lines = eyes.inspect(data, level, { stream: false });
    lines.split('\n').forEach(function (line) {
      // eyes all is "cyan" by default, so this property accessor will
      // fix the entry/exit color codes of the line. it's needed because we're
      // splitting the eyes formatting and inserting winston formatting where it
      // wasn't before.
      log.log(level, line[eyes.defaults.styles.all]);
    });
  }
};

log.table = function (level, data, transform) {
  if (arguments.length == 2) {
    transform = data;
    data = level;
    level = 'data';
  }

  if (log.format().json) {
    log.log(level, 'table', data);
  } else {
    var table = new Table();
    table.LeftPadder = Table.LeftPadder;
    table.padLeft = Table.padLeft;
    table.RightPadder = Table.RightPadder;
    table.padRight = Table.padRight;

    if (data && data.forEach) {
      data.forEach(function (item) { transform(table, item); table.newLine(); });
    } else if (data) {
      for (var item in data) {
        transform(table, item);
        table.newLine();
      }
    }

    var lines = table.toString();
    lines.substring(0, lines.length - 1).split('\n').forEach(function (line) {
      log.log(level, line);
    });
  }
};

log.nameValue = function (name, value, indent, displayNullValue) {
  var delimiter = ': ';
  if (!displayNullValue) displayNullValue = false;
  if (!indent) indent = 0;
  var key = spaces(indent) + name;
  key += spaces(32 - key.length);

  if (value !== undefined && value !== null) {
    log.data(key + delimiter + value);
  } else if (displayNullValue) {
    log.data(key + delimiter + '""');
  }
};

log.header = function (header, indent, newLine) {
  var delimiter = ':';
  if (newLine) {
    log.data('');
  }
  log.data(spaces(indent) + header + delimiter);
};

log.list = function (items, indent, newLine) {
  items.forEach(function (item) {
    log.listItem(item, indent, newLine);
  });
};

log.listItem = function (item, indent, newLine) {
  if (newLine) {
    log.data('');
  }
  log.data(spaces(indent) + item);
};

/**
 * This overrides original winston warn function to work properly within --json option
 */
var originalWarn = log.warn;
log.warn = function() {
  if (!log.format().json) {
    originalWarn.apply(this, arguments);
  }
};

function getProperty(value, propertyName) {
  if (typeof value === 'undefined' || value === null) {
    return '';
  }

  if (!propertyName) {
    return value;
  }

  var first = propertyName.split('.')[0];
  var rest = propertyName.slice(first.length + 1);
  return getProperty(value[first], rest);
}

function spaces(num) {
  if (num > 0) {
    return new Array(num + 1).join(' ');
  }
  return '';
}

function toWidth(string, width) {
  var pad = width - string.length;
  return string + spaces(pad);
}

function defaultFormat(data) {
  if (typeof data === 'undefined' || data === null) {
    return '';
  }
  if (data instanceof Array) {
    if (data.length === 0) {
      return '[]';
    }
    return data.join(', ');
  }

  return data.toString();
}

function doReport(indentation, reportFormat, data, outfn) {
  if (reportFormat.length === 0) {
    return;
  }

  var maxWidth = 80;
  if (process.stdout.isTTY) {
    maxWidth = process.stdout.columns;
  }

  var headerWidth = Math.max.apply(null,
    reportFormat.map(function (item) { return item[0].length; })
    ) + 2;

  reportFormat.forEach(function (item) {
    var title = item[0] + ':';
    var field = item[1];
    var formatter = item[2] || defaultFormat;

    var value = getProperty(data, field);
    if (formatter instanceof Array) {
      outfn(spaces(indentation) + toWidth(title, headerWidth));
      doReport(indentation + headerWidth, formatter, value, outfn);
    } else {
      var leftIndentation = 'verbose: '.length + indentation + headerWidth;
      var formatted = wrap.hard(leftIndentation, maxWidth)(formatter(value));
      formatted = spaces(indentation) + toWidth(title, headerWidth) +
        formatted.slice(leftIndentation);
      outfn(formatted);
    }
  });
}

log.report = function (reportFormat, data) {
  if (log.format().json) {
    log.log('data', 'table', data);
  } else {
    doReport(0, reportFormat, data, log.data.bind(log));
  }
};

log.report.allProperties = function (data) {
  if (typeof data === 'undefined' || data === null || data === '') {
    return '[]';
  }
  var subreport = Object.keys(data).map(function (key) {
    return [key, key];
  });
  var result = [];
  doReport(0, subreport, data, function (o) { result.push(o); });
  result.push('');
  return result.join(os.EOL);
};

log.report.asDate = function (data) {
  return new Date(Date.parse(data)).toString();
};

log.report.inspect = function (data) {
  return util.inspect(data, {depth: null});
};

log.createLogFilter = function () {
  return function handle(resource, next, callback) {
    log.silly('requestOptions');

    try {
      var loggedResource = JSON.parse(JSON.stringify(resource));
      if (loggedResource.headers && loggedResource.headers.Authorization) {
        delete loggedResource.headers.Authorization;
      }
      if (loggedResource.body && 
          (loggedResource.body.length > 2 * 1024 * 1024 || loggedResource.body.type === 'Buffer')) { // if the body is large, log only that the body was too large to log and was more than likely file content
        loggedResource.body = 'REQUEST BODY DATA OMMITTED FROM LOG DUE TO SIZE';
      }
      log.json('silly', loggedResource);
    } catch (error) {
      return callback (error)  ;
    }
    return next(resource, function (err, response, body) {
      log.silly('returnObject');
      if (response) {
        var bodyToLog = body;
        if(body && (body.length > 2 * 1024 * 1024 || body.type === 'Buffer')) { // if the body is large, log only that the body was too large to log and was more than likely file content
          bodyToLog = 'RESPONSE BODY DATA OMMITTED FROM LOG DUE TO SIZE';
        }
        log.json('silly', {
          statusCode: response.statusCode,
          header: response.headers,
          body: bodyToLog
        });
      }

      callback(err, response, body);
    });
  };
};

log.getCapturedSillyLogs = function () {
  return log.default.transports.silly.output;
};

log.writeCapturedSillyLogs = function (file, append) {
  log.default.transports.silly.writeToFile(file, append);
};

module.exports = log;