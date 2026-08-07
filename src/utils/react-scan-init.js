// src/react-scan-logger.js
import { scan } from 'react-scan';

export function initScanLogger() {
    // Масив, де будуть зберігатися всі логи
    const renderLogs = [];

    if (typeof window !== 'undefined') {
        scan({
            enabled: true,
            onRender: (fiber) => {
                const componentName = fiber.type?.name || 'Anonymous';

                // Записуємо кожен рендер у масив
                renderLogs.push({
                    component: componentName,
                    time: new Date().toISOString(),
                });
            }
        });

        // Робимо функцію глобальною, щоб її можна було викликати з консолі браузера
        window.downloadReactLogs = () => {
            // 1. Групуємо, щоб побачити, хто рендерився найбільше
            const summary = renderLogs.reduce((acc, log) => {
                acc[log.component] = (acc[log.component] || 0) + 1;
                return acc;
            }, {});

            const fileContent = JSON.stringify({ summary, fullLog: renderLogs }, null, 2);

            // 2. Створюємо файл у пам'яті браузера
            const blob = new Blob([fileContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // 3. Імітуємо клік по посиланню для скачування
            const a = document.createElement('a');
            a.href = url;
            a.download = 'react-scan-report.json';
            a.click();

            URL.revokeObjectURL(url);
            console.log('Логи успішно збережено у файл!');
        };
    }
}