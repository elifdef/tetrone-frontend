import React, { useState, useEffect, useRef } from 'react';
import { Rect, FabricImage } from 'fabric';
import { generateId, CROP_RATIOS, OBJECT_PROPS } from '../constants';
import { SvgIcon, SidebarButton, SmallButton, PropertyLabel } from '../EditorUI';

export const useTransform = (core, t) => {
    const { state: { canvas, activeTool, selectedObject, zoom }, actions: { setActiveTool, pushHistory, getBackground, fitCanvasToContainer }, refs: { historySuspendedRef } } = core;
    const isTransformActive = activeTool === 'transform';
    const isCropActive = activeTool === 'crop';
    const isActive = isTransformActive || isCropActive;

    const cropRectRef = useRef(null);
    const overlaysRef = useRef([]);
    const [cropRatio, setCropRatio] = useState("free");
    const hasSelection = !!selectedObject && !selectedObject?.isBackground;

    const transformSelected = (action) => {
        if(!canvas) return;
        const act = canvas.getActiveObject();
        const bg = getBackground(canvas);
        if(!act || act === bg || act.editorType==="crop") return;

        if (action === 'rotL') act.rotate((act.angle || 0) - 90);
        else if (action === 'rotR') act.rotate((act.angle || 0) + 90);
        else if (action === 'flipH') act.set("flipX", !act.flipX);
        else if (action === 'flipV') act.set("flipY", !act.flipY);
        else if (action === 'dup') {
            act.clone(OBJECT_PROPS).then(clone => {
                clone.set({ left: (act.left || 0) + 30, top: (act.top || 0) + 30, id: generateId() });
                canvas.add(clone); canvas.setActiveObject(clone); canvas.requestRenderAll(); pushHistory(canvas);
            });
            return;
        }
        act.setCoords(); canvas.requestRenderAll(); pushHistory(canvas);
    };

    const updateOverlays = () => {
        if (!canvas || !cropRectRef.current) return;
        const bg = getBackground(canvas);
        const crop = cropRectRef.current;
        if (!bg) return;

        const w = crop.getScaledWidth(), h = crop.getScaledHeight();
        const left = crop.left - w / 2, top = crop.top - h / 2;
        const right = left + w, bottom = top + h;

        const [topR, bottomR, leftR, rightR] = overlaysRef.current;

        topR.set({ width: bg.width, height: Math.max(0, top) });
        bottomR.set({ top: bottom, width: bg.width, height: Math.max(0, bg.height - bottom) });
        leftR.set({ top: top, width: Math.max(0, left), height: Math.max(0, h) });
        rightR.set({ left: right, top: top, width: Math.max(0, bg.width - right), height: Math.max(0, h) });
    };

    useEffect(() => {
        if (!isCropActive || !canvas) {
            if (cropRectRef.current && canvas) {
                historySuspendedRef.current = true;
                canvas.remove(cropRectRef.current);
                overlaysRef.current.forEach(o => canvas.remove(o));
                cropRectRef.current = null;
                overlaysRef.current = [];
                historySuspendedRef.current = false;
                canvas.requestRenderAll();
            }
            return;
        }
        if (cropRectRef.current) return;
        const bg = getBackground(canvas);
        if (!bg?.width || !bg?.height) return;

        const crop = new Rect({
            left: bg.width / 2, top: bg.height / 2, originX: "center", originY: "center",
            width: bg.width * 0.7, height: bg.height * 0.7,
            fill: "transparent", stroke: "#ffffff", strokeWidth: 2, strokeDashArray: [10, 5],
            transparentCorners: false, cornerSize: 12, cornerColor: '#ffffff',
            lockRotation: true, lockUniScaling: cropRatio !== "free", hasControls: true, selectable: true, evented: true,
            editorType: "crop", excludeFromExport: true
        });

        const overlayProps = { fill: 'rgba(0,0,0,0.6)', selectable: false, evented: false, editorType: 'crop_overlay', excludeFromExport: true };
        overlaysRef.current = [
            new Rect({ ...overlayProps, left: 0, top: 0 }),
            new Rect({ ...overlayProps, left: 0 }),
            new Rect({ ...overlayProps, left: 0 }),
            new Rect({ ...overlayProps })
        ];

        const keepInside = () => {
            const w = crop.getScaledWidth(), h = crop.getScaledHeight();
            crop.set({ left: Math.max(w/2, Math.min(bg.width - w/2, crop.left)), top: Math.max(h/2, Math.min(bg.height - h/2, crop.top)) });
            updateOverlays();
        };
        crop.on("moving", keepInside); crop.on("scaling", keepInside);

        historySuspendedRef.current = true;
        overlaysRef.current.forEach(o => canvas.add(o));
        canvas.add(crop);
        cropRectRef.current = crop;
        updateOverlays();
        canvas.setActiveObject(crop);
        historySuspendedRef.current = false;
        canvas.requestRenderAll();
    }, [isCropActive, canvas, cropRatio, getBackground, historySuspendedRef]);

    useEffect(() => {
        const crop = cropRectRef.current;
        const bg = getBackground(canvas);
        if (!crop || !bg || !isCropActive) return;

        const ratio = CROP_RATIOS[cropRatio];
        historySuspendedRef.current = true;
        if (!ratio) { crop.set({ lockUniScaling: false }); historySuspendedRef.current = false; return; }

        let w = crop.getScaledWidth(), h = w / ratio;
        if (h > bg.height * 0.9) { h = bg.height * 0.9; w = h * ratio; }
        if (w > bg.width * 0.9) { w = bg.width * 0.9; h = w / ratio; }

        crop.scaleX = w / crop.width;
        crop.scaleY = h / crop.height;
        crop.set({ lockUniScaling: true });
        crop.setCoords();
        updateOverlays();
        historySuspendedRef.current = false;
        canvas?.requestRenderAll();
    }, [isCropActive, canvas, cropRatio, getBackground, historySuspendedRef]);

    const finishCrop = async () => {
        if (!canvas || !cropRectRef.current) return;
        const crop = cropRectRef.current; const bg = getBackground(canvas);
        if (!bg?.width || !bg?.height) return;
        try {
            historySuspendedRef.current = true;
            const cW = crop.getScaledWidth(), cH = crop.getScaledHeight();
            const left = Math.max(0, crop.left - cW / 2), top = Math.max(0, crop.top - cH / 2);
            canvas.discardActiveObject();

            const exportCanvas = canvas.toCanvasElement(1, { left, top, width: cW, height: cH });
            const blob = await new Promise(res => exportCanvas.toBlob(res, "image/png", 1));
            const objectUrl = URL.createObjectURL(blob);
            const croppedImage = await FabricImage.fromURL(objectUrl);
            URL.revokeObjectURL(objectUrl);

            croppedImage.set({ left: 0, top: 0, originX: "left", originY: "top", scaleX: 1, scaleY: 1, selectable: false, evented: false, hoverCursor: "default", isBackground: true, editorType: "background", name: t('media_editor.filter_original') });

            canvas.clear();
            canvas.backgroundColor = "#1a1a1c";
            canvas.setDimensions({ width: croppedImage.width, height: croppedImage.height }, { backstoreOnly: true });
            canvas.add(croppedImage);
            if (canvas.sendObjectToBack) canvas.sendObjectToBack(croppedImage);

            cropRectRef.current = null;
            setActiveTool("select");
            historySuspendedRef.current = false;
            fitCanvasToContainer(canvas, zoom);
            canvas.requestRenderAll();
            pushHistory(canvas);
        } catch (e) {}
    };

    return {
        id: "transform",
        isActive,
        renderSidebarButton: () => (
            <>
                <SidebarButton active={isTransformActive} onClick={() => setActiveTool("transform")} icon={<SvgIcon name="transform" size={20} />} label={t('media_editor.tool_transform')} />
                <SidebarButton active={isCropActive} onClick={() => setActiveTool(isCropActive ? "select" : "crop")} icon={<SvgIcon name="crop" size={20} />} label={t('media_editor.tool_crop')} />
            </>
        ),
        renderSettingsPanel: () => {
            if (!isActive) return null;
            if (isTransformActive) {
                return (
                    <div className="flex flex-col gap-4">
                        <PropertyLabel>{t('media_editor.rotate')} / {t('media_editor.tool_transform')}</PropertyLabel>
                        <div className="grid grid-cols-2 gap-2">
                            <SmallButton disabled={!hasSelection} onClick={() => transformSelected('rotL')}><SvgIcon name="rotate-left" size={14} /> {t('media_editor.rotate_left')}</SmallButton>
                            <SmallButton disabled={!hasSelection} onClick={() => transformSelected('rotR')}><SvgIcon name="rotate-right" size={14} /> {t('media_editor.rotate_right')}</SmallButton>
                            <SmallButton disabled={!hasSelection} onClick={() => transformSelected('flipH')}><SvgIcon name="flip-h" size={14} /> {t('media_editor.flip_h')}</SmallButton>
                            <SmallButton disabled={!hasSelection} onClick={() => transformSelected('flipV')}><SvgIcon name="flip-v" size={14} /> {t('media_editor.flip_v')}</SmallButton>
                        </div>
                        <SmallButton disabled={!hasSelection} onClick={() => transformSelected('dup')}><SvgIcon name="copy" size={14} /> {t('media_editor.duplicate')}</SmallButton>
                    </div>
                );
            }
            if (isCropActive) {
                return (
                    <div className="flex flex-col gap-4">
                        <PropertyLabel>{t('media_editor.crop_ratio')}</PropertyLabel>
                        <div className="flex flex-col gap-2">
                            <SmallButton active={cropRatio === "free"} onClick={() => setCropRatio("free")}>{t("media_editor.ratio_free")}</SmallButton>
                            <SmallButton active={cropRatio === "square"} onClick={() => setCropRatio("square")}>1:1</SmallButton>
                            <SmallButton active={cropRatio === "landscape"} onClick={() => setCropRatio("landscape")}>16:9</SmallButton>
                            <SmallButton active={cropRatio === "portrait"} onClick={() => setCropRatio("portrait")}>9:16</SmallButton>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <SmallButton onClick={() => setActiveTool("select")}><SvgIcon name="close" size={13} /> {t("media_editor.cancel_crop")}</SmallButton>
                            <SmallButton active onClick={finishCrop}><SvgIcon name="check" size={13} /> {t("media_editor.apply_crop")}</SmallButton>
                        </div>
                    </div>
                );
            }
        }
    };
};