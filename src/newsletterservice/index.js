/*
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const logger = require('./logger')
// DB: Import
const db = require('./db');

if (process.env.DISABLE_PROFILER) {
  logger.info("Profiler disabled.")
} else {
  logger.info("Profiler enabled.")
  require('@google-cloud/profiler').start({
    serviceContext: {
      service: 'newsletterservice',
      version: '1.0.0'
    }
  });
}


if (process.env.ENABLE_TRACING == "1") {
  logger.info("Tracing enabled.")

  const { resourceFromAttributes } = require('@opentelemetry/resources');

  const { ATTR_SERVICE_NAME }= require('@opentelemetry/semantic-conventions');

  const { GrpcInstrumentation } = require('@opentelemetry/instrumentation-grpc');
  const { registerInstrumentations } = require('@opentelemetry/instrumentation');
  const opentelemetry = require('@opentelemetry/sdk-node');

  const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-grpc');

  const collectorUrl = process.env.COLLECTOR_SERVICE_ADDR;
  const traceExporter = new OTLPTraceExporter({url: collectorUrl});

  const sdk = new opentelemetry.NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'newsletterservice',
    }),
    traceExporter: traceExporter,
  });

  registerInstrumentations({
    instrumentations: [new GrpcInstrumentation()]
  });

  sdk.start()
} else {
  logger.info("Tracing disabled.")
}


const path = require('path');
const HipsterShopServer = require('./server');

const PORT = process.env['PORT'];
const PROTO_PATH = path.join(__dirname, '/proto/');

// DB: Added to initialize the database. 
// gRPC Initialization unchanged
async function startServer() {
  try {
    logger.info('Connecting to PostgreSQL...');
    await db.testConnection();
    await db.initDatabase();
    logger.info('Database initialized successfully');
    
    // Start gRPC server
    const server = new HipsterShopServer(PROTO_PATH, PORT);
    server.listen();
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1); // Kubernetes will restart the pod
  }
}

startServer();
