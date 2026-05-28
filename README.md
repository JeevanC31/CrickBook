# 🏏 CricBook — Microservices Architecture

CricBook is a high-performance, containerized microservices application designed for cricket turf booking, coaching sessions, match matchmaking, e-commerce shopping, admin metrics, and real-time AI assistance.

---

## 🏗 Project Architecture & Structure

```
projec1/
├── cricbook-next/          ← Next.js Frontend (React)
├── services/
│   ├── auth-service/       ← User authentication, profiles, & JWKS endpoints (Port 4001)
│   ├── turf-service/       ← Turf listings & bookings (Port 4002)
│   ├── coach-service/      ← Coach booking & sessions (Port 4003)
│   ├── match-service/      ← Match matchmaking (Port 4004)
│   ├── shop-service/       ← Products, shopping cart, & checkout (Port 4005)
│   ├── chat-service/       ← Ollama LLM AI Chatbot (Port 4006)
│   └── admin-service/      ← Admin metrics, CRUD, and file uploads (Port 4007)
├── helm/
│   └── cricbook/           ← Premium Helm Chart for complete Kubernetes deployment
└── docker-compose.yml      ← Orchestrates the full local development stack
```

---

## ⚡ Quick Start: Local Development (Docker Compose)

For quick local testing outside Kubernetes, run the entire stack orchestrating all 9 containers with a single command:

```bash
# From the root directory:
docker-compose up --build
```
* Visit the Next.js frontend at: **`http://localhost:3001`** (mapping inside compose from `3000`).

---

## 🚀 Production-Grade Kubernetes Deployment (Helm + Gateway API + Envoy)

For production scale, CricBook includes a state-of-the-art deployment architecture built on the **Kubernetes Gateway API** and the **Envoy Proxy Gateway**.

### 🌟 Key Architecture Features:
* **Kubernetes Gateway API & Envoy Gateway:** Modern, declarative ingress routing replacing standard Ingress controllers.
* **Envoy Sidecar Proxies:** Every microservice pod automatically runs a high-performance Envoy sidecar container proxying internal/external traffic.
* **JWT Validation at Gateway Edge:** A declarative `SecurityPolicy` automatically intercepts external incoming requests, validates JWT signatures using the `auth-service` JWKS keys endpoint, and injects authenticated user headers (`X-User-Id` & `X-User-Role`) down to the microservices.
* **Granular Rate Limiting:** Dedicated `BackendTrafficPolicy` enforces in-memory rate limiting at the Gateway edge (20 req/min for auth brute-force protection, 100 req/min for generic APIs, 500 req/min for frontend).
* **Database Volume Isolation:** Configured with a `Recreate` deployment strategy to prevent concurrency disk-access collisions (`postmaster.pid` locking) when deploying or upgrading database pods.

---

## 📋 Kubernetes Deployment Steps

### 1️⃣ Step 1: Install Gateway API CRDs & Envoy Gateway
Before installing the Helm chart, install the required standard Kubernetes Gateway CRDs and the Envoy Gateway controller in your cluster:

```bash
# Apply Gateway API CRDs (v1.2.0+)
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml

# Add and install the Envoy Gateway controller via Helm
helm install eg oci://docker.io/envoyproxy/gateway-helm \
  --version v1.3.2 \
  --namespace envoy-gateway-system \
  --create-namespace
```

### 2️⃣ Step 2: Build Local Images (if using Minikube)
If you are deploying locally inside Minikube, switch your shell to Minikube's Docker daemon so Kubernetes can find the locally built microservice images:

```powershell
# Point your shell to minikube's docker daemon
minikube docker-env | Invoke-Expression

# Build the services
docker-compose build
```

### 3️⃣ Step 3: Deploy CricBook via Helm
Now, install the CricBook Helm chart in a dedicated `cricbook` namespace:

```bash
# Install the Helm Chart
helm install cricbook ./helm/cricbook -n cricbook --create-namespace
```

### 4️⃣ Step 4: Accessing the Gateway (Minikube Tunnel)
To route traffic through the Envoy Gateway, run `minikube tunnel` in a separate terminal to assign an external LoadBalancer IP to the gateway:

```bash
minikube tunnel
```

Query the Gateway address to find the IP:
```bash
kubectl get gateway cricbook-gateway -n cricbook
```
* Once `PROGRAMMED` is `True`, copy the IP (usually `127.0.0.1` on local setups) and add host mappings or open it in your browser!

### 5️⃣ Step 5: Helm Operations & Maintenance
To update your deployment after making manifest edits or config changes:

```bash
# Upgrade the Helm release
helm upgrade cricbook ./helm/cricbook -n cricbook
```

To fully uninstall and clean up all resources:
```bash
# Uninstall the Helm release
helm uninstall cricbook -n cricbook
```

---

## 🛠 Active Service Ports Reference

| Service | Host Port | K8s Cluster Port | Core Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend** | `3001` | `3000` | Next.js server-side React application |
| **Auth Service** | `4001` | `4001` | User registration, login, JWT issuance, JWKS |
| **Turf Service** | `4002` | `4002` | Cricket turfs booking & directory |
| **Coach Service**| `4003` | `4003` | Professional coaching sessions booking |
| **Match Service**| `4004` | `4004` | Player match matchmaking & scheduling |
| **Shop Service** | `4005` | `4005` | E-commerce store products & checkout |
| **Chat Service** | `4006` | `4006` | AI Assistant (interacts with Ollama LLM) |
| **Admin Service**| `4007` | `4007` | Dashboard metrics aggregation & uploads |
| **PostgreSQL**   | `5434` | `5432` | Shared relational database volume |
| **Ollama**       | `11434`| `11434`| Local Llama LLM AI runner |
