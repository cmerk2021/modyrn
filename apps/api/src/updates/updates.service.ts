import { Injectable, Logger } from '@nestjs/common';

export interface UpdateStatus {
  current: string;
  latest: string | null;
  updateAvailable: boolean;
  releaseUrl: string | null;
  publishedAt: string | null;
  notes: string | null;
}

const REPO = 'modyrn/modyrn';

/** Reports the running version and checks GitHub for newer releases. */
@Injectable()
export class UpdatesService {
  private readonly logger = new Logger(UpdatesService.name);
  private cache: { at: number; status: UpdateStatus } | null = null;

  async getStatus(): Promise<UpdateStatus> {
    const current = process.env.APP_VERSION ?? '0.0.0-dev';

    // Cache the GitHub lookup for 30 minutes to respect rate limits.
    if (this.cache && Date.now() - this.cache.at < 30 * 60_000) {
      return { ...this.cache.status, current };
    }

    let status: UpdateStatus = {
      current,
      latest: null,
      updateAvailable: false,
      releaseUrl: null,
      publishedAt: null,
      notes: null,
    };

    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'modyrn' },
      });
      if (res.ok) {
        const release = (await res.json()) as {
          tag_name: string;
          html_url: string;
          published_at: string;
          body: string;
        };
        const latest = release.tag_name.replace(/^v/, '');
        status = {
          current,
          latest,
          updateAvailable: this.isNewer(latest, current),
          releaseUrl: release.html_url,
          publishedAt: release.published_at,
          notes: release.body?.slice(0, 4000) ?? null,
        };
      }
    } catch (error) {
      this.logger.warn(`Update check failed: ${String(error)}`);
    }

    this.cache = { at: Date.now(), status };
    return status;
  }

  /** Semver-ish comparison: is `a` newer than `b`? */
  private isNewer(a: string, b: string): boolean {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      const x = pa[i] ?? 0;
      const y = pb[i] ?? 0;
      if (x > y) return true;
      if (x < y) return false;
    }
    return false;
  }
}
