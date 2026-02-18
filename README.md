
# ArgoCD Manifest Generator

A modern, premium web application for managing ArgoCD Application manifests directly in your Git repositories. Built with Next.js 14, Tailwind CSS, and NextAuth.js.

## 🚀 Features

- **Multi-Provider Authentication**: Seamless login with GitHub and GitLab.
- **Repository Scanning**: Automatically discovers ArgoCD Application manifests in your repositories.
- **Visual Dashboard**: View all your applications in a card-based layout.
- **Direct Git Operations**: Creates, updates, and deletes manifests directly in your Git provider without needing a local clone.
- **Form-Based Editor**: User-friendly form abstraction over raw YAML editing.
- **Deploy Ready**: Includes Dockerfile and Helm Chart for production deployment.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Auth**: [NextAuth.js](https://next-auth.js.org/)
- **Git Integration**: [Octokit](https://github.com/octokit/octokit.js) & [GitBeaker](https://github.com/jdalrymple/gitbeaker)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- A GitHub OAuth App and/or GitLab Application for authentication.

### Obtaining OAuth Credentials

#### GitHub
1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Click **New OAuth App**.
3. Set **Homepage URL** to `http://localhost:3000`.
4. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`.
5. Register and copy the **Client ID** and **Client Secret**.

#### GitLab
1. Go to [GitLab Applications](https://gitlab.com/-/profile/applications).
2. Add a new application.
3. Set **Redirect URI** to `http://localhost:3000/api/auth/callback/gitlab`.
4. Select scopes `api` and `read_user`.
5. Save and copy the **Application ID** and **Secret**.

### Local Development

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/application-generator.git
    cd application-generator
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root directory:
    ```bash
    # NextAuth Configuration
    NEXTAUTH_URL=http://localhost:3000
    # NextAuth Configuration
    NEXTAUTH_URL=http://localhost:3000
    # Generate a secret with: openssl rand -base64 32
    NEXTAUTH_SECRET=changeme

    # GitHub Provider (Optional)
    GITHUB_ID=your-github-client-id
    GITHUB_SECRET=your-github-client-secret

    # GitLab Provider (Optional)
    GITLAB_ID=your-gitlab-app-id
    GITLAB_SECRET=your-gitlab-app-secret
    GITLAB_BASE_URL=https://gitlab.example.com # Optional: For self-hosted GitLab
    ```

4.  **Run the application**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Deployment

Build the container image:

```bash
docker build -t application-generator:latest .
```

Run the container:

```bash
docker run -p 3000:3000 \
  -e NEXTAUTH_SECRET=your-secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e GITHUB_ID=... \
  -e GITHUB_SECRET=... \
  application-generator:latest
```

## ☸️ Kubernetes Deployment (Helm)

A Helm chart is included in `charts/application-generator`.

1.  **Install the chart**:
    ```bash
    helm upgrade --install my-app-generator ./charts/application-generator \
      --namespace argocd-tools --create-namespace \
      --set auth.nextAuthUrl=https://generator.example.com \
      --set auth.nextAuthSecret=your-secret \
      --set auth.github.id=your-id \
      --set auth.github.secret=your-secret
    ```

2.  **Configuration**:
    See `charts/application-generator/values.yaml` for full configuration options including Ingress, Resources, and Autoscaling.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

MIT
