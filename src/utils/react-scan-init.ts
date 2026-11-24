import { scan } from 'react-scan';

declare global {
    interface Window {
        downloadReactLogs?: () => void;
    }
}

interface RenderLogEntry {
    component: string;
    time: string;
}

export function initScanLogger(): void {
    const renderLogs: RenderLogEntry[] = [];

    if (typeof window !== 'undefined') {
        scan({
            enabled: true,
            onRender: (fiber) => {
                const fiberType = fiber.type as { name?: string } | null | undefined;
                const componentName = fiberType?.name || 'Anonymous';

                renderLogs.push({
                    component: componentName,
                    time: new Date().toISOString(),
                });
            },
        });

        window.downloadReactLogs = () => {
            const summary = renderLogs.reduce<Record<string, number>>((acc, log) => {
                acc[log.component] = (acc[log.component] || 0) + 1;
                return acc;
            }, {});

            const fileContent = JSON.stringify({ summary, fullLog: renderLogs }, null, 2);
            const blob = new Blob([fileContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'react-scan-report.json';
            a.click();

            URL.revokeObjectURL(url);
            console.log('Логи успішно збережено у файл!');
        };
    }
}