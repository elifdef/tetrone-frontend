import React, { useEffect, useRef } from 'react';
import { Rect, IText, FabricImage } from 'fabric';
import { generateId } from '../constants';
import { SvgIcon, SidebarButton, SmallButton, PropertyLabel } from '../EditorUI';

export const useCollage = (core, t) => {
    const { state: { canvas, activeTool }, actions: { setActiveTool, pushHistory, rasterizeCurrentCanvas, fitCanvasToContainer }, refs: { backgroundImageRef } } = core;
    const isActive = activeTool === 'collage';

    const fileInputRef = useRef(null);
    const targetCellRef = useRef(null);

    // Дозволяємо клікати на комірки колажу, навіть якщо вибрано інший інструмент
    useEffect(() => {
        if (!canvas) return;
        const handleDown = (e) => {
            if (!e.target || !e.target.isCollageCell) return;
            targetCellRef.current = e.target;
            if (fileInputRef.current) fileInputRef.current.click();
        };
        canvas.on('mouse:down', handleDown);
        return () => canvas.off('mouse:down', handleDown);
    }, [canvas]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const cell = targetCellRef.current;
        if (!file || !cell || !canvas) return;

        const url = URL.createObjectURL(file);
        FabricImage.fromURL(url, { crossOrigin: "anonymous" }).then(img => {
            // Масштабуємо нове фото, щоб заповнити комірку
            const scale = Math.max(cell.width / img.width, cell.height / img.height);

            // Встановлюємо жорстку маску, яка вирізає фото рівно по розміру клітинки
            const clipPath = new Rect({
                left: cell.left, top: cell.top, width: cell.width, height: cell.height,
                absolutePositioned: true
            });

            img.set({
                left: cell.left + cell.width/2, top: cell.top + cell.height/2,
                originX: 'center', originY: 'center',
                scaleX: scale, scaleY: scale, clipPath: clipPath,
                editorType: 'image', id: generateId(), name: t('media_editor.layer_image')
            });

            // Видаляємо темний квадрат та текст-підказку з цієї комірки
            const objectsToRemove = canvas.getObjects().filter(o => o.collageId === cell.collageId);
            objectsToRemove.forEach(o => canvas.remove(o));

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.requestRenderAll();
            pushHistory(canvas);
            URL.revokeObjectURL(url);
        });
        e.target.value = null;
    };

    const applyLayout = async (type) => {
        if (!canvas) return;

        // Робимо скріншот всього, що вже напрацьовано
        const flattenedImg = await rasterizeCurrentCanvas();
        if (!flattenedImg) return;

        canvas.clear();
        const w = flattenedImg.width;
        const h = flattenedImg.height;

        canvas.setDimensions({ width: w, height: h }, { backstoreOnly: true });

        // Чорний фон для колажу
        const baseBg = new Rect({ left: 0, top: 0, width: w, height: h, fill: '#1a1a1c', isBackground: true, editorType: 'background', selectable: false, evented: false });
        canvas.add(baseBg);

        const gap = w * 0.01;

        const createCell = (left, top, cW, cH, imgObj) => {
            if (imgObj) {
                const scale = Math.max(cW / imgObj.width, cH / imgObj.height);
                imgObj.set({
                    left: left + cW/2, top: top + cH/2, originX: 'center', originY: 'center',
                    scaleX: scale, scaleY: scale,
                    name: t('media_editor.filter_original'), isBackground: true, editorType: 'background',
                    selectable: false, evented: false
                });

                const clipPath = new Rect({ left, top, width: cW, height: cH, absolutePositioned: true });
                imgObj.clipPath = clipPath;
                canvas.add(imgObj);
                backgroundImageRef.current = imgObj;
            } else {
                const cellId = generateId();
                const cell = new Rect({ left, top, width: cW, height: cH, fill: '#2c2c2e', editorType: 'shape', isCollageCell: true, hoverCursor: 'pointer', selectable: false, collageId: cellId, name: t('media_editor.layer_shape') });
                const text = new IText(t('media_editor.add_text'), { left: left + cW/2, top: top + cH/2, originX: 'center', originY: 'center', fill: '#888888', fontSize: w * 0.03, textAlign: 'center', selectable: false, evented: false, collageId: cellId });
                canvas.add(cell, text);
            }
        };

        if (type === 'split-v') {
            const cW = (w / 2) - (gap / 2);
            createCell(0, 0, cW, h, flattenedImg);
            createCell(w / 2 + gap / 2, 0, cW, h, null);
        } else if (type === 'split-h') {
            const cH = (h / 2) - (gap / 2);
            createCell(0, 0, w, cH, flattenedImg);
            createCell(0, h / 2 + gap / 2, w, cH, null);
        } else if (type === 'grid-4') {
            const cW = (w / 2) - (gap / 2);
            const cH = (h / 2) - (gap / 2);
            createCell(0, 0, cW, cH, flattenedImg);
            createCell(w / 2 + gap / 2, 0, cW, cH, null);
            createCell(0, h / 2 + gap / 2, cW, cH, null);
            createCell(w / 2 + gap / 2, h / 2 + gap / 2, cW, cH, null);
        }

        fitCanvasToContainer(canvas, core.state.zoom);
        pushHistory(canvas);
        setActiveTool('select');
    };

    return {
        id: "collage",
        isActive,
        renderSidebarButton: () => (
            <>
                <SidebarButton active={isActive} onClick={() => setActiveTool("collage")} icon={<SvgIcon name="layout" size={20} />} label={t('media_editor.tool_transform')} />
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </>
        ),
        renderSettingsPanel: () => {
            if (!isActive) return null;
            return (
                <div className="flex flex-col gap-4">
                    <PropertyLabel>{t('media_editor.tool_transform')}</PropertyLabel>
                    <span className="text-[11px] text-text-muted italic leading-tight mb-2">
                        {t('media_editor.select_tool_hint')}
                    </span>
                    <div className="flex flex-col gap-2">
                        <SmallButton onClick={() => applyLayout('split-v')}>2 Вертикально</SmallButton>
                        <SmallButton onClick={() => applyLayout('split-h')}>2 Горизонтально</SmallButton>
                        <SmallButton onClick={() => applyLayout('grid-4')}>Сітка 4</SmallButton>
                    </div>
                </div>
            );
        }
    };
};