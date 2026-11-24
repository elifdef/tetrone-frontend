/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module '*.svg?react' {
    import type { ComponentType, SVGProps } from 'react';
    const ReactComponent: ComponentType<SVGProps<SVGSVGElement>>;
    export default ReactComponent;
}

interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_WS_URL?: string;
    readonly VITE_APP_NAME?: string;
    readonly VITE_MAX_FILE_SIZE_KB?: string;
    readonly VITE_APP_ENV?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}