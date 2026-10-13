import React from 'react';
import { IText, Rect } from 'fabric';
import { generateId } from '../constants';
import { SvgIcon, SidebarButton, SmallButton, PropertyLabel } from '../EditorUI';

export const useMemeGenerator = (core, t) => {
    const { state: { canvas, activeTool }, actions: { setActiveTool, pushHistory, rasterizeCurrentCanvas, fitCanvasToContainer }, refs: { backgroundImageRef } } = core;
    const isActive = activeTool === 'meme';

    const makeClassicMeme = () => {
        if (!canvas) return;
        const width = canvas.getWidth();
        const height = canvas.getHeight();

        const commonProps = {
            fontFamily: 'Impact', fontSize: width * 0.1, fill: '#ffffff', stroke: '#000000', strokeWidth: width * 0.005,
            textAlign: 'center', originX: 'center', fontWeight: 'bold', editorType: 'text', id: generateId()
        };

        const topText = new IText(t('media_editor.meme_top_text'), { ...commonProps, left: width / 2, top: height * 0.05, originY: 'top' });
        const bottomText = new IText(t('media_editor.meme_bottom_text'), { ...commonProps, left: width / 2, top: height * 0.95, originY: 'bottom' });

        canvas.add(topText, bottomText);
        canvas.setActiveObject(bottomText);
        bottomText.enterEditing(); bottomText.selectAll();
        pushHistory(canvas);
        setActiveTool('select');
    };

    const makeDemotivator = async () => {
        if (!canvas) return;

        // 1. Створюємо фінальний зліпок всього поточного малюнку
        const flattenedImg = await rasterizeCurrentCanvas();
        if (!flattenedImg) return;

        canvas.clear();

        // 2. Нові розміри для демотиватора (додаємо чорний простір)
        const frameW = flattenedImg.width + 100;
        const frameH = flattenedImg.height + 250;

        canvas.setDimensions({ width: frameW, height: frameH }, { backstoreOnly: true });

        // 3. Абсолютно чорний фон
        const newBg = new Rect({ left: 0, top: 0, width: frameW, height: frameH, fill: '#000000', selectable: false, evented: false, isBackground: true, editorType: 'background' });

        // 4. Картинка по центру вгорі
        flattenedImg.set({
            left: frameW / 2, top: 50, originX: 'center', originY: 'top',
            name: t('media_editor.filter_original'), isBackground: true, editorType: 'background',
            selectable: false, evented: false
        });

        // 5. Тонка біла рамка
        const innerFrame = new Rect({
            left: flattenedImg.left, top: flattenedImg.top, originX: 'center', originY: 'top',
            width: flattenedImg.width + 12, height: flattenedImg.height + 12,
            fill: 'transparent', stroke: '#ffffff', strokeWidth: 2,
            selectable: false, evented: false, name: t('media_editor.layer_shape')
        });

        // 6. Тексти
        const title = new IText(t('media_editor.demotivator_title'), {
            fontFamily: 'Times New Roman', fontSize: frameW * 0.08, fill: '#ffffff',
            originX: 'center', originY: 'top', textAlign: 'center',
            top: innerFrame.top + innerFrame.height + 20, left: frameW / 2,
            id: generateId(), name: t('media_editor.layer_text')
        });

        const subtitle = new IText(t('media_editor.demotivator_subtitle'), {
            fontFamily: 'Arial', fontSize: frameW * 0.035, fill: '#ffffff',
            originX: 'center', originY: 'top', textAlign: 'center',
            top: title.top + title.height + 10, left: frameW / 2,
            id: generateId(), name: t('media_editor.layer_text')
        });

        canvas.add(newBg, flattenedImg, innerFrame, title, subtitle);
        canvas.setActiveObject(title);

        backgroundImageRef.current = flattenedImg;
        fitCanvasToContainer(canvas, core.state.zoom);

        pushHistory(canvas);
        setActiveTool('select');
    };

    return {
        id: "meme", isActive,
        renderSidebarButton: () => (<SidebarButton active={isActive} onClick={() => setActiveTool("meme")} icon={<SvgIcon name="sticker" size={20} />} label={t('media_editor.tool_meme')} />),
        renderSettingsPanel: () => {
            if (!isActive) return null;
            return (
                <div className="flex flex-col gap-4">
                    <PropertyLabel>{t('media_editor.meme_generator')}</PropertyLabel>
                    <span className="text-[11px] text-text-muted italic leading-tight mb-2">{t('media_editor.meme_hint')}</span>
                    <div className="flex flex-col gap-2">
                        <SmallButton onClick={makeDemotivator}>{t('media_editor.btn_demotivator')}</SmallButton>
                        <SmallButton onClick={makeClassicMeme}>{t('media_editor.btn_classic_meme')}</SmallButton>
                    </div>
                </div>
            );
        }
    };
};