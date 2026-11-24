import i18next from 'i18next';
import { API_URL, APP_ENV } from '../config';
import { notifyError, notifySuccess } from '../components/common/Notify';
import { extractDebugAttachments, isTetroneDebugEnabled } from '../utils/debug';
import type { ApiErrorResponse, ApiRequestHandle, ApiResponse } from '@/types/api';

export interface FetchClientOptions extends Omit<RequestInit, 'body' | 'headers'> {
    body?: Record<string, unknown> | FormData | string | null;
    headers?: Record<string, string>;
    silentAuth?: boolean;
    silent?: boolean;
    silentSuccess?: boolean;
    silentError?: boolean;
    showSuccessToast?: boolean;
}

const PASSIVE_SUCCESS_CODES = new Set([
    'CHAT_READ',
    'ALL_CHATS_READ',
    'NOTIFICATION_READ',
    'SCREEN_TIME_SYNCED',
    'ALIAS_AVAILABLE',
    'MESSAGE_SENT',
]);

function resolveErrorMessage(code?: string, fallbackMessage?: string): string {
    if (code && i18next.isInitialized) {
        if (i18next.exists(`code.${code}`)) {
            return i18next.t(`code.${code}`);
        }
    }
    if (fallbackMessage && fallbackMessage.trim()) {
        return fallbackMessage;
    }
    return i18next.isInitialized ? i18next.t('error.action_failed') : 'error.action_failed';
}

function resolveSuccessMessage(code?: string, forceFallback = false): string | null {
    if (code && i18next.isInitialized) {
        if (i18next.exists(`code.${code}`)) {
            return i18next.t(`code.${code}`);
        }
    }
    if (!forceFallback) {
        return null;
    }
    return i18next.isInitialized ? i18next.t('success.changes_saved') : 'success.changes_saved';
}

class ApiRequest<T extends object = Record<string, unknown>> implements ApiRequestHandle<T> {
    private promise: Promise<ApiResponse<T>>;

    constructor(promise: Promise<ApiResponse<T>>) {
        this.promise = promise;
    }

    onSuccess(callback: (res: ApiResponse<T>) => void): ApiRequestHandle<T> {
        this.promise = this.promise.then((res) => {
            const isSuccess = Boolean(res && res.ok && !res.code?.startsWith('ERR_'));
            if (isSuccess) {
                callback(res);
            }
            return res;
        });
        return this;
    }

    onError(callback: (err: ApiErrorResponse) => void): ApiRequestHandle<T> {
        this.promise = this.promise.then((res) => {
            const isError = !res || !res.ok || Boolean(res.code?.startsWith('ERR_')) || res.status === 0;
            if (isError) {
                callback(res as ApiErrorResponse);
            }
            return res;
        });
        return this;
    }

    onFinally(callback: () => void): ApiRequestHandle<T> {
        this.promise = this.promise.finally(callback);
        return this;
    }

    then<TResult1 = ApiResponse<T>, TResult2 = never>(
        onfulfilled?: ((value: ApiResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
        return this.promise.then(onfulfilled, onrejected);
    }

    catch<TResult = never>(
        onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
    ): Promise<ApiResponse<T> | TResult> {
        return this.promise.catch(onrejected);
    }
}

export default function fetchClient<T extends object = Record<string, unknown>>(
    endpoint: string,
    {
        method = 'GET',
        body,
        headers: customHeaders,
        silentAuth = false,
        silent = false,
        silentSuccess = false,
        silentError = false,
        showSuccessToast = false,
        ...customConfig
    }: FetchClientOptions = {}
): ApiRequestHandle<T> {
    const normalizedMethod = method.toUpperCase();
    const headers: Record<string, string> = { Accept: 'application/json' };
    const debugEnabled = isTetroneDebugEnabled();

    if (debugEnabled) {
        headers['X-Tetrone-Debug'] = '1';
    }

    if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
        method: normalizedMethod,
        headers: { ...headers, ...customHeaders },
        credentials: 'include',
        ...customConfig,
    };

    if (body && !(body instanceof FormData)) {
        config.body = typeof body === 'string' ? body : JSON.stringify(body);
    } else if (body instanceof FormData) {
        config.body = body;
    }

    const requestPromise = fetch(`${API_URL}${endpoint}`, config)
        .then(async (response): Promise<ApiResponse<T>> => {
            let data: Record<string, unknown> = {};

            if (response.status !== 204) {
                try {
                    const parsed: unknown = await response.json();
                    if (parsed && typeof parsed === 'object') {
                        data = parsed as Record<string, unknown>;
                    }
                } catch (error) {
                    if (APP_ENV === 'dev') {
                        console.log('Error JSON parse', error);
                    }
                    data = { code: 'CRITICAL_SERVER_ERROR' };
                }
            }

            const traceId = response.headers.get('X-Tetrone-Trace-Id');
            const traceMs = response.headers.get('X-Tetrone-Trace-Ms');

            if (debugEnabled && traceId && !endpoint.startsWith('/debug/traces')) {
                window.dispatchEvent(
                    new CustomEvent('tetrone:trace-captured', {
                        detail: {
                            trace_id: traceId,
                            method: normalizedMethod,
                            path: `/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
                            status: response.status,
                            duration_ms: traceMs ? Number(traceMs) : null,
                        },
                    })
                );
            }

            const responseData = {
                ...data,
                status: response.status,
                ok: response.ok,
            } as ApiResponse<T>;

            if (debugEnabled && responseData.ok && ['POST', 'PUT', 'PATCH'].includes(normalizedMethod)) {
                const mediaList = extractDebugAttachments(responseData);
                if (mediaList.length > 0) {
                    window.dispatchEvent(
                        new CustomEvent('tetrone:media-debug-batch', { detail: mediaList })
                    );
                }
            }

            const responseCode = typeof data.code === 'string' ? data.code : undefined;
            const rawMessage = typeof data.message === 'string' ? data.message : undefined;
            const isSuccess = responseData.ok && !responseCode?.startsWith('ERR_');

            if (!silentAuth) {
                if (response.status === 401 && responseCode !== 'ERR_INVALID_CREDENTIALS') {
                    window.dispatchEvent(new CustomEvent('session-expired'));
                } else if (response.status === 503) {
                    window.dispatchEvent(new CustomEvent('server-maintenance'));
                } else if (response.status >= 500 || responseCode === 'CRITICAL_SERVER_ERROR') {
                    window.dispatchEvent(new CustomEvent('server-error'));
                }
            }

            if (isSuccess) {
                const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalizedMethod);
                const isReadOrPassiveCode = Boolean(
                    responseCode &&
                        (responseCode.endsWith('_RETRIEVED') ||
                            responseCode.endsWith('_LOADED') ||
                            PASSIVE_SUCCESS_CODES.has(responseCode))
                );

                if (
                    !silent &&
                    !silentSuccess &&
                    (showSuccessToast || (isMutating && !isReadOrPassiveCode))
                ) {
                    const successText = resolveSuccessMessage(responseCode, showSuccessToast);
                    if (successText) {
                        notifySuccess(successText);
                    }
                }
            } else {
                const isSessionRedirect =
                    !silentAuth &&
                    response.status === 401 &&
                    responseCode !== 'ERR_INVALID_CREDENTIALS';

                if (!silent && !silentError && !isSessionRedirect) {
                    notifyError(resolveErrorMessage(responseCode, rawMessage));
                }
            }

            if (APP_ENV === 'dev') {
                if (isSuccess) {
                    console.log(`API Success [${normalizedMethod} ${endpoint}]`, responseData);
                } else {
                    console.error(`API Error [${normalizedMethod} ${endpoint}] Status: ${response.status}`, responseData);
                }
            }

            return responseData;
        })
        .catch((error: unknown): ApiResponse<T> => {
            const errorData = {
                status: 0,
                code: 'ERR_NETWORK',
                ok: false,
            } as ApiResponse<T>;

            if (APP_ENV === 'dev') {
                console.error(`Network/CORS Error [${normalizedMethod} ${endpoint}]`, error);
            }

            if (!silentAuth) {
                window.dispatchEvent(new CustomEvent('server-offline'));
            }

            if (!silent && !silentError) {
                notifyError(resolveErrorMessage('ERR_NETWORK'));
            }

            return errorData;
        });

    return new ApiRequest<T>(requestPromise);
}