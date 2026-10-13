import { useCallback } from 'react';
import { ActiveSelection, Group, FabricImage } from 'fabric';
import { generateId } from '../../constants';

export const useCanvasActions = ({ canvas, t, historySuspendedRef, pushHistory, getBackground }) => {
    const groupObjects = useCallback(() => {
        if (!canvas) return; const activeObj = canvas.getActiveObject();
        if (!(activeObj instanceof ActiveSelection)) return;
        historySuspendedRef.current = true; activeObj.toGroup();
        const newGroup = canvas.getActiveObject(); newGroup.set({ id: generateId(), name: t('media_editor.layer_shape') });
        historySuspendedRef.current = false; canvas.requestRenderAll(); pushHistory(canvas);
    }, [canvas, pushHistory, t, historySuspendedRef]);

    const ungroupObjects = useCallback(() => {
        if (!canvas) return; const activeObj = canvas.getActiveObject();
        if (!(activeObj instanceof Group)) return;
        historySuspendedRef.current = true; activeObj.toActiveSelection();
        historySuspendedRef.current = false; canvas.requestRenderAll(); pushHistory(canvas);
    }, [canvas, pushHistory, historySuspendedRef]);

    const mergeGroup = useCallback(async () => {
        if (!canvas) return; const activeObj = canvas.getActiveObject();
        if (!activeObj || !(activeObj instanceof Group)) return;
        historySuspendedRef.current = true;
        const dataUrl = activeObj.toDataURL({ format: 'png', multiplier: 2 });
        try {
            const img = await FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
            img.set({
                left: activeObj.left, top: activeObj.top, originX: activeObj.originX, originY: activeObj.originY,
                scaleX: activeObj.scaleX / 2, scaleY: activeObj.scaleY / 2,
                id: generateId(), name: t('media_editor.layer_image'), editorType: 'image'
            });
            canvas.remove(activeObj); canvas.add(img); canvas.setActiveObject(img);
        } catch (e) {}
        historySuspendedRef.current = false; canvas.requestRenderAll(); pushHistory(canvas);
    }, [canvas, pushHistory, t, historySuspendedRef]);

    const deleteSelected = useCallback((setSelectedObject) => {
        if (!canvas) return; const bg = getBackground(canvas);
        const objs = canvas.getActiveObjects().filter(o => o !== bg);
        if (!objs.length) return;
        historySuspendedRef.current = true; canvas.discardActiveObject(); objs.forEach(o => canvas.remove(o));
        historySuspendedRef.current = false; if(setSelectedObject) setSelectedObject(null);
        canvas.requestRenderAll(); pushHistory(canvas);
    }, [canvas, getBackground, pushHistory, historySuspendedRef]);

    return { groupObjects, ungroupObjects, mergeGroup, deleteSelected };
};