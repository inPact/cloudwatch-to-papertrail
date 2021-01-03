var zlib = require('zlib');
var winston = require('winston');
var papertrailTransport = require('winston-papertrail').Papertrail;
//var dogapi = require('dogapi');
var config = require('./env.json');

function addLambdaMetrics(data, match) {
  //var now = dogapi.now();

  data.push({
    metric: 'aws.lambda.billed',
    points: [
      [now, match[1]]
    ]
  });

  data.push({
    metric: 'aws.lambda.maxmemory',
    points: [
      [now, match[2]]
    ]
  });
};

function app_parse(data){
    let res =  data.split('_');
    return res
}

function pre_parse(data){

   let res =  data.logStream.split('.');

   if ( res[4].startsWith('fluentd-cloudwatch')  || 
        res[4].startsWith('external-dns') || 
        res[4].startsWith(' dashboard-metrics')){
      return null
   }
   else {
       return res[4];
   }

}


function addAppMetrics(data, match) {
  var now = parseInt((new Date(match[1])).getTime()/1000);

  var tags = [];
  var points = [];

  match[3].split(' ').forEach(function (metric) {
    var keyValue = metric.split('=');

    if (keyValue[0].indexOf('metric#') == -1) {
      return;
    }

    if (keyValue[0].indexOf('metric#tag#') != -1) {
      return tags.push(keyValue[0].replace('metric#tag#', '') + ':' + keyValue[1]);
    }

    points.push({
      metric: [config.appname, config.program, match[2], keyValue[0].replace('metric#', '')].join('.'),
      points: [
        [now, parseInt(keyValue[1])]
      ]
    });
  });

  points.forEach(function (item) {
    item.tags = tags;
    data.push(item);
  });
};

exports.handler = function (event, context, cb) {
  
  context.callbackWaitsForEmptyEventLoop = true;

  var payload = new Buffer(event.awslogs.data, 'base64');

  zlib.gunzip(payload, function (err, result) {
    if (err) {
      return cb(err);
    }
    
  
    /*
        dogapi.initialize({
          api_key: config.datadog
        });
    */

    var log = new (winston.Logger)({
      transports: []
    });

    var data = JSON.parse(result.toString('utf8'));
    
    //console.log("data =========================================================================================================");
    //console.log(JSON.stringify(data));

    var logGroup;
    var name_space;
    var app_data =  pre_parse(data)
    if (app_data == null){
      return;
    }
    else{
      app_data = app_parse(app_data)
      logGroup = app_data[0];
      name_space = app_data[1];
    }

    

    log.add(papertrailTransport, {
      host: process.env.host, //host: config.host,
      port: process.env.port, //port: config.port,
      program: logGroup,// data.logGroup,
      hostname: name_space, // "K8s ",
      flushOnClose: true,
      logFormat: function (level, message) {
        return message;
      }
    });


    //var metricRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)\ -\ info:\ ([a-z]+):.*?(metric#.*)+$/;
    //var reportRegex = /^REPORT\ RequestId.*Billed\ Duration:\ ([0-9]+)\ ms.*Used:\ ([0-9]+)\ MB$/;

    //var metricPoints = [];
    //var reportPoints = [];

    //log.info(result.toString('utf8'));

    data.logEvents.forEach(function (line) {

      var obj = JSON.parse(line.message)
      //if ( obj.kubernetes.container_name == 'k8-internus' || obj.kubernetes.container_name == 'ros-api-dev'){
      if ( obj.kubernetes == undefined ) {
        //fargate logs
        log.info( obj.log.substr(40) );
      }
      else {
        //ordinary logs
        if ( obj.kubernetes.container_image.startsWith('075139435924.dkr.ecr.eu-west-1.amazonaws.com')){
          log.info( obj.log);
        }
      }

      if (config.datadog !== '') {
      //  var metricMatch = line.log.trim().match(metricRegex);

        //if (metricMatch != null) {
        //  return addAppMetrics(metricPoints, metricMatch);
        //}

        //var reportMatch = line.log.trim().match(reportRegex);

        //if (reportMatch != null) {
        //  return addLambdaMetrics(reportPoints, reportMatch);
        //}
      }
    });

    if (config.datadog === '') {
      log.close();
      return cb();
    }

    /*dogapi.metric.send_all(metricPoints, function () {
      dogapi.metric.send_all(reportPoints, function () {
        log.close();
        cb();
      });
    });*/
  });
};
