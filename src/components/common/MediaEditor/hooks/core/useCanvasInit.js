import { useState, useEffect, useCallback } from 'react';
import { Canvas, FabricImage } from 'fabric';

function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }

export const useCanvasInit = ({ isOpen, file, canvasContainerRef, canvasRef, backgroundImageRef, initHistory, syncLayers, t, zoom }) => {
    const [canvas, setCanvas] = useState(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);

    const fitCanvasToContainer = useCallback((targetCanvas, targetZoom) => {
        const container = canvasContainerRef.current;
        if (!targetCanvas || !container) return;
        const width = Number(targetCanvas.getWidth()); const height = Number(targetCanvas.getHeight());
        const padding = window.innerWidth <= 768 ? 16 : 32;
        const aW = Math.max(100, container.clientWidth - padding);
        const aH = Math.max(100, container.clientHeight - padding);
        const fitScale = Math.min(aW / width, aH / height);
        const displayScale = fitScale * clamp(Number(targetZoom) || 1, 0.5, 2);

        targetCanvas.setDimensions({ width, height }, { backstoreOnly: true });
        targetCanvas.setDimensions({ width: `${width * displayScale}px`, height: `${height * displayScale}px` }, { cssOnly: true });
        targetCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]); targetCanvas.calcOffset(); targetCanvas.requestRenderAll();
    }, [canvasContainerRef]);

    const prepareBackground = useCallback((image) => {
        image.set({
            left: 0, top: 0, originX: "left", originY: "top", scaleX: 1, scaleY: 1,
            selectable: false, evented: false, hoverCursor: "default", isBackground: true,
            editorType: "background", name: t('media_editor.filter_original')
        });
        return image;
    }, [t]);

    useEffect(() => {
        if (!isOpen || !file || !canvasContainerRef.current) return;
        const container = canvasContainerRef.current; let cancelled = false; setIsCanvasReady(false);

        while (container.firstChild) container.removeChild(container.firstChild);
        const canvasElement = document.createElement("canvas"); canvasElement.tabIndex = 0; container.appendChild(canvasElement);
        const fabricCanvas = new Canvas(canvasElement, { selection: true, preserveObjectStacking: true, renderOnAddRemove: true, enableRetinaScaling: false, backgroundColor: "#1a1a1c", selectionColor: "rgba(91,155,213,0.1)", selectionBorderColor: "#5B9BD5", selectionLineWidth: 1 });
        canvasRef.current = fabricCanvas;

        const source = (() => {
            if (file instanceof File) return URL.createObjectURL(file);
            return typeof file === "string" ? file : (file?.url || file?.src);
        })();
        if (!source) return;

        const init = async () => {
            try {
                const image = await FabricImage.fromURL(source, { crossOrigin: "anonymous" });
                if (cancelled || !image) return;
                fabricCanvas.setDimensions({ width: image.width || 1, height: image.height || 1 }, { backstoreOnly: true });
                prepareBackground(image); fabricCanvas.add(image); fabricCanvas.sendObjectToBack(image);
                backgroundImageRef.current = image;

                initHistory(fabricCanvas);
                syncLayers(fabricCanvas);
                setCanvas(fabricCanvas); setIsCanvasReady(true);
                requestAnimationFrame(() => { if (!cancelled && container) fitCanvasToContainer(fabricCanvas, 1); });
            } catch (e) {}
        };
        init();

        return () => { cancelled = true; try { fabricCanvas.dispose(); } catch (e) {} if (container.contains(canvasElement)) container.removeChild(canvasElement); setCanvas(null); setIsCanvasReady(false); };
    }, [file, isOpen, prepareBackground, fitCanvasToContainer, initHistory, syncLayers, canvasContainerRef, canvasRef, backgroundImageRef]);

    return { canvas, isCanvasReady, fitCanvasToContainer };
};