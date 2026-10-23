import { useCallback } from 'react';
import { ActiveSelection, Group, FabricImage } from 'fabric';
import { generateId } from '../../constants';
import { toPng } from 'html-to-image';

export const useCanvasActions = ({ canvas, t, historySuspendedRef, pushHistory, getBackground }) => {
    const groupObjects = useCallback(() => {
        if (!canvas) return;
        const activeObj = canvas.getActiveObject();
        if (!(activeObj instanceof ActiveSelection)) return;
        historySuspendedRef.current = true;
        activeObj.toGroup();
        const newGroup = canvas.getActiveObject();
        newGroup.set({ id: generateId(), name: t('media_editor.layer_shape') });
        historySuspendedRef.current = false;
        canvas.requestRenderAll();
        pushHistory(canvas);
    }, [canvas, pushHistory, t, historySuspendedRef]);

    const ungroupObjects = useCallback(() => {
        if (!canvas) return;
        const activeObj = canvas.getActiveObject();
        if (!(activeObj instanceof Group)) return;
        historySuspendedRef.current = true;
        activeObj.toActiveSelection();
        historySuspendedRef.current = false;
        canvas.requestRenderAll();
        pushHistory(canvas);
    }, [canvas, pushHistory, historySuspendedRef]);

    const mergeGroup = useCallback(async () => {
        if (!canvas) return;
        const activeObj = canvas.getActiveObject();
        if (!activeObj || !(activeObj instanceof Group)) return;
        historySuspendedRef.current = true;
        const dataUrl = activeObj.toDataURL({ format: 'png', multiplier: 2 });
        try {
            const img = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });
            img.set({
                left: activeObj.left,
                top: activeObj.top,
                originX: activeObj.originX,
                originY: activeObj.originY,
                scaleX: activeObj.scaleX / 2,
                scaleY: activeObj.scaleY / 2,
                id: generateId(),
                name: t('media_editor.layer_image'),
                editorType: 'image'
            });
            canvas.remove(activeObj);
            canvas.add(img);
            canvas.setActiveObject(img);
        } catch (e) {}
        historySuspendedRef.current = false;
        canvas.requestRenderAll();
        pushHistory(canvas);
    }, [canvas, pushHistory, t, historySuspendedRef]);

    const deleteSelected = useCallback((setSelectedObject) => {
        if (!canvas) return;
        const bg = getBackground(canvas);
        const objs = canvas.getActiveObjects().filter(o => o !== bg);
        if (!objs.length) return;
        historySuspendedRef.current = true;
        canvas.discardActiveObject();
        objs.forEach(o => canvas.remove(o));
        historySuspendedRef.current = false;
        if (setSelectedObject) setSelectedObject(null);
        canvas.requestRenderAll();
        pushHistory(canvas);
    }, [canvas, getBackground, pushHistory, historySuspendedRef]);

    const handleSave = useCallback(async (currentFile, saveCallback) => {
        if (!canvas) return;
        try {
            pushHistory(canvas);

            canvas.getObjects().forEach(o => {
                if (o.editorType === 'crop' || o.editorType === 'crop_overlay') o.visible = false;
            });
            canvas.discardActiveObject();

            const richTextObjects = canvas.getObjects().filter(o => o.editorType === 'richtext' && o.visible);
            const tempImages = [];

            for (const rtObj of richTextObjects) {
                const domNode = document.getElementById(`richtext-content-${rtObj.id}`);
                const hasContent = rtObj.richTextContent && typeof rtObj.richTextContent === 'object' && Object.keys(rtObj.richTextContent).length > 0;

                if (domNode && hasContent) {
                    const pixelRatio = 3;
                    const dataUrl = await toPng(domNode, {
                        quality: 1,
                        pixelRatio,
                        cacheBust: true,
                        width: rtObj.width,
                        height: rtObj.height,
                        style: {
                            transform: 'none',
                            width: `${rtObj.width}px`,
                            height: `${rtObj.height}px`
                        }
                    });
                    const img = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });

                    img.set({
                        left: rtObj.left,
                        top: rtObj.top,
                        scaleX: rtObj.scaleX / pixelRatio,
                        scaleY: rtObj.scaleY / pixelRatio,
                        originX: rtObj.originX,
                        originY: rtObj.originY,
                        angle: rtObj.angle
                    });

                    const idx = canvas.getObjects().indexOf(rtObj);
                    canvas.insertAt(idx, img);
                    tempImages.push(img);
                    rtObj.visible = false;
                }
            }

            const vpt = canvas.viewportTransform;
            canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
            canvas.requestRenderAll();

            const type = currentFile instanceof File ? currentFile.type : 'image/png';
            const blob = await new Promise(res => canvas.toCanvasElement(1).toBlob(res, type, 0.95));

            canvas.setViewportTransform(vpt);
            tempImages.forEach(img => canvas.remove(img));
            richTextObjects.forEach(rt => { rt.visible = true; });
            canvas.requestRenderAll();

            const ext = type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png';
            saveCallback(new File([blob], `edited_image.${ext}`, { type, lastModified: Date.now() }));
        } catch (e) {
            console.error('Save failed', e);
        }
    }, [canvas, pushHistory]);

    return { groupObjects, ungroupObjects, mergeGroup, deleteSelected, handleSave };
};