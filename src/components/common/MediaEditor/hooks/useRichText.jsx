import React, { useState, useEffect, useCallback } from 'react';
import { Rect } from 'fabric';
import { generateId } from '../constants';
import { SvgIcon, SidebarButton, PropertyLabel } from '../EditorUI';
import SmartEditor from '../../../editor/SmartEditor';
import RichTextComponent from '../../RichText';

const RichTextOverlay = ({ canvas, obj, content }) => {
    const [style, setStyle] = useState({ display: 'none' });

    useEffect(() => {
        if (!canvas || !obj) return;
        const updatePosition = () => {
            const rect = obj.getBoundingRect();
            setStyle({
                position: 'absolute', left: `${rect.left}px`, top: `${rect.top}px`,
                width: `${rect.width}px`, height: `${rect.height}px`,
                pointerEvents: 'none', overflow: 'hidden', zIndex: 10
            });
        };
        updatePosition();
        canvas.on('after:render', updatePosition);
        return () => canvas.off('after:render', updatePosition);
    }, [canvas, obj]);

    if (!content || (typeof content === 'object' && Object.keys(content).length === 0) || content === '') return null;

    return <div style={style}><RichTextComponent text={content} /></div>;
};

export const useRichText = (core, t, stickerPacks) => {
    const { state: { canvas, activeTool, selectedObject }, actions: { setActiveTool, pushHistory } } = core;
    const isActive = activeTool === 'text';
    const [textBlocks, setTextBlocks] = useState({});

    // При кліку по канвасу створюємо прозорий плейсхолдер
    useEffect(() => {
        if (!canvas || !isActive) return;

        const handleMouseDown = (e) => {
            const pointer = canvas.getScenePoint(e.e);
            const id = generateId();

            // Запобігаємо створенню, якщо клікнули на існуючий об'єкт
            if (e.target) return;

            const placeholder = new Rect({
                left: pointer.x, top: pointer.y, width: 300, height: 150,
                fill: 'rgba(255,255,255,0.01)', stroke: '#5B9BD5', strokeWidth: 2, strokeDashArray: [5, 5],
                editorType: 'richtext', id, name: t('media_editor.richtext_layer')
            });

            setTextBlocks(prev => ({ ...prev, [id]: '' })); // Порожній рядок замість {}
            canvas.add(placeholder);
            canvas.setActiveObject(placeholder);
            setActiveTool('select');
            pushHistory(canvas);
        };

        canvas.on('mouse:down', handleMouseDown);
        return () => canvas.off('mouse:down', handleMouseDown);
    }, [canvas, isActive, t, setActiveTool, pushHistory]);

    const isTextSelected = selectedObject?.editorType === 'richtext';
    const selectedRichTextId = isTextSelected ? selectedObject.id : null;

    // Рендеримо HTML віджети поверх канвасу
    const renderOverlays = () => {
        if (!canvas) return null;
        const rtObjects = canvas.getObjects().filter(o => o.editorType === 'richtext');
        return rtObjects.map(obj => <RichTextOverlay key={obj.id} canvas={canvas} obj={obj} content={textBlocks[obj.id]} />);
    };

    return {
        id: "text",
        isActive,
        renderOverlays,
        renderSidebarButton: () => (
            <SidebarButton active={isActive} onClick={() => setActiveTool("text")} icon={<SvgIcon name="text" size={20} />} label={t('media_editor.tool_text')} />
        ),
        renderSettingsPanel: () => {
            if (!isActive && !isTextSelected) return null;

            if (isTextSelected) {
                return (
                    <div className="flex flex-col gap-4 h-full">
                        <PropertyLabel>{t('media_editor.text_editing')}</PropertyLabel>
                        <div className="bg-bg-page border border-border rounded-md overflow-hidden min-h-[200px] flex flex-col">
                            <SmartEditor
                                value={textBlocks[selectedRichTextId] || ''}
                                onChange={(newContent) => setTextBlocks(prev => ({ ...prev, [selectedRichTextId]: newContent }))}
                                stickerPacks={stickerPacks}
                                placeholder={t('media_editor.text_placeholder')}
                            />
                        </div>
                        <span className="text-[10px] text-text-muted italic mt-2 leading-tight">
                            {t('media_editor.text_resize_hint')}
                        </span>
                    </div>
                );
            }

            return (
                <div className="flex flex-col gap-4">
                    <PropertyLabel>{t('media_editor.text_creation')}</PropertyLabel>
                    <span className="text-[11px] text-text-muted italic">{t('media_editor.text_create_hint')}</span>
                </div>
            );
        }
    };
};