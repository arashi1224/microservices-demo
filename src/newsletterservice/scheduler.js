const fs = require('fs');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const cron = require('node-cron');
const { sendNewsletterBatch } = require('./newsletter');

// ============================================
// 1. GENERATE HEALTH PROTO
// ============================================
const PROTO_DIR = path.join(__dirname, 'protos');
if (!fs.existsSync(PROTO_DIR)) {
    fs.mkdirSync(PROTO_DIR, { recursive: true });
}

const HEALTH_PROTO_PATH = path.join(PROTO_DIR, 'health.proto');
const HEALTH_PROTO_CONTENT = `
syntax = "proto3";
package grpc.health.v1;

message HealthCheckRequest {
  string service = 1;
}

message HealthCheckResponse {
  enum ServingStatus {
    UNKNOWN = 0;
    SERVING = 1;
    NOT_SERVING = 2;
    SERVICE_UNKNOWN = 3;
  }
  ServingStatus status = 1;
}

service Health {
  rpc Check(HealthCheckRequest) returns (HealthCheckResponse);
  rpc Watch(HealthCheckRequest) returns (stream HealthCheckResponse);
}
`;

// Write the file
fs.writeFileSync(HEALTH_PROTO_PATH, HEALTH_PROTO_CONTENT);
console.log(`✅ Generated health proto at: ${HEALTH_PROTO_PATH}`);

// ============================================
// 2. SETUP SERVER
// ============================================
const PORT = "0.0.0.0:9080";

// Load the proto we just created
const packageDefinition = protoLoader.loadSync(HEALTH_PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const healthService = protoDescriptor.grpc.health.v1.Health.service;

// Implement the Check function manually
function check(call, callback) {
    // 1 = SERVING
    callback(null, { status: 'SERVING' });
}

const server = new grpc.Server();

// Add the service with our manual implementation
server.addService(healthService, {
    Check: check,
    Watch: () => {}
});

server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
        console.error(`❌ Failed to bind server: ${err}`);
        return;
    }
    console.log(`✅ Server running and listening on ${PORT}`);
    
    // ============================================
    // START THE CRON SCHEDULER
    // ============================================
    startScheduler();
});

function startScheduler() {
    console.log('📅 Newsletter Scheduler Started');
    
    // Example: Run every minute
    cron.schedule('* * * * *', () => {
        console.log('\n⏰ Scheduled task triggered!');
        sendNewsletterBatch();
    });

    console.log('✅ Scheduler is running in background.');
    
    // Run once on startup
    sendNewsletterBatch(); 
}

// Graceful Shutdown
process.on('SIGTERM', () => {
    server.tryShutdown(() => {
        console.log('🛑 Server stopped');
    });
});