import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom, map, shareReplay, catchError, of } from 'rxjs';
import { AiFilterResult, Vendor, VendorFilter } from '../models/vendor';

interface AnthropicMessageResponse {
  content: { type: string; text: string }[];
  stop_reason?: string;
  model?: string;
}

@Injectable({ providedIn: 'root' })
export class AiAnalysisService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'https://api.anthropic.com/v1/messages';
  private readonly model = 'claude-3-5-sonnet-20241022';

  /**
   * The Anthropic key is read from a static asset at startup. This is a
   * **demo-only pattern** — in production the key should never be exposed to
   * the browser. Use a server-side proxy instead.
   */
  private apiKey$: Observable<string> | null = null;

  loadApiKey(): Observable<string> {
    if (!this.apiKey$) {
      // Try server endpoint (Heroku Config Var) first, fall back to asset file (local ng serve)
      this.apiKey$ = this.http
        .get('/api/config/anthropic-key', { responseType: 'text' })
        .pipe(
          catchError(() => this.http.get('assets/config/anthropic_key.txt', { responseType: 'text' })),
          catchError(() => of('')),
          map((raw) => raw.trim()),
          shareReplay(1),
        );
    }
    return this.apiKey$;
  }

  /** Build a compact context summary the model can use to ground its filter. */
  buildVendorContext(vendors: Vendor[]): string {
    const types = Array.from(new Set(vendors.map((v) => v.type))).sort();
    const specs = Array.from(
      new Set(vendors.flatMap((v) => v.specializations)),
    ).sort();
    const tags = Array.from(new Set(vendors.flatMap((v) => v.tags))).sort();
    const statuses = Array.from(
      new Set(vendors.map((v) => v.contractStatus)),
    ).sort();
    return [
      `Available vendor types: ${types.join(', ')}.`,
      `Available specializations: ${specs.join(', ')}.`,
      `Available contract statuses: ${statuses.join(', ')}.`,
      `Available tags: ${tags.join(', ')}.`,
      `Cost scale is an integer 1–4 (1 = lowest cost, 4 = highest). Reputation is a float 0–5.`,
    ].join('\n');
  }

  async analyze(query: string, vendors: Vendor[]): Promise<AiFilterResult> {
    const apiKey = await firstValueFrom(this.loadApiKey());
    if (!apiKey || apiKey.startsWith('REPLACE_')) {
      // graceful degradation: return a heuristic local filter so the demo still works
      return this.localHeuristicFilter(query);
    }

    const system = `You are VendorVault AI for KineMatix Group. Your job is to analyze a user's description of client needs and return a JSON filter object that maps to vendor attributes. Only return valid JSON — no explanation, no markdown fences. The filter object may contain any combination of: type (string), costScale (object with min/max integers 1–4), reputation (object with min float), specializations (array of strings to match against vendor specializations), contractStatus (string), tags (array of strings). Only include fields that are directly relevant to the query. After the JSON object, on a new line, include a single plain-English sentence summarizing what was filtered — prefix it with SUMMARY: so it can be parsed separately.`;

    const userMessage = `Catalog context:\n${this.buildVendorContext(vendors)}\n\nUser query: "${query}"\n\nRespond with the JSON filter on the first line(s), then SUMMARY: <one sentence>.`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    });

    const body = {
      model: this.model,
      max_tokens: 800,
      system,
      messages: [{ role: 'user', content: userMessage }],
    };

    const response = await firstValueFrom(
      this.http.post<AnthropicMessageResponse>(this.endpoint, body, { headers }),
    );

    const raw =
      response.content?.find((block) => block.type === 'text')?.text ?? '';
    return this.parseModelOutput(raw);
  }

  parseModelOutput(raw: string): AiFilterResult {
    let summary = '';
    let jsonText = raw.trim();

    // pull SUMMARY: line out
    const summaryMatch = raw.match(/SUMMARY:\s*(.+?)(?:\n|$)/is);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
      jsonText = raw.replace(summaryMatch[0], '').trim();
    }

    // strip accidental markdown fences
    jsonText = jsonText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // grab the first {...} block in case the model wrote prose around it
    const braceMatch = jsonText.match(/\{[\s\S]*\}/);
    if (braceMatch) jsonText = braceMatch[0];

    let filter: VendorFilter = {};
    try {
      filter = JSON.parse(jsonText) as VendorFilter;
    } catch {
      filter = {};
    }

    if (!summary) {
      summary = 'Showing vendors matching the AI-derived filter.';
    }

    return { filter, summary, raw };
  }

  /**
   * Lightweight client-side filter so the demo remains usable when no API key
   * is configured. It looks for keyword cues in the user query.
   */
  localHeuristicFilter(query: string): AiFilterResult {
    const q = query.toLowerCase();
    const filter: VendorFilter = {};
    const summaryParts: string[] = [];

    const specMap: Array<[RegExp, string]> = [
      [/cybersec|security|threat|endpoint/, 'Cybersecurity'],
      [/identity|sso|iam|zero trust/, 'Identity'],
      [/cloud storage|object storage/, 'Cloud Storage'],
      [/backup|recovery|disaster/, 'Backup & Recovery'],
      [/network|sd-wan|sdwan/, 'Networking'],
      [/compliance|regulatory|audit/, 'Compliance'],
      [/analytics|bi |business intelligence/, 'Business Intelligence'],
      [/ai|ml|machine learning/, 'ML/AI Platform'],
    ];
    const matchedSpecs = specMap
      .filter(([re]) => re.test(q))
      .map(([, label]) => label);
    if (matchedSpecs.length) {
      filter.specializations = matchedSpecs;
      summaryParts.push(`specializing in ${matchedSpecs.join(' / ')}`);
    }

    if (/low cost|cheap|inexpensive|budget/.test(q)) {
      filter.costScale = { max: 2 };
      summaryParts.push('cost scale ≤ 2');
    } else if (/high cost|premium|expensive/.test(q)) {
      filter.costScale = { min: 3 };
      summaryParts.push('cost scale ≥ 3');
    } else if (/mid|medium/.test(q)) {
      filter.costScale = { min: 2, max: 3 };
      summaryParts.push('mid-range cost');
    }

    if (/high reputation|top rated|highly rated|reputation above/.test(q)) {
      filter.reputation = { min: 4 };
      summaryParts.push('reputation ≥ 4.0');
    }

    if (/active contract/.test(q)) {
      filter.contractStatus = 'Active';
      summaryParts.push('active contracts');
    } else if (/prospect/.test(q)) {
      filter.contractStatus = 'Prospect';
      summaryParts.push('prospects only');
    }

    if (/hardware/.test(q)) {
      filter.type = 'Hardware';
      summaryParts.push('hardware vendors');
    } else if (/services/.test(q)) {
      filter.type = 'Services';
      summaryParts.push('services vendors');
    } else if (/hybrid/.test(q)) {
      filter.type = 'Hybrid';
      summaryParts.push('hybrid vendors');
    } else if (/software/.test(q)) {
      filter.type = 'Software';
      summaryParts.push('software vendors');
    }

    const summary = summaryParts.length
      ? `Showing ${summaryParts.join(', ')} (heuristic filter — no Anthropic API key configured to save cost - This can be enabled upon request)`
      : 'No specific filter applied — showing the full catalog. Add an Anthropic API key to enable richer matching.';

    return { filter, summary, raw: '' };
  }
}
