import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProviders } from './providers/AppProviders';
import { APP_ENV } from '@/config';
import '@/i18n';
import '@/styles/global.css';

if (APP_ENV !== 'dev') {
    void import('@/utils/react-scan-init').then((module) => {
        module.initScanLogger();
    });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Root element #root not found');
}

ReactDOM.createRoot(rootElement).render(
    <AppProviders>
        <App />
    </AppProviders>
);
