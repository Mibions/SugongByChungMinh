export type ApiClientOptions = {
  baseUrl: string;
};

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      headers: { Accept: "application/json" },
      signal,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }
}
