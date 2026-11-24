export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface ApiBaseResponse {
    code?: string;
    message?: string;
    status: number;
    ok: boolean;
}

export interface ApiErrorResponse extends ApiBaseResponse {
    ok: false;
    errors?: Record<string, string[]>;
}

export type ApiResponse<T extends object = Record<string, unknown>> = T & ApiBaseResponse;

export interface ApiRequestHandle<T extends object = Record<string, unknown>> {
    onSuccess: (callback: (res: ApiResponse<T>) => void) => ApiRequestHandle<T>;
    onError: (callback: (err: ApiErrorResponse) => void) => ApiRequestHandle<T>;
    onFinally: (callback: () => void) => ApiRequestHandle<T>;
    then: <TResult1 = ApiResponse<T>, TResult2 = never>(
        onfulfilled?: ((value: ApiResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) => Promise<TResult1 | TResult2>;
    catch: <TResult = never>(
        onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
    ) => Promise<ApiResponse<T> | TResult>;
}