# MyCourse PLMS — Production Deployment Guide
**Personal Learning Management System (PLMS)**  
**Target Infrastructure:** AWS EC2 (`t3.micro`), Ubuntu Server 24.04 LTS, Docker & Docker Compose, Caddy Reverse Proxy, MongoDB Atlas, Private AWS S3 (`mycourse-private-media-2026`).

---

## 1. Architecture & Security Overview

```
                      Internet
                         │
                 Ports 80 / 443 (HTTP/HTTPS)
                         ▼
        ┌───────────────────────────────────┐
        │       Caddy Reverse Proxy         │
        │  • Automatic TLS (Let's Encrypt)  │
        │  • Security Headers (HSTS, etc.) │
        │  • Gzip & Zstandard Compression   │
        │  • Streaming Chunk Passthrough    │
        └─────────────────┬─────────────────┘
                          │ Internal Bridge Network (Port 5000)
                          ▼
        ┌───────────────────────────────────┐
        │   MyCourse Express Application    │
        │  • Serves React 19 SPA (public/)  │
        │  • REST API endpoints (/api/*)    │
        │  • Rate Limiting & JWT Validation │
        │  • Health Check (/api/health)     │
        └───────┬───────────────────┬───────┘
                │                   │
                ▼                   ▼
    ┌──────────────────────┐  ┌────────────────────────────────────┐
    │    MongoDB Atlas     │  │           AWS S3 Bucket            │
    │  (Users, Courses,    │  │   `mycourse-private-media-2026`    │
    │   Progress, Auth)    │  │ (Auth via EC2 IAM Instance Role:   │
    │                      │  │       `MyCourseEC2S3Role`)         │
    └──────────────────────┘  └────────────────────────────────────┘
```

### Key Security Highlights:
- **Zero Static AWS Keys in Production:** The application uses the AWS SDK Default Credential Provider Chain. It transparently requests temporary rotating credentials from the EC2 Instance Metadata Service (IMDSv2) via the attached IAM Role `MyCourseEC2S3Role`.
- **Private S3 Bucket:** Objects are 100% private. Students stream video via token-authenticated short-lived presigned URLs.
- **Fail-Fast Database Validation:** In production (`NODE_ENV=production`), the application refuses to start if MongoDB Atlas is unreachable (no silent in-memory fallback).
- **Isolated Non-Root Container:** The Express container executes under a dedicated unprivileged user (`appuser:1001`).

---

## 2. AWS Setup (Console Steps)

### Step 2.1: S3 Bucket Verification & CORS
1. Open the [AWS S3 Console](https://s3.console.aws.amazon.com/).
2. Verify bucket name: `mycourse-private-media-2026` in Region `ap-south-1` (Asia Pacific - Mumbai).
3. Confirm **Block *all* public access** is set to **On**.
4. Go to **Permissions** tab → **Cross-origin resource sharing (CORS)** → Click **Edit** and paste:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag", "Content-Length", "Content-Range"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
5. Click **Save changes**.

---

### Step 2.2: IAM Policy Creation (`MyCourseS3Access`)
1. Open the [AWS IAM Console](https://us-east-1.console.aws.amazon.com/iam/home#/policies) → Click **Create policy**.
2. Select the **JSON** tab and paste the following policy:

> [!IMPORTANT]
> `s3:ListBucket` is applied to the **bucket ARN** (`arn:aws:s3:::mycourse-private-media-2026`), while `GetObject`, `PutObject`, and `DeleteObject` are applied to **all objects** (`arn:aws:s3:::mycourse-private-media-2026/*`).

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "MyCourseBucketLevelAccess",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::mycourse-private-media-2026"
    },
    {
      "Sid": "MyCourseObjectLevelAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::mycourse-private-media-2026/*"
    }
  ]
}
```
3. Click **Next** → Name the policy: `MyCourseS3Access`.
4. Click **Create policy**.

---

### Step 2.3: IAM Role Creation (`MyCourseEC2S3Role`)
1. Go to **IAM Console** → **Roles** → Click **Create role**.
2. Select **AWS service** as the trusted entity type.
3. Use case: Choose **EC2** → Click **Next**.
4. Filter and select the policy created above: `MyCourseS3Access`.
5. Click **Next** → Role name: `MyCourseEC2S3Role`.
6. Click **Create role**.

---

### Step 2.4: Launch EC2 Instance
1. Open the [AWS EC2 Console](https://ap-south-1.console.aws.amazon.com/ec2/) (Region: `ap-south-1`).
2. Click **Launch Instance**:
   - **Name:** `mycourse-production-server`
   - **AMI:** Ubuntu Server 24.04 LTS (HVM), SSD Volume Type (`ami-...` 64-bit x86)
   - **Instance Type:** `t3.micro` (1 vCPU, 1 GiB Memory)
   - **Key pair:** Select or create your SSH key pair (`mycourse-key.pem`)
   - **Network settings / Security Group:**
     - Allow SSH traffic from: `My IP` (Port 22)
     - Allow HTTP traffic from the internet: `0.0.0.0/0` (Port 80)
     - Allow HTTPS traffic from the internet: `0.0.0.0/0` (Port 443)
   - **Configure storage:** `30 GiB` gp3 root volume.
   - **Advanced details → IAM instance profile:** Select `MyCourseEC2S3Role`.
3. Click **Launch instance**.
4. *(Recommended)* Go to **Elastic IPs** → **Allocate Elastic IP** → **Associate Elastic IP** with your instance to ensure a static IP address across reboots.

---

## 3. Server Setup & Memory Tuning

### Step 3.1: Connect via SSH
```bash
chmod 400 mycourse-key.pem
ssh -i mycourse-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### Step 3.2: Configure 2GB Swap Space
Because `t3.micro` instances have 1 GB of physical RAM, a 2 GB swapfile is **strictly required** to prevent the Linux Out-Of-Memory (OOM) killer during Docker container builds and image pulls:

```bash
# Check existing swap (should be empty)
sudo swapon --show

# Allocate 2GB file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent across reboots
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Tune swappiness for optimal server responsiveness
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# Verify active memory and swap
free -h
```

---

### Step 3.3: Install Docker & Docker Compose v2
Run the official Docker installation commands on Ubuntu 24.04 LTS:

```bash
# Update package index and install prerequisites
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg

# Add Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up the repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu noble stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add ubuntu user to docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## 4. Deploying the Application

### Step 4.1: Transfer Code to EC2
You can clone from your Git repository or transfer files using `rsync` from your local machine:

**Option A: Git Clone**
```bash
git clone <YOUR_GIT_REPO_URL> ~/mycourse
cd ~/mycourse
```

**Option B: Rsync from Local Machine (PowerShell or Bash)**
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'backend/uploads/*' -e "ssh -i mycourse-key.pem" ./ ubuntu@<EC2-PUBLIC-IP>:~/mycourse/
```

---

### Step 4.2: Configure Production Environment (`.env`)
On the EC2 server, navigate to the project directory and create the `.env` file:

```bash
cd ~/mycourse
cp .env.example .env
nano .env
```

Update the values with your production credentials:

```ini
PORT=5000
NODE_ENV=production

# Set your registered custom domain or EC2 Public IP / nip.io domain
DOMAIN=yourdomain.com
CLIENT_URL=https://yourdomain.com

# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://<dbuser>:<dbpassword>@cluster0.example.mongodb.net/mycourse?retryWrites=true&w=majority

# Strong Random JWT Secret (32+ characters)
JWT_SECRET=b8d7f6e4a2c19e8a7b6d5c4e3f2a1b0d9e8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a
JWT_EXPIRES_IN=7d

# Initial Admin Credentials
ADMIN_EMAIL=admin@mycourse.local
ADMIN_PASSWORD=AdminProductionSecret2026!
ADMIN_NAME=Headmaster Admin

# AWS S3 Settings (Region: ap-south-1, Bucket: mycourse-private-media-2026)
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=mycourse-private-media-2026
USE_LOCAL_S3_FALLBACK=false

# IMPORTANT: Leave AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY unset!
# The app automatically uses the EC2 IAM Instance Role (MyCourseEC2S3Role).
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

### Step 4.3: Build & Start Containers
Run Docker Compose to build the multi-stage image and launch Caddy:

```bash
# Build and run containers in detached mode
docker compose up -d --build
```

### Step 4.4: Verify Container Status
Check that all containers are healthy:

```bash
docker compose ps
```

Expected output:
```
NAME             IMAGE              COMMAND                  SERVICE   CREATED          STATUS                    PORTS
mycourse-app     mycourse-app       "node server.js"         app       30 seconds ago   Up 30 seconds (healthy)   127.0.0.1:5000->5000/tcp
mycourse-caddy   caddy:2.9-alpine   "caddy run --config …"   caddy     10 seconds ago   Up 10 seconds             0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

Test the internal health endpoint directly on the host:
```bash
curl -i http://localhost:5000/api/health
```

Expected response: `HTTP/1.1 200 OK` with JSON payload `{"status":"ok","service":"MyCourse PLMS API"}`.

---

### Step 4.5: Seed Admin Account
Run the database seeder inside the running backend container:

```bash
docker compose exec app node utils/seedAdmin.js
```

You can now log in at `https://yourdomain.com/login` using your configured admin credentials.

---

## 5. Domain & Automatic HTTPS Setup

1. In your DNS registrar (e.g. Cloudflare, Route53, Namecheap, GoDaddy):
   - Create an **A Record**:
     - **Name:** `@` (or `courses`)
     - **Value:** `<YOUR-EC2-ELASTIC-IP>`
     - **TTL:** 300 seconds
2. Ensure Ports `80` and `443` are open in the EC2 Security Group.
3. Verify that `DOMAIN` in `.env` matches your DNS record (e.g. `DOMAIN=courses.example.com`).
4. Caddy automatically contacts Let's Encrypt / ZeroSSL, solves the HTTP-01 challenge, provisions a TLS certificate, and enables HTTP/2 + HTTP/3 HTTPS automatically.
5. Visit `https://yourdomain.com` in your browser.

---

## 6. Operations & Maintenance

### View Real-Time Logs
```bash
# All logs
docker compose logs -f

# App-specific logs
docker compose logs -f --tail=100 app

# Caddy web server logs
docker compose logs -f --tail=100 caddy
```

### Monitor Resource Utilization
```bash
docker stats
```

### Apply Code Updates (Zero Downtime)
```bash
cd ~/mycourse
git pull
docker compose up -d --build
```

### Verify AWS EC2 IAM Credentials on Server
If you want to verify that the EC2 instance is successfully receiving credentials from the IAM Role:
```bash
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/
```
Output will display `MyCourseEC2S3Role`.

---

## 7. Troubleshooting Guide

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| **`AccessDenied` on S3 operations** | IAM policy lacks permissions or IAM role is not attached to EC2. | Verify `MyCourseEC2S3Role` is attached via EC2 Console (Actions → Security → Modify IAM role). Confirm `s3:ListBucket` is granted on `arn:aws:s3:::mycourse-private-media-2026`. |
| **Docker build hangs / killed** | Server ran out of memory during `npm ci` or Vite bundling. | Verify 2GB swap space using `free -h`. Ensure swappiness is set to 10. |
| **`502 Bad Gateway` from Caddy** | App container is still starting or health check has not yet passed. | Check `docker compose logs app` to confirm MongoDB connection is established. Wait 15 seconds for startup. |
| **`EADDRINUSE: 5000`** | Another local Node process is running on port 5000. | Stop the rogue process (`sudo fuser -k 5000/tcp` or check local tasks). |
| **SSL certificate error in browser** | Port 80 is blocked by security group or DNS A record hasn't propagated. | Check EC2 Security Group inbound rules for Port 80 and 443. Run `dig +short yourdomain.com` to confirm DNS points to the EC2 IP. |

