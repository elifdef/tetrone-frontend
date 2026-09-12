import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { SocketProvider } from './context/SocketContext.jsx';
import './i18n'

import "./styles/global.css";

import {ThemeProvider} from "./context/ThemeContext.jsx";
import {APP_ENV} from "./config.js";

if (APP_ENV === 'dev')
{
    import('/src/utils/react-scan-init.js').then((module) =>
    {
        module.initScanLogger();
    });
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false, // Не робити запит, коли юзер згорнув/розгорнув браузер
            staleTime: 1000 * 60,        // Дані вважаються "свіжими" 1 хвилину
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <QueryClientProvider client={ queryClient }>
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <SocketProvider>
                        <NotificationProvider>
                            <ModalProvider>
                                <App/>
                            </ModalProvider>
                        </NotificationProvider>
                    </SocketProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    </QueryClientProvider>
);