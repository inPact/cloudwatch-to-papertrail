const { Client } = require('@elastic/elasticsearch');
var zlib = require('zlib');
var config = require('./env.json');

const client = new Client({
  node: config.host,
  auth: {
    username: config.user,
    password: config.password,
  },
});

function sendData(data) {
  data.logEvents.forEach(function (line) {
    client.index({
      index: config.index,
      body: {
        ['@timestamp']: (new Date()).toISOString(),
        message: line.message,
        container: data.logStream.substr(-12),
        service: data.logGroup
      },
    });
  });
}




exports.handler = function (event, context, cb) {
  handler(context, event, cb);
};

function handler(context, event, cb) {
  // context.callbackWaitsForEmptyEventLoop = config.waitForFlush;

  const payload = new Buffer(event.awslogs.data, 'base64');

  zlib.gunzip(payload, function (err, result) {
    // if (err) {return cb(err);}
    sendData(JSON.parse(result.toString('utf8')));
  });
}

handler(1, packet, 2)
