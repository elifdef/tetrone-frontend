import {API_URL, APP_ENV} from "../config.js";
import {extractDebugAttachments, isTetroneDebugEnabled} from "../utils/debug.js";

class ApiRequest
{
    constructor(promise)
    {
        this.promise = promise;
    }

    onSuccess(callback)
    {
        this.promise = this.promise.then(res =>
        {
            const isSuccess = res && res.ok && !res.code?.startsWith('ERR_');
            if (isSuccess) callback(res);
            return res;
        });
        return this;
    }

    onError(callback)
    {
        this.promise = this.promise.then(res =>
        {
            const isError = !res || !res.ok || res.code?.startsWith('ERR_') || res.status === 0;
            if (isError) callback(res);
            return res;
        });
        return this;
    }

    onFinally(callback)
    {
        this.promise = this.promise.finally(callback);
        return this;
    }

    then(resolve, reject)
    {
        return this.promise.then(resolve, reject);
    }

    catch(reject)
    {
        return this.promise.catch(reject);
    }
}

export default function fetchClient(endpoint, {
    method = 'GET', body, headers: customHeaders, ...customConfig
} = {})
{
    const headers = {'Accept': 'application/json'};
    const debugEnabled = isTetroneDebugEnabled();

    if (debugEnabled)
    {
        headers['X-Tetrone-Debug'] = '1';
    }

    if (body && !(body instanceof FormData))
    {
        headers['Content-Type'] = 'application/json';
    }

    const silentAuth = customConfig.silentAuth || false;
    delete customConfig.silentAuth;

    const config = {
        method, headers: {...headers, ...customHeaders}, credentials: 'include', ...customConfig
    };

    if (body && !(body instanceof FormData))
    {
        config.body = JSON.stringify(body);
    } else if (body)
    {
        config.body = body;
    }

    const requestPromise = fetch(`${API_URL}${endpoint}`, config)
    .then(async (response) =>
    {
        let data = {};

        if (response.status !== 204)
        {
            try
            {
                data = await response.json();
            } catch (error)
            {
                if (APP_ENV === 'dev') console.log("Error JSON parse", error);
                data = {code: 'CRITICAL_SERVER_ERROR'};
            }
        }

        const traceId = response.headers.get('X-Tetrone-Trace-Id');
        const traceMs = response.headers.get('X-Tetrone-Trace-Ms');

        if (debugEnabled && traceId && !endpoint.startsWith('/debug/traces'))
        {
            window.dispatchEvent(
                new CustomEvent('tetrone:trace-captured', {
                    detail: {
                        trace_id: traceId,
                        method: method.toUpperCase(),
                        path: `/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
                        status: response.status,
                        duration_ms: traceMs ? Number(traceMs) : null,
                    }
                })
            );
        }

        // ФІКС: Додали ok: response.ok
        const Data = {...data, status: response.status, ok: response.ok};

        if (debugEnabled && Data.ok && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()))
        {
            const mediaList = extractDebugAttachments(Data);
            if (mediaList.length > 0)
            {
                window.dispatchEvent(
                    new CustomEvent('tetrone:media-debug-batch', {detail: mediaList})
                );
            }
        }

        if (!silentAuth)
        {
            if (response.status === 401 && data.code !== 'ERR_INVALID_CREDENTIALS')
            {
                window.dispatchEvent(new CustomEvent('session-expired'));
            } else if (response.status === 503)
            {
                window.dispatchEvent(new CustomEvent('server-maintenance'));
            } else if (response.status >= 500 || data.code === 'CRITICAL_SERVER_ERROR')
            {
                window.dispatchEvent(new CustomEvent('server-error'));
            }
        }

        if (APP_ENV === 'dev')
        {
            if (Data.ok && !data.code?.startsWith('ERR_'))
            {
                console.log(`API Success [${method} ${endpoint}]`, Data);
            } else
            {
                console.error(`API Error [${method} ${endpoint}] Status: ${response.status}`, Data);
            }
        }

        return Data;
    })
    .catch((error) =>
    {
        const errorData = {status: 0, code: 'ERR_NETWORK', ok: false};

        if (APP_ENV === 'dev') console.error(`Network/CORS Error [${method} ${endpoint}]`, error);

        if (!silentAuth)
        {
            window.dispatchEvent(new CustomEvent('server-offline'));
        }

        return errorData;
    });

    return new ApiRequest(requestPromise);
}