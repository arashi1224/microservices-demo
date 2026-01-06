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
// const path = require('path');
const fs = require('fs').promises;
// DB: Import, and removing JSON file
//const filePath = '/tmp/user.json'; // path.join(__dirname, 'user.json');
const db = require('./db');

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
  const { email, name, surname, order } = request;
  const valid = emailValidator.validate(email);
  
  if (!valid) { throw new InvalidEmail(); }

  //writeUserToFile(email, name, surname, order);
  // DB: Added to database
  addUserToDatabase(email, name, surname);
  

  // console.log(`Hello ${name} ${surname}, thank your for subscribing with your email: ${email}.\nWe appreciate that you bought the item with the id ${order.items[0].item.product_id}! `);
  
  return { };
};

/* DB: Changed to database instead of JSON file
async function writeUserToFile(email, name, surname, order) {
  try {
    let data;

    try {
      const rawData = await fs.readFile(filePath, 'utf8');
      data = JSON.parse(rawData)
    } catch (err) {
      if (err.code === 'ENOENT') {
        data = { users: [] };
      } else {
        throw err;
      }
    }

    data.users.push({
      id: data.users.length ? data.users[data.users.length - 1].id + 1 : 1,
      email,
      firstName: name,
      lastName: surname
      // order: order
    });

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    logger.info(`Subscription successful: ${email}`);
    logger.info({ users: data.users }, 'Current user.json contents');
    // logger.info(`Current data: ${{ users: data.users }}`);
  } catch (err) {
    logger.error(err, 'An unexpected error occurred while writing user to newsletterservice/user.js file');
  }
}
*/
// DB: Adding user to database
async function addUserToDatabase(email, name, surname) {
  try {
    await db.addSubscriber(email, name, surname);
    logger.info(`Subscription successful: ${email} saved to database`);
  } catch (error) {
    logger.error(`Failed to save subscriber ${email}: ${error.message}`);
    throw new Error('Failed to save subscription to database');
  }
}
