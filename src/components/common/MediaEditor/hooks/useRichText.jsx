import React, { useState, useEffect, useRef } from 'react';
import { Rect } from 'fabric';
import { generateId } from '../constants';
import { SvgIcon, SidebarButton, PropertyLabel } from '../EditorUI';
import SmartEditor from '../../../editor/SmartEditor';
import RichTextComponent from '../../RichText';

const isRichTextEmpty = (content) => {
    if (!content || typeof content !== 'object') return true;
    if (!Array.isArray(content.content) || content.content.length === 0) return true;
    if (content.content.length === 1) {
        const first = content.content[0];
        if (first.type === 'paragraph' && (!first.content || first.content.length === 0)) {
            return true;
        }
    }
    return false;
};

const RichTextOverlay = ({ canvas, obj, isSelected, t }) => {
    const overlayRef = useRef(null);
    const [style, setStyle] = useState({ display: 'none' });
    const [content, setContent] = useState(obj.richTextContent || '');

    useEffect(() => {
        if (!canvas || !obj) return;

        const updatePosition = () => {
            const canvasEl = canvas.getElement();
            const containerEl = overlayRef.current?.parentElement || canvasEl?.parentElement?.parentElement;
            if (!canvasEl || !containerEl) return;

            const matrix = obj.calcTransformMatrix();
            const canvasRect = canvasEl.getBoundingClientRect();
            const containerRect = containerEl.getBoundingClientRect();

            const scaleX = canvasEl.clientWidth / canvas.width;
            const scaleY = canvasEl.clientHeight / canvas.height;

            const offsetX = canvasRect.left - containerRect.left + containerEl.scrollLeft;
            const offsetY = canvasRect.top - containerRect.top + containerEl.scrollTop;

            const finalMatrix = [
                matrix[0] * scaleX,
                matrix[1] * scaleY,
                matrix[2] * scaleX,
                matrix[3] * scaleY,
                offsetX + matrix[4] * scaleX,
                offsetY + matrix[5] * scaleY
            ];

            setStyle({
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${obj.width}px`,
                height: `${obj.height}px`,
                transform: `matrix(${finalMatrix.join(',')}) translate(-50%, -50%)`,
                transformOrigin: '0 0',
                pointerEvents: 'none',
                zIndex: isSelected ? 100 : 10,
                display: obj.visible ? 'block' : 'none'
            });
        };

        updatePosition();
        canvas.on('after:render', updatePosition);
        window.addEventListener('resize', updatePosition);
        return () => {
            canvas.off('after:render', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [canvas, obj, isSelected]);

    useEffect(() => {
        const handleModified = () => setContent(obj.richTextContent || '');
        obj.on('modified', handleModified);
        obj.on('changed', handleModified);
        setContent(obj.richTextContent || '');
        return () => {
            obj.off('modified', handleModified);
            obj.off('changed', handleModified);
        };
    }, [obj, obj.richTextContent]);

    const isEmpty = isRichTextEmpty(content);

    return (
        <div
            ref={overlayRef}
            id={`richtext-overlay-${obj.id}`}
            style={style}
        >
            <div
                id={`richtext-content-${obj.id}`}
                style={{ width: `${obj.width}px`, height: `${obj.height}px` }}
                className="overflow-hidden pointer-events-none box-border"
            >
                {!isEmpty ? (
                    <RichTextComponent text={content} limit={10000} />
                ) : isSelected ? (
                    <div className="post-text opacity-50 select-none">
                        {t('media_editor.text_placeholder')}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export const useRichText = (core, t, stickerPacks) => {
    const { state: { canvas, activeTool, selectedObject, activeFolderId }, actions: { setActiveTool, pushHistory } } = core;
    const isActive = activeTool === 'text';

    useEffect(() => {
        if (!canvas) return;

        // При розтягуванні за бокові ручки змінюємо ширину/висоту текстового контейнера без спотворення шрифту
        const handleScaling = (e) => {
            const obj = e.target;
            if (!obj || obj.editorType !== 'richtext') return;
            const corner = e.transform?.corner;

            if (corner === 'ml' || corner === 'mr') {
                const baseScale = obj.scaleY;
                obj.set({
                    width: Math.max(80, (obj.width * obj.scaleX) / baseScale),
                    scaleX: baseScale
                });
            } else if (corner === 'mt' || corner === 'mb') {
                const baseScale = obj.scaleX;
                obj.set({
                    height: Math.max(30, (obj.height * obj.scaleY) / baseScale),
                    scaleY: baseScale
                });
            }
        };

        canvas.on('object:scaling', handleScaling);
        return () => canvas.off('object:scaling', handleScaling);
    }, [canvas]);

    useEffect(() => {
        if (!canvas || !isActive) return;

        const handleMouseDown = (e) => {
            if (e.target && !e.target.isBackground && e.target.editorType !== 'background') return;

            canvas.discardActiveObject();
            const pointer = canvas.getScenePoint(e.e);
            const id = generateId();

            const canvasEl = canvas.getElement();
            const cssScale = (canvasEl?.clientWidth || canvas.width) / canvas.width;
            const initialScale = cssScale > 0 ? 1 / cssScale : 1;

            const placeholder = new Rect({
                left: pointer.x,
                top: pointer.y,
                width: 240,
                height: 80,
                scaleX: initialScale,
                scaleY: initialScale,
                originX: 'left',
                originY: 'top',
                fill: 'rgba(255,255,255,0.01)',
                stroke: 'transparent',
                strokeWidth: 0,
                editorType: 'richtext',
                id,
                name: t('media_editor.richtext_layer'),
                folderId: activeFolderId,
                richTextContent: ''
            });

            canvas.add(placeholder);
            canvas.setActiveObject(placeholder);
            setActiveTool('select');
            pushHistory(canvas);
        };

        canvas.on('mouse:down', handleMouseDown);
        return () => canvas.off('mouse:down', handleMouseDown);
    }, [canvas, isActive, activeFolderId, t, setActiveTool, pushHistory]);

    const renderOverlays = () => {
        if (!canvas) return null;
        return canvas.getObjects()
        .filter(o => o.editorType === 'richtext')
        .map(obj => (
            <RichTextOverlay
                key={obj.id}
                canvas={canvas}
                obj={obj}
                isSelected={selectedObject?.id === obj.id}
                t={t}
            />
        ));
    };

    const renderSettingsPanel = () => {
        if (!isActive && selectedObject?.editorType !== 'richtext') return null;
        return (
            <div className="flex flex-col gap-4">
                <PropertyLabel>
                    {selectedObject?.editorType === 'richtext' ? t('media_editor.text_editing') : t('media_editor.text_creation')}
                </PropertyLabel>
                {selectedObject?.editorType === 'richtext' ? (
                    <>
                        <div className="bg-input-bg border border-border flex flex-col w-full min-h-[160px] max-h-[350px]">
                            <SmartEditor
                                key={selectedObject.id}
                                value={selectedObject.richTextContent || ''}
                                onChange={(val) => {
                                    selectedObject.set('richTextContent', val);
                                    selectedObject.fire('changed');
                                    canvas.requestRenderAll();
                                    pushHistory(canvas);
                                }}
                                stickerPacks={stickerPacks}
                                placeholder={t('media_editor.text_placeholder')}
                            />
                        </div>
                        <span className="text-[11px] text-text-muted italic">{t('media_editor.text_resize_hint')}</span>
                    </>
                ) : (
                    <span className="text-[11px] text-text-muted italic">{t('media_editor.text_create_hint')}</span>
                )}
            </div>
        );
    };

    return {
        id: 'text',
        isActive,
        renderOverlays,
        renderSidebarButton: () => (
            <SidebarButton
                active={isActive}
                onClick={() => setActiveTool('text')}
                icon={<SvgIcon name="text" size={20} />}
                label={t('media_editor.tool_text')}
            />
        ),
        renderSettingsPanel
    };
};