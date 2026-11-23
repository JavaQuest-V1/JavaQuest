/**
 * Cliente HTTP/REST único do front Next.js para o backend Java Spring Boot
 * (RNF-02, RNF-03, RNF-10, RNF-13, RNF-21).
 *
 * - Lê a URL base de `NEXT_PUBLIC_API_URL`. Sem URL, o app roda em modo Sandbox.
 * - Guarda o JWT emitido pelo backend e envia `Authorization: Bearer <JWT>`
 *   em todas as chamadas (plataforma e gameplay usam o mesmo cliente).
 * - Tenta de novo em falhas de rede e publica o status de conexão
 *   (ONLINE / RECONNECTING / OFFLINE / SANDBOX) para o banner de reconexão.
 * - Em HTTP 401, descarta o token e avisa quem estiver ouvindo (sessão expirada).
 */

export type ConnectionStatus = "ONLINE" | "RECONNECTING" | "OFFLINE" | "SANDBOX";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiClientConfig {
  baseUrl?: string;
  /** `undefined` mantém o token atual; `null` remove o token. */
  authToken?: string | null;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}

export interface RequestOptions<TBody> {
  method?: HttpMethod;
  body?: TBody;
  retries?: number;
  timeoutMs?: number;
  /** Rotas públicas (ex.: login) não enviam o JWT. */
  auth?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Erros 4xx são respostas do servidor (regra de negócio); não adianta repetir. */
  get isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
}

const TOKEN_STORAGE_KEY = "javaquest_jwt";

function readStoredToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeStoredToken(token: string | undefined): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // sessionStorage indisponível (modo privado restrito): segue só em memória
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  if (!text) return `Erro HTTP ${response.status} ao comunicar com o servidor Java.`;
  try {
    // Formatos comuns do Spring Boot: { message } ou { erro } ou { detail } (ProblemDetail)
    const json = JSON.parse(text) as Record<string, unknown>;
    const msg = json.message ?? json.erro ?? json.detail ?? json.error;
    if (typeof msg === "string" && msg.trim()) return msg;
  } catch {
    // corpo não é JSON
  }
  return text;
}

export class ApiClient {
  private baseUrl: string | undefined;
  private authToken: string | undefined;
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private unauthorizedListeners = new Set<() => void>();
  private currentStatus: ConnectionStatus = "SANDBOX";

  constructor(config?: ApiClientConfig) {
    this.configure(config ?? {});
  }

  public configure(config: ApiClientConfig): void {
    const envUrl =
      typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined;
    const resolvedUrl = (config.baseUrl ?? envUrl ?? "").trim().replace(/\/+$/, "");
    this.baseUrl = resolvedUrl.length > 0 ? resolvedUrl : undefined;

    if (config.authToken !== undefined) {
      this.setAuthToken(config.authToken ?? undefined);
    } else if (!this.authToken) {
      this.authToken = readStoredToken();
    }

    if (config.onConnectionStatusChange) {
      this.statusListeners.add(config.onConnectionStatusChange);
    }

    this.setStatus(this.baseUrl ? "ONLINE" : "SANDBOX");
  }

  /** true quando `NEXT_PUBLIC_API_URL` está configurada (backend Java ativo). */
  public isApiMode(): boolean {
    return Boolean(this.baseUrl);
  }

  public getAuthToken(): string | undefined {
    return this.authToken;
  }

  public setAuthToken(token: string | undefined): void {
    this.authToken = token || undefined;
    writeStoredToken(this.authToken);
  }

  public clearAuthToken(): void {
    this.setAuthToken(undefined);
  }

  public getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  public subscribeStatus(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /** Avisado quando o backend responde 401 (JWT expirado ou inválido). */
  public onUnauthorized(listener: () => void): () => void {
    this.unauthorizedListeners.add(listener);
    return () => {
      this.unauthorizedListeners.delete(listener);
    };
  }

  private setStatus(next: ConnectionStatus): void {
    if (this.currentStatus === next) return;
    this.currentStatus = next;
    for (const listener of this.statusListeners) {
      listener(next);
    }
  }

  public async requestJson<TResponse, TBody = unknown>(
    path: string,
    options: RequestOptions<TBody> = {}
  ): Promise<TResponse> {
    if (!this.baseUrl) {
      throw new ApiError("API REST não configurada (modo Sandbox ativo).", 0);
    }

    const { method = "GET", body, retries = 1, timeoutMs = 4500, auth = true } = options;
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        this.setStatus("RECONNECTING");
        await new Promise((resolve) => setTimeout(resolve, 450 * attempt));
      }

      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const headers: Record<string, string> = { Accept: "application/json" };
        if (body !== undefined) headers["Content-Type"] = "application/json";
        if (auth && this.authToken) headers.Authorization = `Bearer ${this.authToken}`;

        const response = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutHandle);

        if (!response.ok) {
          if (response.status === 401 && auth) {
            this.clearAuthToken();
            for (const listener of this.unauthorizedListeners) listener();
          }
          throw new ApiError(await readErrorMessage(response), response.status);
        }

        this.setStatus("ONLINE");

        // 204 No Content ou corpo vazio (ex.: endpoints de métricas que retornam void)
        if (response.status === 204) return undefined as TResponse;
        const text = await response.text();
        return (text ? JSON.parse(text) : undefined) as TResponse;
      } catch (err) {
        clearTimeout(timeoutHandle);
        lastError = err;
        if (err instanceof ApiError && err.isClientError) {
          this.setStatus("ONLINE");
          throw err;
        }
      }
    }

    this.setStatus("OFFLINE");
    throw lastError instanceof ApiError
      ? lastError
      : new ApiError("Falha de rede ao comunicar com o backend Java.", 503);
  }
}

/** Instância única compartilhada por todos os @services do front. */
export const apiClient = new ApiClient();
