import React, { useState, useEffect, useRef } from 'react';
import { Rect, Circle, Triangle, Line, Path, PencilBrush, Ellipse, Polygon } from 'fabric';
import { generateId } from '../constants';
import { SvgIcon, SidebarButton, SmallButton, PropertyLabel } from '../EditorUI';

export const useShapes = (core, t) => {
    const { state: { canvas, activeTool, activeFolderId, selectedObject }, actions: { setActiveTool, pushHistory } } = core;
    const isActive = activeTool === 'shapes';

    const [shapeType, setShapeType] = useState('rect');
    const [color, setColor] = useState('#ff3347');
    const [strokeWidth, setStrokeWidth] = useState(8);
    const [blurIntensity, setBlurIntensity] = useState(0.5);

    const isDrawingRef = useRef(false);
    const startPointRef = useRef(null);
    const currentObjRef = useRef(null);
    const hasDraggedRef = useRef(false);

    useEffect(() => {
        if (selectedObject && selectedObject.editorType === 'censor') {
            setBlurIntensity(selectedObject.blurIntensity || 0.5);
        }
    }, [selectedObject]);

    useEffect(() => {
        if (!canvas) return;
        const isPencil = isActive && shapeType === 'pencil';
        canvas.isDrawingMode = isPencil;
        if (isPencil) {
            if (!canvas.freeDrawingBrush) canvas.freeDrawingBrush = new PencilBrush(canvas);
            canvas.freeDrawingBrush.color = color;
            canvas.freeDrawingBrush.width = Number(strokeWidth);
            canvas.freeDrawingBrush.limitedToCanvasSize = true;
        }
    }, [canvas, isActive, shapeType, color, strokeWidth]);

    useEffect(() => {
        if (!canvas) return;
        const handlePathCreated = (e) => {
            if (!isActive || shapeType !== 'pencil') return;
            e.path.set({ id: generateId(), editorType: 'shape', name: t('media_editor.shape_pencil'), folderId: activeFolderId });
            pushHistory(canvas);
        };
        canvas.on('path:created', handlePathCreated);
        return () => canvas.off('path:created', handlePathCreated);
    }, [canvas, isActive, shapeType, activeFolderId, t, pushHistory]);

    useEffect(() => {
        if (!canvas || !isActive || shapeType === 'pencil') return;

        const handleMouseDown = (e) => {
            const target = e.target;
            if (target && target.editorType !== 'background' && target.editorType !== 'crop_overlay') return;

            canvas.discardActiveObject();
            const pointer = canvas.getScenePoint(e.e);
            isDrawingRef.current = true;
            hasDraggedRef.current = false;
            startPointRef.current = pointer;

            const props = {
                left: pointer.x, top: pointer.y, originX: 'left', originY: 'top',
                fill: "transparent", stroke: color, strokeWidth: Number(strokeWidth), strokeUniform: true,
                editorType: "shape", id: generateId(), name: t(`media_editor.shape_${shapeType}`) || shapeType,
                folderId: activeFolderId
            };

            // Базові фігури
            if (shapeType === 'line') { currentObjRef.current = new Line([pointer.x, pointer.y, pointer.x, pointer.y], props); }
            else if (shapeType === 'rect') { currentObjRef.current = new Rect({ ...props, width: 0, height: 0 }); }
            else if (shapeType === 'circle') { currentObjRef.current = new Circle({ ...props, radius: 0 }); }
            else if (shapeType === 'triangle') { currentObjRef.current = new Triangle({ ...props, width: 0, height: 0 }); }

            // Нові круті геометричні фігури
            else if (shapeType === 'ellipse') { currentObjRef.current = new Ellipse({ ...props, rx: 0, ry: 0 }); }
            else if (shapeType === 'diamond') { currentObjRef.current = new Polygon([{x:50,y:0}, {x:100,y:50}, {x:50,y:100}, {x:0,y:50}], { ...props, scaleX: 0, scaleY: 0 }); }
            else if (shapeType === 'hexagon') { currentObjRef.current = new Polygon([{x:25,y:0}, {x:75,y:0}, {x:100,y:50}, {x:75,y:100}, {x:25,y:100}, {x:0,y:50}], { ...props, scaleX: 0, scaleY: 0 }); }
            else if (shapeType === 'star') { currentObjRef.current = new Polygon([{x: 50, y: 0}, {x: 61, y: 35}, {x: 98, y: 35}, {x: 68, y: 57}, {x: 79, y: 91}, {x: 50, y: 70}, {x: 21, y: 91}, {x: 32, y: 57}, {x: 2, y: 35}, {x: 39, y: 35}], { ...props, scaleX: 0, scaleY: 0 }); }

            // Спец-інструменти
            else if (shapeType === 'highlight') {
                currentObjRef.current = new Rect({ ...props, fill: color, opacity: 0.35, strokeWidth: 0, width: 0, height: 0 });
            }
            else if (shapeType === 'censor') {
                // ФІКС ЦЕНЗУРИ: Робимо її видимою під час малювання!
                currentObjRef.current = new Rect({
                    ...props, fill: "rgba(150,150,150,0.4)", stroke: "#ffffff", strokeDashArray: [5, 5], strokeWidth: 2,
                    width: 0, height: 0, lockRotation: true, editorType: 'censor', blurIntensity
                });
            }
            else if (shapeType === 'arrow') { currentObjRef.current = new Path(`M ${pointer.x} ${pointer.y} L ${pointer.x} ${pointer.y}`, { ...props, strokeLineCap: "round", strokeLineJoin: "round" }); }

            if (currentObjRef.current) canvas.add(currentObjRef.current);
        };

        const handleMouseMove = (e) => {
            if (!isDrawingRef.current || !currentObjRef.current || !startPointRef.current) return;
            const pointer = canvas.getScenePoint(e.e); const start = startPointRef.current;

            // ФІКС МАТЕМАТИКИ
            let w = Math.abs(pointer.x - start.x);
            let h = Math.abs(pointer.y - start.y);

            if (w > 3 || h > 3) hasDraggedRef.current = true;

            if (e.e.shiftKey && shapeType !== 'arrow' && shapeType !== 'line') { const max = Math.max(w, h); w = max; h = max; }

            if (shapeType === 'line') { currentObjRef.current.set({ x2: pointer.x, y2: pointer.y }); }
            else if (shapeType === 'arrow') {
                const dx = pointer.x - start.x; const dy = pointer.y - start.y; const angle = Math.atan2(dy, dx);
                const headlen = 15 + Number(strokeWidth);
                const x3 = pointer.x - headlen * Math.cos(angle - Math.PI / 6); const y3 = pointer.y - headlen * Math.sin(angle - Math.PI / 6);
                const x4 = pointer.x - headlen * Math.cos(angle + Math.PI / 6); const y4 = pointer.y - headlen * Math.sin(angle + Math.PI / 6);
                const newPath = `M ${start.x} ${start.y} L ${pointer.x} ${pointer.y} M ${pointer.x} ${pointer.y} L ${x3} ${y3} M ${pointer.x} ${pointer.y} L ${x4} ${y4}`;
                const oldId = currentObjRef.current.id; const oldFolderId = currentObjRef.current.folderId; canvas.remove(currentObjRef.current);
                currentObjRef.current = new Path(newPath, { fill: "transparent", stroke: color, strokeWidth: Number(strokeWidth), strokeLineCap: "round", strokeLineJoin: "round", editorType: "shape", id: oldId, name: t('media_editor.shape_arrow'), folderId: oldFolderId });
                canvas.add(currentObjRef.current);
            }
            else if (shapeType === 'ellipse') {
                currentObjRef.current.set({ left: Math.min(pointer.x, start.x), top: Math.min(pointer.y, start.y), rx: w / 2, ry: h / 2 });
            }
            else if (['diamond', 'hexagon', 'star'].includes(shapeType)) {
                // Багатокутники масштабуються
                currentObjRef.current.set({ left: Math.min(pointer.x, start.x), top: Math.min(pointer.y, start.y), scaleX: w / 100, scaleY: h / 100 });
            }
            else {
                currentObjRef.current.set({ left: Math.min(pointer.x, start.x), top: Math.min(pointer.y, start.y) });
                if (['rect', 'highlight', 'censor'].includes(shapeType)) { currentObjRef.current.set({ width: w, height: h }); }
                else if (shapeType === 'circle') { currentObjRef.current.set({ radius: Math.max(w, h) / 2 }); }
                else if (shapeType === 'triangle') { currentObjRef.current.set({ width: w, height: h }); }
            }
            canvas.requestRenderAll();
        };

        const handleMouseUp = () => {
            if (!isDrawingRef.current) return;
            const obj = currentObjRef.current;
            if (obj) {
                if (!hasDraggedRef.current) {
                    canvas.remove(obj);
                } else {
                    obj.setCoords();
                    if (shapeType === 'censor') { obj.fire('modified'); }
                    else { canvas.setActiveObject(obj); pushHistory(canvas); }
                }
            }
            isDrawingRef.current = false; hasDraggedRef.current = false; startPointRef.current = null; currentObjRef.current = null;
        };

        canvas.on('mouse:down', handleMouseDown); canvas.on('mouse:move', handleMouseMove); canvas.on('mouse:up', handleMouseUp);
        return () => { canvas.off('mouse:down', handleMouseDown); canvas.off('mouse:move', handleMouseMove); canvas.off('mouse:up', handleMouseUp); };
    }, [canvas, isActive, shapeType, color, strokeWidth, blurIntensity, activeFolderId, t, pushHistory]);

    const handleBlurChange = (e) => {
        const val = Number(e.target.value);
        setBlurIntensity(val);
        if (selectedObject && selectedObject.editorType === 'censor') {
            selectedObject.set('blurIntensity', val);
            if (selectedObject.filters && selectedObject.filters.length > 0) {
                selectedObject.filters[0].blur = val;
                selectedObject.applyFilters();
                canvas.requestRenderAll();
            }
        }
    };

    return {
        id: "shapes", isActive,
        renderSidebarButton: () => (<SidebarButton active={isActive} onClick={() => setActiveTool("shapes")} icon={<SvgIcon name="shapes" size={20} />} label={t('media_editor.tool_shapes')} />),
        renderSettingsPanel: () => {
            if (!isActive) return null;
            return (
                <div className="flex flex-col gap-4">
                    <PropertyLabel>{t('media_editor.drawing_tool')}</PropertyLabel>

                    {/* КНОПКИ ІНСТРУМЕНТІВ (2 колонки) */}
                    <div className="grid grid-cols-2 gap-2">
                        <SmallButton active={shapeType === 'pencil'} onClick={() => setShapeType('pencil')}><SvgIcon name="edit" size={14} /> {t('media_editor.tool_pencil')}</SmallButton>
                        <SmallButton active={shapeType === 'line'} onClick={() => setShapeType('line')}><SvgIcon name="minus" size={14} /> {t('media_editor.tool_line')}</SmallButton>
                        <SmallButton active={shapeType === 'arrow'} onClick={() => setShapeType('arrow')}><SvgIcon name="arrow-right" size={14} /> {t('media_editor.tool_arrow')}</SmallButton>
                        <SmallButton active={shapeType === 'rect'} onClick={() => setShapeType('rect')}><SvgIcon name="square" size={14} /> {t('media_editor.shape_rect')}</SmallButton>
                        <SmallButton active={shapeType === 'circle'} onClick={() => setShapeType('circle')}><SvgIcon name="circle" size={14} /> {t('media_editor.shape_circle')}</SmallButton>
                        <SmallButton active={shapeType === 'triangle'} onClick={() => setShapeType('triangle')}><SvgIcon name="triangle" size={14} /> {t('media_editor.shape_triangle')}</SmallButton>

                        {/* Нові фігури */}
                        <SmallButton active={shapeType === 'ellipse'} onClick={() => setShapeType('ellipse')}><SvgIcon name="ellipse" size={14} /> {t('media_editor.shape_ellipse')}</SmallButton>
                        <SmallButton active={shapeType === 'diamond'} onClick={() => setShapeType('diamond')}><SvgIcon name="diamond" size={14} /> {t('media_editor.shape_diamond')}</SmallButton>
                        <SmallButton active={shapeType === 'hexagon'} onClick={() => setShapeType('hexagon')}><SvgIcon name="hexagon" size={14} /> {t('media_editor.shape_hexagon')}</SmallButton>
                        <SmallButton active={shapeType === 'star'} onClick={() => setShapeType('star')}><SvgIcon name="star" size={14} /> {t('media_editor.shape_star')}</SmallButton>

                        {/* Спец */}
                        <SmallButton active={shapeType === 'highlight'} onClick={() => setShapeType('highlight')}><SvgIcon name="sun" size={14} /> {t('media_editor.shape_highlight')}</SmallButton>
                        <SmallButton active={shapeType === 'censor'} onClick={() => setShapeType('censor')}><SvgIcon name="grid" size={14} /> {t('media_editor.shape_censor')}</SmallButton>
                    </div>

                    {shapeType === 'censor' ? (
                        <div className="flex flex-col gap-1 mt-2">
                            <PropertyLabel>{t('media_editor.intensity')}</PropertyLabel>
                            <input type="range" min="0.1" max="1" step="0.05" value={blurIntensity} onChange={handleBlurChange} onMouseUp={() => pushHistory(canvas)} className="w-full" />
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-1 mt-2">
                                <PropertyLabel>{t('media_editor.color')}</PropertyLabel>
                                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-[36px] p-0 bg-transparent border border-border cursor-pointer rounded" />
                            </div>
                            <div className="flex flex-col gap-1 mt-2">
                                <PropertyLabel>{t('media_editor.stroke_width')}</PropertyLabel>
                                <input type="range" min="1" max={shapeType === 'pencil' ? 60 : 20} value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-full" />
                            </div>
                        </>
                    )}
                </div>
            );
        }
    };
};