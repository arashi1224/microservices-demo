// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const emailValidator = require('email-validator');
const pino = require('pino');

const logger = pino({
  name: 'newsletterservice-subscribe',
  messageKey: 'message',
  formatters: {
	level (logLevelString, logLevelNum) {
	  return { severity: logLevelString }
	}
  }
});

class EmailError extends Error {
  constructor (message) {
	super(message);
	this.code = 400; // Invalid argument error
  }
}

class InvalidEmail extends EmailError {
  constructor (email) {
	super(`Email is invalid`);
  }
}

/**
 * Verifies the email and logs the email.
 *
 * @param {*} request
 * @return nothing - {}.
 */
module.exports = function subscribe (request) {
  const { email } = request;
  const valid = emailValidator.validate(email);
  
  if (!valid) { throw new InvalidEmail(); }





  // logger.info(`Subscription successful: ${email}`);
  // console.log(`Subscription successful: ${email}`);

  logger.info(`Dear customer with email ${email}, check out the fancy new products in out store at http://localhost:8080 !`)





  
  return { };
};
