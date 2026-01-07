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

const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const cron = require('node-cron');
const httpApp = require('./http');

const subscribe = require('./subscribe');
const { sendNewsletterBatch } = require('./newsletter');

const logger = require('./logger')

class HipsterShopServer {
  constructor(protoRoot, port = HipsterShopServer.PORT) {
    this.port = port;

    this.packages = {
      hipsterShop: this.loadProto(path.join(protoRoot, 'demo.proto')),
      health: this.loadProto(path.join(protoRoot, 'grpc/health/v1/health.proto'))
    };

    this.server = new grpc.Server();
    this.loadAllProtos(protoRoot);
  }

  /**
   * Handler for NewsletterService.Subscribe.
   * @param {*} call  { SubscribeRequest }
   * @param {*} callback  fn(err, Empty)
   */
  // DB: Changed it to an async function to addUserToDatabase()
  static async SubscribeServiceHandler(call, callback) {
    try {
      logger.info(`NewsletterService#Subscribe invoked with request ${JSON.stringify(call.request)}`);
      const response = await subscribe(call.request);
      callback(null, response);
    } catch (err) {
      console.warn(err);
      callback(err);
    }
  }

  static CheckHandler(call, callback) {
    callback(null, { status: 'SERVING' });
  }


  listen() {
    const server = this.server 
    const port = this.port
    server.bindAsync(
      `[::]:${port}`,
      grpc.ServerCredentials.createInsecure(),
      () => {
        logger.info(`NewsletterService gRPC server started on port ${port}`);
        server.start();
  
        this.startCron()
      }
    );

    httpApp.listen(8081, () => {
      logger.info('HTTP for unscubscribe from newsletterservice listening on port 8080');
    });
  }

  startCron() {
    console.log('📅 Newsletter Cron Scheduler Started');
    cron.schedule('* * * * *', () => {
        console.log('\n⏰ Scheduled task triggered!');
        sendNewsletterBatch();
    });
    // Run once immediately
    sendNewsletterBatch();
  }

  loadProto(path) {
    const packageDefinition = protoLoader.loadSync(
      path,
      {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      }
    );
    return grpc.loadPackageDefinition(packageDefinition);
  }

  loadAllProtos(protoRoot) {
    const hipsterShopPackage = this.packages.hipsterShop.hipstershop;
    const healthPackage = this.packages.health.grpc.health.v1;

    this.server.addService(
      hipsterShopPackage.NewsletterService.service,
      {
        subscribe: HipsterShopServer.SubscribeServiceHandler.bind(this)
      }
    );

    this.server.addService(
      healthPackage.Health.service,
      {
        check: HipsterShopServer.CheckHandler.bind(this)
      }
    );
  }
}

HipsterShopServer.PORT = process.env.PORT;

module.exports = HipsterShopServer;
