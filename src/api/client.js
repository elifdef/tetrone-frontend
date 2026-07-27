import { API_URL, APP_ENV } from "../config.js";

export default async function fetchClient(endpoint, {
    method = 'GET', body, headers: customHeaders, ...customConfig
} = {})
{
    const headers = { 'Accept': 'application/json' };

    if (body && !(body instanceof FormData))
    {
        headers['Content-Type'] = 'application/json';
    }

    const silentAuth = customConfig.silentAuth || false;
    delete customConfig.silentAuth;

    const config = {
        method, headers: { ...headers, ...customHeaders }, credentials: 'include', ...customConfig
    };

    if (body && !(body instanceof FormData))
    {
        config.body = JSON.stringify(body);
    }
    else if (body)
    {
        config.body = body;
    }

    try
    {
        const response = await fetch(`${ API_URL }${ endpoint }`, config);
        let data = {};

        if (response.status !== 204)
        {
            try
            {
                data = await response.json();
            } catch (error)
            {
                if (APP_ENV === 'dev')
                {
                    console.log("Error JSON parse", error);
                }
                data = { code: 'CRITICAL_SERVER_ERROR' };
            }
        }

        const Data = { ...data, status: response.status };

        if (!silentAuth)
        {
            if (response.status === 401 && data.code !== 'ERR_INVALID_CREDENTIALS')
            {
                window.dispatchEvent(new CustomEvent('session-expired'));
            }
            else if (response.status === 503)
            {
                // Сервер на обслуговуванні
                window.dispatchEvent(new CustomEvent('server-maintenance'));
            }
            else if (response.status >= 500 || data.code === 'CRITICAL_SERVER_ERROR')
            {
                // Фатальна помилка бекенда
                window.dispatchEvent(new CustomEvent('server-error'));
            }
        }

        if (APP_ENV === 'dev')
        {
            if (response.ok)
            {
                console.log(`API Success [${ method } ${ endpoint }]`, Data);
            }
            else
            {
                console.error(`API Error [${ method } ${ endpoint }] Status: ${ response.status }`, Data);
            }
        }

        return Data;

    } catch (error)
    {
        const errorData = { status: 0, code: 'ERR_NETWORK' };

        if (APP_ENV === 'dev')
        {
            console.error(`Network/CORS Error [${ method } ${ endpoint }]`, error);
        }

        // Помилка мережі (бекенд вимкнений / впав інтернет)
        if (!silentAuth)
        {
            window.dispatchEvent(new CustomEvent('server-offline'));
        }

        return errorData;
    }
}