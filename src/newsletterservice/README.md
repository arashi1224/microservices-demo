# Newsletter Service Setup Guide

## Overview

We added a new **newsletterservice**. It has following functionality:
 1. It allows user to subscribe from frontend at the checkout. Subscribers are stored in database
 2. Newsletterservice takes user from database and product from ProductCatalog to form an email and "send" to user
    1. Sending was first trying to communicate with EmailService, but since EmailService is also a mock (only logs to console) and has much more complex gRPC handling, we decided that it might not change much to have the send function to logs directly to our newsletter console.
 3. Email is in form of html, having 2 buttons:
    1. "Shop now" sends user to the store page for the product
    2. "Unsubscribe" sends user to a "Goodbye" page, and deactivate the user from the database. User will no longer counted in email batch
 4. It will send email in interval, thanks to cron-job. We are setting it to once per minute to have quicker testing/demonstration
 5. SQL Database to manually manage existing users and sent emails.

#### Note:
The database for this service is stored in a **PersistentVolumeClaim (PVC)**. When new updates are applied to the newsletterservice, a **clean install** is required for it to work correctly.

---

## Repository Setup

```bash
git clone https://github.com/arashi1224/microservices-demo.git
cd microservices-demo.git
```

---

## Minikube Setup

Make sure you start with a clean Minikube profile:

```bash
minikube start -p minikube2
kubectl config use-context minikube2
```

---

## Deploy Services

From the project root, deploy all services using Skaffold:

```bash
skaffold run
```
Wait until all containers are up and running.
You can check all the pods with 

```bash
kubectl get pods
```

## Port Forwarding
Run the following command, each on different terminal
### Frontend

```bash
kubectl port-forward deployment/frontend 8080:8080
```

### Newsletter HTTP Unsubscribe Endpoint

```bash
kubectl port-forward deployment/newsletterservice 8081:8081
```

---

## Checking Email Logs

To inspect email-related behavior, check the newsletter service logs:

```bash
kubectl logs deployment/newsletterservice
```

---

## Access database 

To access database, first we need to check for the name of the database pod

```bash
kubectl get pods
```

search for the container with "postgres-newsletter" prefix. then access this pod with 

```bash
kubectl exec -it <postgres-newsletter-podName> -- psql -U newsletter_user -d newsletter
```

then, bash for database can be used with sql commands like:


```bash
SELECT * FROM subscribers;


SELECT * FROM email_history;
```


## Clean Redeploy (Worst Case)

If deployment issues persist, fully clean all pods and PVCs, then redeploy:

```bash
kubectl delete pods --all
kubectl delete pvc --all  # Use Ctrl + C if needed
skaffold delete
skaffold run
```

This ensures a fresh state for the newsletterservice and its database.
