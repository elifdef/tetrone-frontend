import { useState, useEffect, useRef, useCallback } from 'react';
import { FabricObject, FabricImage } from "fabric";
import { generateId } from '../constants';
import { useHistory } from './core/useHistory';
import { useLayers } from './core/useLayers';
import { useCanvasActions } from './core/useCanvasActions';
import { useCanvasInit } from './core/useCanvasInit';
import { useCensorEffect } from './useCensorEffect';

FabricObject.prototype.set({
    transparentCorners: false, cornerColor: '#ffffff', cornerStrokeColor: '#1a1a1c',
    cornerSize: 16, touchCornerSize: 24, cornerStyle: 'circle',
    borderColor: '#5B9BD5', borderScaleFactor: 2.5, padding: 10
});

export const useEditorCore = ({ isOpen, file, onSave, t }) => {
    const canvasContainerRef = useRef(null);
    const canvasRef = useRef(null);
    const backgroundImageRef = useRef(null);

    const [activeTool, setActiveTool] = useState("select");
    const [zoom, setZoom] = useState(1);
    const [selectedObject, setSelectedObject] = useState(null);

    const { historyRef, historySuspendedRef, pushHistory: _pushHistory, initHistory } = useHistory();
    const { layers, syncLayers, getLayerActions, activeFolderId } = useLayers(t);

    const pushHistory = useCallback((c) => _pushHistory(c, syncLayers), [_pushHistory, syncLayers]);
    const { canvas, isCanvasReady, fitCanvasToContainer } = useCanvasInit({ isOpen, file, canvasContainerRef, canvasRef, backgroundImageRef, initHistory, syncLayers, t, zoom });
    const layerActions = getLayerActions(canvas, pushHistory, historySuspendedRef);

    const getBackground = useCallback((targetCanvas) => {
        if (!targetCanvas) return null;
        return targetCanvas.getObjects().find(o => o.isBackground || o.editorType === "background") || targetCanvas.getObjects()[0];
    }, []);

    const { groupObjects, ungroupObjects, mergeGroup, deleteSelected, handleSave, addOverlayImage, rasterizeCurrentCanvas } = useCanvasActions({ canvas, t, historySuspendedRef, pushHistory, getBackground, zoom, canvasContainerRef });

    useCensorEffect(canvas, historySuspendedRef, pushHistory);

    useEffect(() => {
        if (!canvas) return;
        const isSelectTool = activeTool === "select";
        const isShapesTool = activeTool === "shapes";
        const isTextTool = activeTool === "text";

        canvas.selection = isSelectTool;

        canvas.getObjects().forEach(obj => {
            if (!obj.isBackground) {
                const canInteract = isSelectTool || isTextTool || isShapesTool;
                obj.evented = canInteract;
                obj.selectable = canInteract;
            }
        });

        canvas.defaultCursor = isShapesTool ? "crosshair" : "default";
        canvas.requestRenderAll();
    }, [activeTool, canvas]);

    useEffect(() => {
        if (!canvas) return;
        const onSel = () => { const act = canvas.getActiveObject(); setSelectedObject(act && act.editorType !== "background" ? act : null); };
        canvas.on("selection:created", onSel); canvas.on("selection:updated", onSel); canvas.on("selection:cleared", onSel);
        return () => { canvas.off("selection:created", onSel); canvas.off("selection:updated", onSel); canvas.off("selection:cleared", onSel); };
    }, [canvas]);

    const restoreHistory = useCallback(async (index) => {
        if (!canvas || !historyRef.current.stack[index]) return;
        try {
            historySuspendedRef.current = true;
            await canvas.loadFromJSON(historyRef.current.stack[index].json);
            const bg = getBackground(canvas); backgroundImageRef.current = bg;
            if (bg) { canvas.setDimensions({ width: bg.width || 1, height: bg.height || 1 }, { backstoreOnly: true }); fitCanvasToContainer(canvas, zoom); }
            canvas.discardActiveObject(); setSelectedObject(null);
            historyRef.current.index = index; historyRef.current.lastSignature = historyRef.current.stack[index].signature;
            historySuspendedRef.current = false; syncLayers(canvas); canvas.requestRenderAll();
        } catch (e) { historySuspendedRef.current = false; }
    }, [canvas, fitCanvasToContainer, getBackground, zoom, syncLayers, historyRef, historySuspendedRef]);

    const undo = useCallback(async () => { if (!canvas) return; pushHistory(canvas); const cur = historyRef.current.index; if (cur <= 0) return; await restoreHistory(cur - 1); }, [canvas, pushHistory, restoreHistory, historyRef]);
    const redo = useCallback(async () => { const cur = historyRef.current.index; if (cur >= historyRef.current.stack.length - 1) return; await restoreHistory(cur + 1); }, [restoreHistory, historyRef]);

    return {
        refs: { canvasContainerRef, historySuspendedRef, backgroundImageRef },
        state: { canvas, activeTool, zoom, layers, isCanvasReady, selectedObject, activeFolderId, canUndo: historyRef.current?.index > 0, canRedo: historyRef.current?.index < historyRef.current?.stack.length - 1 },
        actions: { setActiveTool, setZoomSafe: setZoom, undo, redo, pushHistory, fitCanvasToContainer, deleteSelected: () => deleteSelected(setSelectedObject), layerActions, getBackground, groupObjects, ungroupObjects, mergeGroup, handleSave: (fileObj, cb) => handleSave(fileObj, cb), addOverlayImage, rasterizeCurrentCanvas }
    };
};