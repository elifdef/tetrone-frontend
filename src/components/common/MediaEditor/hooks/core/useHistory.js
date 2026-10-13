import { useRef, useCallback } from 'react';

const REQUIRED_PROPS = ['id', 'editorType', 'name', 'folderId', 'lockRotation', 'isBackground', 'previewRect', 'blurIntensity'];

export const useHistory = () => {
    const historyRef = useRef({ stack: [], index: -1, lastSignature: "" });
    const historySuspendedRef = useRef(false);

    const serializeCanvas = useCallback((targetCanvas) => {
        if (!targetCanvas) return null;
        return targetCanvas.toJSON(REQUIRED_PROPS);
    }, []);

    const pushHistory = useCallback((targetCanvas, onSync) => {
        if (!targetCanvas || historySuspendedRef.current) return;
        const json = serializeCanvas(targetCanvas);
        const signature = JSON.stringify(json);
        if (historyRef.current.lastSignature === signature) return;

        const stack = historyRef.current.stack.slice(0, historyRef.current.index + 1);
        stack.push({ json, signature });
        if (stack.length > 30) stack.shift();

        historyRef.current = { stack, index: stack.length - 1, lastSignature: signature };
        if (onSync) onSync(targetCanvas);
    }, [serializeCanvas]);

    const initHistory = useCallback((targetCanvas) => {
        if (!targetCanvas) return;
        historySuspendedRef.current = true;
        const initialJson = serializeCanvas(targetCanvas);
        historyRef.current = { stack: [{ json: initialJson, signature: JSON.stringify(initialJson) }], index: 0, lastSignature: JSON.stringify(initialJson) };
        historySuspendedRef.current = false;
    }, [serializeCanvas]);

    return { historyRef, historySuspendedRef, pushHistory, initHistory };
};