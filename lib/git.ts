
import https from "https";
import { Octokit } from "@octokit/rest";
import { Gitlab } from "@gitbeaker/rest";

export interface GitProvider {
  listRepos(): Promise<Repository[]>;
  getFile(repo: string, path: string): Promise<string | null>;
  saveFile(repo: string, path: string, content: string, message: string): Promise<void>;
  deleteFile(repo: string, path: string, message: string): Promise<void>;
  listFiles(repo: string, path?: string): Promise<FileEntry[]>;
  scanRepo(repo: string): Promise<FileEntry[]>;
}

export interface Repository {
  name: string;
  fullName: string; // owner/name
  url: string;
  defaultBranch: string;
}

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "dir";
}

export const getGitProvider = (accessToken: string, provider: string): GitProvider => {
  if (provider === "github") {
    return new GitHubProvider(accessToken);
  } else if (provider === "gitlab") {
    return new GitLabProvider(accessToken);
  }
  throw new Error("Unsupported provider");
};

class GitHubProvider implements GitProvider {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async listRepos(): Promise<Repository[]> {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });
    return data.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
    }));
  }

  async getFile(repo: string, path: string): Promise<string | null> {
    try {
      const [owner, name] = repo.split("/");
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo: name,
        path,
      });

      if (Array.isArray(data) || !("content" in data)) {
        return null;
      }

      return Buffer.from(data.content, "base64").toString("utf-8");
    } catch (e) {
      return null;
    }
  }

  async saveFile(repo: string, path: string, content: string, message: string): Promise<void> {
    const [owner, name] = repo.split("/");
    let sha: string | undefined;

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo: name,
        path,
      });
      if (!Array.isArray(data) && "sha" in data) {
        sha = data.sha;
      }
    } catch (e) {
      // File doesn't exist, create new
    }

    await this.octokit.repos.createOrUpdateFileContents({
      owner,
      repo: name,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      sha,
    });
  }

  async deleteFile(repo: string, path: string, message: string): Promise<void> {
    const [owner, name] = repo.split("/");
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo: name,
      path,
    });

    if (!Array.isArray(data) && "sha" in data) {
      await this.octokit.repos.deleteFile({
        owner,
        repo: name,
        path,
        message,
        sha: data.sha,
      });
    }
  }

  async listFiles(repo: string, path: string = ""): Promise<FileEntry[]> {
      const [owner, name] = repo.split("/");
      try {
          const { data } = await this.octokit.repos.getContent({
              owner,
              repo: name,
              path,
          });

          if (!Array.isArray(data)) {
              return [];
          }

          return data.map(item => ({
              name: item.name,
              path: item.path,
              type: item.type === "dir" ? "dir" : "file"
          }));
      } catch (e) {
          return [];
      }
  }

  async scanRepo(repo: string): Promise<FileEntry[]> {
    const [owner, name] = repo.split("/");
    try {
      const { data } = await this.octokit.git.getTree({
        owner,
        repo: name,
        tree_sha: "HEAD", // Scanning main/HEAD
        recursive: "true",
      });

      return data.tree
        .filter((item) => item.type === "blob")
        .map((item) => ({
          name: item.path?.split("/").pop() || "",
          path: item.path || "",
          type: "file",
        }));
    } catch (e) {
      return [];
    }
  }
}

class GitLabProvider implements GitProvider {
  private api: InstanceType<typeof Gitlab>;

  constructor(token: string) {
    const insecure = process.env.GITLAB_INSECURE === "true";
    this.api = new Gitlab({
      oauthToken: token,
      host: process.env.GITLAB_BASE_URL || "https://gitlab.com",
      ...(insecure && {
        requestOptions: {
          agent: new https.Agent({ rejectUnauthorized: false }),
        },
      }),
    });
  }

  async listRepos(): Promise<Repository[]> {
    const repos = await this.api.Projects.all({ membership: true, sort: 'desc', orderBy: 'updated_at' });
    return repos.map((repo: any) => ({
      name: repo.name,
      fullName: repo.path_with_namespace,
      url: repo.web_url,
      defaultBranch: repo.default_branch,
    }));
  }

  async getFile(repo: string, path: string): Promise<string | null> {
    try {
      const file: any = await this.api.RepositoryFiles.show(repo, path, "main"); // Adapting to default branch later
      return Buffer.from(file.content, "base64").toString("utf-8");
    } catch (e) {
      return null;
    }
  }

  async saveFile(repo: string, path: string, content: string, message: string): Promise<void> {
    try {
      await this.api.RepositoryFiles.edit(repo, path, "main", content, message);
    } catch (e) {
      await this.api.RepositoryFiles.create(repo, path, "main", content, message);
    }
  }

  async deleteFile(repo: string, path: string, message: string): Promise<void> {
    await this.api.RepositoryFiles.remove(repo, path, "main", message);
  }

  async listFiles(repo: string, path: string = ""): Promise<FileEntry[]> {
      try {
          const items = await (this.api.Repositories as any).tree(repo, { path });
          return items.map((item: any) => ({
              name: item.name,
              path: item.path,
              type: item.type === "tree" ? "dir" : "file"
          }));
      } catch (e) {
          return [];
      }
  }

  async scanRepo(repo: string): Promise<FileEntry[]> {
    try {
      const items = await (this.api.Repositories as any).tree(repo, { recursive: true });
      return items
        .filter((item: any) => item.type === "blob")
        .map((item: any) => ({
          name: item.name,
          path: item.path,
          type: "file",
        }));
    } catch (e) {
      return [];
    }
  }
}
