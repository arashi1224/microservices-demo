# Newsletter Service Setup Guide

## Overview

We added a new **newsletterservice**. The database for this service is stored in a **PersistentVolumeClaim (PVC)**. When new updates are applied to the newsletterservice, a **clean install** is required for it to work correctly.

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

---

## Port Forwarding

### Frontend

```bash
kubectl port-forward deployment/frontend 8080:8080
```

### Newsletter HTTP Unsubscribe Endpoint

```bash
kubectl port-forward deployment/newsletter 8081:8081
```

---

## Checking Email Logs

To inspect email-related behavior, check the newsletter service logs:

```bash
kubectl logs deployment/newsletter
```

---

## Clean Redeploy (Worst Case)

If deployment issues persist, fully clean all pods and PVCs, then redeploy:

```bash
kubectl delete pods --all
kubectl delete pvc --all  # Use Ctrl + C if needed
skaffold delete
skaffold run
```

This ensures a fresh state for the newsletterservice and its database.
