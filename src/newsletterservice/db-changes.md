# Changes for the database 
- Added the db.js file
- Added to package.json : 
    ```json
    "pg": "^8.11.0"
    ```
## Newsletter.js
- `loadUsersFromDatabase()` : implemented db.`getAllSubscribers()` inside of it to get them from the database instead
- `processNewsLetterForUser()` : 
    - added `db.recordEmailSent()` to it
    - record failure to database

## Subscribe.js
- `writeUserToFile()` changed to `writeUserToDatabase()`

## Server.js
- Turned `SubscribeServiceHandler()` to an `async` function. Need to await `subscribe()` and the asnyc function inside of it 

## Index.js
- Added the database initialization to the server start

## newsletterservice.yaml
added : 
- PostgreSQL Database Configuration
- POSTGRESQL DATABASE - SECRET
- POSTGRESQL DATABASE - PERSISTENT VOLUME
- POSTGRESQL DATABASE - DEPLOYMENT
- POSTGRESQL DATABASE - SERVICE


## New File structure 

```
microservices-demo-newsletter-service-frontend-connection-merge-prep/
│
├── src/
│   └── newsletterservice/
│       ├── package.json                    [UPDATE] (add pg dependency)
│       ├── package-lock.json               [AUTO-GENERATED] (after npm install)
│       ├── Dockerfile                      [KEEP] (no changes needed)
│       ├── genproto.sh                     [KEEP] (no changes needed)
│       │
│       ├── index.js                        [UPDATE] (add db initialization)
│       ├── server.js                       [UPDATE] (make subscribe async)
│       ├── logger.js                       [KEEP] (no changes needed)
│       │
│       ├── newsletter.js                   [UPDATE] (use PostgreSQL instead of JSON)
│       ├── subscribe.js                    [UPDATE] (save to PostgreSQL)
│       ├── scheduler.js                    [KEEP] (no changes needed)
│       │
│       ├── db.js                           [ADD NEW] (copy from sandbox)
│       ├── init.sql                        [ADD NEW] (copy from sandbox)
│       │
│       ├── users.json                      [DELETE] (no longer needed)
│       │
│       └── proto/
│           ├── demo.proto
│           └── grpc/
│               └── health/
│                   └── v1/
│                       └── health.proto
│
├── kubernetes-manifests/
│   ├── kustomization.yaml                  [UPDATE] (add configMapGenerator)
│   ├── newsletterservice.yaml              [REPLACE] (with new version)
│   ├── adservice.yaml                      [KEEP]
│   ├── cartservice.yaml                    [KEEP]
│   ├── checkoutservice.yaml                [KEEP]
│   ├── currencyservice.yaml                [KEEP]
│   ├── emailservice.yaml                   [KEEP]
│   ├── frontend.yaml                       [KEEP]
│   ├── loadgenerator.yaml                  [KEEP]
│   ├── paymentservice.yaml                 [KEEP]
│   ├── productcatalogservice.yaml          [KEEP]
│   ├── recommendationservice.yaml          [KEEP]
│   └── shippingservice.yaml                [KEEP]
│
├── skaffold.yaml                           [KEEP] (no changes needed)
└── README.md                               [KEEP]
```
