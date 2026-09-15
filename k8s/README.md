# Panduan Deployment SITAKO Web ke K3s (Kubernetes)

Direktori ini berisi konfigurasi Kubernetes (K3s) untuk menjalankan **SITAKO Web (Frontend)** berdampingan dengan **SITAKO Backend** dalam satu cluster.

---

## Struktur File Manifest

- **`01-web.yaml`**: Berisi `Deployment` dan `Service` (ClusterIP port 80) untuk Pod frontend `sitako-web`.
- **`02-ingress.yaml`**: Berisi Traefik `Ingress` terpadu:
  - Path `/` $\rightarrow$ Service `sitako-web:80`
  - Path `/api` $\rightarrow$ Service `app:8080` (Backend)

---

## Langkah-Langkah Deployment ke K3s

### 1. Build Image Docker & Ekspor ke File .tar
Di komputer lokal Anda:
```bash
docker build -t sitako-web:latest .
docker save sitako-web:latest -o sitako-web.tar
```

### 2. Transfer dan Import Image ke K3s Containerd
Jika menggunakan Multipass VM (`sitako-vm`):
```bash
multipass transfer sitako-web.tar sitako-vm:/home/ubuntu/sitako-web.tar
multipass exec sitako-vm -- sudo k3s ctr -n k8s.io images import /home/ubuntu/sitako-web.tar
multipass exec sitako-vm -- rm /home/ubuntu/sitako-web.tar
```

### 3. Terapkan Manifest K3s
Pastikan namespace `sitako` dan backend sudah terpasang terlebih dahulu:
```bash
kubectl apply -f k8s/01-web.yaml
kubectl apply -f k8s/02-ingress.yaml
```

### 4. Periksa Status Deployment & Pod
```bash
kubectl get pods -n sitako -l app=sitako-web
kubectl get svc -n sitako
kubectl get ingress -n sitako
```

### 5. Akses Aplikasi
Buka IP dari VM K3s di browser:
- `http://<IP-VM>/` $\rightarrow$ Menampilkan Frontend SITAKO Web
- `http://<IP-VM>/api/...` $\rightarrow$ Terhubung langsung ke API Backend SITAKO
