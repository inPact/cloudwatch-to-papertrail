/* File: newrelic.js */
'use strict'
/**
 * New Relic agent configuration.
 *
 * See lib/config/default.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
    app_name: ['lambda test'],
    license_key: '5386cf354af8605e8d2087981e6cd042e82dac39',
    loggingEnabled: 'true',
    NR_LOGGING_ENDPOINT: 'https://log-api.eu.newrelic.com/log/v1'
    /* ... rest of configuration .. */
}
