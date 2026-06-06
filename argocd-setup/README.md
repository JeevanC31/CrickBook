# ArgoCD & Argo Rollouts Deployment Runbook

This folder contains the step-by-step instructions, YAML manifests, and PowerShell commands to set up ArgoCD, Argo Rollouts, and deploy the CrickBook application on your AWS EKS cluster.

---

## Prerequisites
Ensure that:
1. Your Kubernetes context is pointed to the correct EKS cluster:
   ```powershell
   aws eks update-kubeconfig --region ap-south-2 --name jeevan-jeevan-eks-demo
   ```
2. You are running commands in PowerShell from the project root directory.

---

## Setup & Deployment Steps

### Step 1: Download Windows CLI Tools
Download the ArgoCD CLI and Argo Rollouts CLI plugin binaries to the project root directory:

```powershell
# Download ArgoCD CLI
curl.exe -L -o argocd.exe https://github.com/argoproj/argo-cd/releases/latest/download/argocd-windows-amd64.exe

# Download Argo Rollouts CLI Plugin
curl.exe -L -o kubectl-argo-rollouts.exe https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-windows-amd64
```

---

### Step 2: Create EKS Namespaces
Create the namespaces used for the retail application workloads and the argo rollouts progressive delivery controller:

```powershell
kubectl create namespace retail
kubectl create namespace argo-rollouts
```

---

### Step 3: Install Argo Rollouts
Deploy the Argo Rollouts controller and its Custom Resource Definitions (CRDs):

```powershell
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
```

---

### Step 4: Expose ArgoCD and Configure Password
Expose the ArgoCD server using an AWS LoadBalancer and update the default admin password to `Mur@li2024`:

```powershell
# 1. Patch the Service to LoadBalancer type
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# 2. Wait 30-60 seconds for DNS provisioning, then fetch the External DNS address
$argocdUrl = kubectl get svc argocd-server -n argocd -o jsonpath="{.status.loadBalancer.ingress[0].hostname}"
Write-Output "ArgoCD Web URL: https://$argocdUrl"

# 3. Retrieve and decode the auto-generated initial password
$encodedPassword = kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath="{.data.password}"
$initialPassword = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($encodedPassword))
Write-Output "Initial password is: $initialPassword"

# 4. Login using the ArgoCD CLI
.\argocd.exe login $argocdUrl --username admin --password $initialPassword --insecure

# 5. Update admin password to Mur@li2024
.\argocd.exe account update-password --current-password $initialPassword --new-password Mur@li2024
```

---

### Step 5: Commit and Push Helm Configurations
Before deploying, ensure all local Helm values and overrides are pushed to your GitHub repository (since ArgoCD pulls definitions from Git):

```powershell
git commit -am "Update Helm values and templates for AWS EKS deployment"
git push origin main
```

---

### Step 6: Deploy the CrickBook Application via ArgoCD
Apply the ArgoCD application manifest to trigger automated synchronization:

```powershell
# Apply the application manifest (located in this folder)
kubectl apply -f argocd-setup/cricbook-app.yaml

# Manually trigger the initial sync
.\argocd.exe app sync cricbook
```

---

## Accessing UIs and Dashboards

### 1. ArgoCD Web Dashboard
* **URL**: Use the hostname output by the command: `kubectl get svc argocd-server -n argocd`
* **Username**: `admin`
* **Password**: `Mur@li2024`
* *TLS Notice:* Proceed past the browser's SSL warning (due to self-signed TLS certificates).

### 2. Argo Rollouts Dashboard
Run the following local proxy command to start the Rollouts visual interface:
```powershell
.\kubectl-argo-rollouts.exe dashboard -n argo-rollouts
```
* **URL**: Open [http://localhost:3100](http://localhost:3100) in your browser.

### 3. CrickBook Application (Frontend)
Get the LoadBalancer DNS name of the Envoy Gateway:
```powershell
$appUrl = kubectl get svc -n envoy-gateway-system -l gateway.networking.k8s.io/gateway-name=cricbook-gateway -o jsonpath="{.items[0].status.loadBalancer.ingress[0].hostname}"
Write-Output "Access application here: http://$appUrl"
```
