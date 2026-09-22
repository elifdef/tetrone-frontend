import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../modals/Modal';
import Button from '../ui/Button';
import StickerPicker from '../editor/StickerPicker';
import { COLORS, FONT_FAMILIES, FILTERS } from './MediaEditor/constants';
import { SvgIcon, SidebarButton, SmallButton, PropertyLabel } from './MediaEditor/EditorUI';
import { useMediaEditor } from './MediaEditor/useMediaEditor';

export default function MediaEditorModal({ isOpen, file, onClose, onSave, stickerPacks = [] }) {
  const { t } = useTranslation();
  
  const { refs, state, actions } = useMediaEditor({ isOpen, file, onSave, t });
  const { canvasContainerRef } = refs;
  const { canvas, activeTool, drawMode, color, strokeWidth, selectedObject, isComparing, stickerSearch, cropRatio, zoom, filterType, filterAmount, textBackground, isTextShadowEnabled, isCanvasReady, canUndo, canRedo } = state;
  const { setActiveTool, setDrawMode, setColor, setStrokeWidth, setStickerSearch, setCropRatio, setZoomSafe, toggleCompare, handleSave, undo, redo, addText, addShape, applyFilter, transformSelected, layerSelected, finishCrop, cancelCrop, addStickerToCanvas, deleteSelected, updateSelected, toggleShadow, resetAll } = actions;

  const hasSelection = !!selectedObject && !selectedObject?.isBackground;
  const activeIsText = hasSelection && selectedObject.editorType === "text";
  const activeIsImage = hasSelection && selectedObject.type === "image";
  const currentOpacity = hasSelection ? Math.round((selectedObject.opacity ?? 1) * 100) : 100;
  
  const getBackground = () => canvas?.getObjects().find(o => o.isBackground) || null;
  const activeFilterObject = activeIsImage ? selectedObject : getBackground();
  const activeFilterIsImage = !!activeFilterObject && activeFilterObject.type === 'image';
  const filterConfig = FILTERS.find((item) => item.key === filterType) || FILTERS[0];
  const filterTargetLabel = activeIsImage ? t("media_editor.filter_selected") : t("media_editor.filter_original");

  const toolbarCommonClass = "flex items-center gap-[5px] overflow-x-auto overflow-y-hidden scrollbar-none";

  if (!isOpen) return null;

 return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t("media_editor.title")} 
      sizeClass="modal-lg" /* Повертаємо дефолтне значення, щоб Modal.jsx не плутався */
      dialogClassName="!w-[calc(100vw-40px)] !max-w-[1200px] max-md:!w-[100vw] max-md:!m-0" /* ТУТ МАГІЯ: ! примусово розширює модалку */
      preventOutsideClose={true} 
      bodyClassName="p-0 flex h-[calc(100dvh-40px)] max-h-[850px] min-h-[500px] max-md:h-[100dvh]" 
      hideHeader={false}
    >  
      {/* ЛІВИЙ САЙДБАР (Інструменти) */}
      <div className="w-[75px] shrink-0 border-r border-border bg-bg-page flex flex-col overflow-y-auto custom-scrollbar">
        <SidebarButton active={activeTool === "select"} onClick={() => setActiveTool("select")} icon={<SvgIcon name="select" size={20} />} label={t("media_editor.tool_select")} />
        <SidebarButton active={activeTool === "transform"} onClick={() => setActiveTool("transform")} icon={<SvgIcon name="transform" size={20} />} label={t("media_editor.tool_transform")} />
        <SidebarButton active={activeTool === "crop"} onClick={() => setActiveTool(activeTool === "crop" ? "select" : "crop")} icon={<SvgIcon name="crop" size={20} />} label={t("media_editor.tool_crop")} />
        <SidebarButton active={activeTool === "draw"} onClick={() => setActiveTool("draw")} icon={<SvgIcon name="draw" size={20} />} label={t("media_editor.tool_draw")} />
        <SidebarButton active={activeTool === "shapes"} onClick={() => setActiveTool("shapes")} icon={<SvgIcon name="shapes" size={20} />} label={t("media_editor.tool_shapes")} />
        <SidebarButton active={activeTool === "text"} onClick={() => setActiveTool("text")} icon={<SvgIcon name="text" size={20} />} label={t("media_editor.tool_text")} />
        <SidebarButton active={activeTool === "sticker"} onClick={() => setActiveTool("sticker")} icon={<SvgIcon name="sticker" size={20} />} label={t("media_editor.tool_sticker")} />
        <SidebarButton active={activeTool === "filter"} onClick={() => setActiveTool("filter")} icon={<SvgIcon name="filter" size={20} />} label={t("media_editor.tool_blur")} />
        
        <div className="mt-auto border-t border-border">
            <SidebarButton disabled={!canUndo} onClick={undo} icon={<SvgIcon name="undo" size={16} />} label={t("media_editor.undo")} />
            <SidebarButton disabled={!canRedo} onClick={redo} icon={<SvgIcon name="redo" size={16} />} label={t("media_editor.redo")} />
        </div>
      </div>

      {/* ПРАВА ЧАСТИНА (Опції + Canvas) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1a1a1c] relative">
        
        {/* ВЕРХНЯ ПАНЕЛЬ ОПЦІЙ (Залежить від інструмента) */}
        <div className="shrink-0 h-[46px] flex items-center justify-between px-[12px] border-b border-border bg-bg-box shadow-sm z-10">
            
            {/* Опції для SELECT */}
            {activeTool === 'select' && (
                <div className={toolbarCommonClass}>
                    {hasSelection ? (
                        <>
                            <PropertyLabel>{t('media_editor.opacity')}:</PropertyLabel>
                            <input type="range" min="0" max="100" value={currentOpacity} onChange={(e) => updateSelected({ opacity: Number(e.target.value) / 100 })} className="w-[100px]" />
                            <span className="text-[10px] text-text-muted min-w-[32px]">{currentOpacity}%</span>
                        </>
                    ) : (
                        <div className="text-[11px] text-text-muted italic">{t('media_editor.select_tool_hint')}</div>
                    )}
                </div>
            )}

            {/* Опції для TRANSFORM */}
            {activeTool === 'transform' && (
                <div className={toolbarCommonClass}>
                    <PropertyLabel>{t('media_editor.rotate')}</PropertyLabel>
                    <SmallButton disabled={!hasSelection} onClick={() => transformSelected('rotL')} title={t('media_editor.rotate_left')}><SvgIcon name="rotate-left" size={13} /></SmallButton>
                    <SmallButton disabled={!hasSelection} onClick={() => transformSelected('rotR')} title={t('media_editor.rotate_right')}><SvgIcon name="rotate-right" size={13} /></SmallButton>
                    <SmallButton disabled={!hasSelection} onClick={() => transformSelected('flipH')} title={t('media_editor.flip_h')}><SvgIcon name="flip-h" size={13} /></SmallButton>
                    <SmallButton disabled={!hasSelection} onClick={() => transformSelected('flipV')} title={t('media_editor.flip_v')}><SvgIcon name="flip-v" size={13} /></SmallButton>
                    <SmallButton disabled={!hasSelection} onClick={() => transformSelected('dup')} title={t('media_editor.duplicate')}><SvgIcon name="copy" size={13} /><span className="max-md:hidden">{t('media_editor.duplicate')}</span></SmallButton>
                    <span className="w-[1px] h-[18px] bg-border mx-[2px]" />
                    <SmallButton disabled={!hasSelection} onClick={() => transformSelected('centH')} title={t('media_editor.center_h')}><SvgIcon name="center-h" size={13} /></SmallButton>
                    <SmallButton disabled={!hasSelection} onClick={() => transformSelected('centV')} title={t('media_editor.center_v')}><SvgIcon name="center-v" size={13} /></SmallButton>
                    <span className="w-[1px] h-[18px] bg-border mx-[2px]" />
                    <SmallButton disabled={!hasSelection} onClick={() => layerSelected('fw')} title={t('media_editor.layer_forward')}><SvgIcon name="front" size={13} /></SmallButton>
                    <SmallButton disabled={!hasSelection} onClick={() => layerSelected('bk')} title={t('media_editor.layer_back')}><SvgIcon name="back" size={13} /></SmallButton>
                </div>
            )}

            {/* Опції для CROP */}
            {activeTool === 'crop' && (
                <div className={toolbarCommonClass}>
                    <PropertyLabel>{t('media_editor.crop_ratio')}</PropertyLabel>
                    <SmallButton active={cropRatio === "free"} onClick={() => setCropRatio("free")}>{t("media_editor.ratio_free")}</SmallButton>
                    <SmallButton active={cropRatio === "square"} onClick={() => setCropRatio("square")}>1:1</SmallButton>
                    <SmallButton active={cropRatio === "landscape"} onClick={() => setCropRatio("landscape")}>16:9</SmallButton>
                    <SmallButton active={cropRatio === "classic"} onClick={() => setCropRatio("classic")}>4:3</SmallButton>
                    <SmallButton active={cropRatio === "portrait"} onClick={() => setCropRatio("portrait")}>9:16</SmallButton>
                    <span className="w-[1px] h-[18px] bg-border mx-[2px]" />
                    <SmallButton onClick={cancelCrop}><SvgIcon name="close" size={13} /> {t("media_editor.cancel_crop")}</SmallButton>
                    <SmallButton active onClick={finishCrop}><SvgIcon name="check" size={13} /> {t("media_editor.apply_crop")}</SmallButton>
                </div>
            )}

            {/* Опції для DRAW */}
            {activeTool === 'draw' && (
                <div className={toolbarCommonClass}>
                    <SmallButton active={drawMode === "pencil"} onClick={() => setDrawMode("pencil")}>{t("media_editor.draw_pencil")}</SmallButton>
                    <SmallButton active={drawMode === "line"} onClick={() => setDrawMode("line")}>{t("media_editor.draw_line")}</SmallButton>
                    <span className="w-[1px] h-[18px] bg-border mx-[2px]" />
                    <PropertyLabel>{t('media_editor.color')}</PropertyLabel>
                    {COLORS.map(c => <button key={c} onClick={() => setColor(c)} style={{backgroundColor: c}} className={`w-[18px] h-[18px] border cursor-pointer ${color === c ? 'border-theme-link shadow-[0_0_0_1px_var(--theme-link)]' : 'border-border'}`} />)}
                    <span className="w-[1px] h-[18px] bg-border mx-[2px]" />
                    <PropertyLabel>{t('media_editor.size')}</PropertyLabel>
                    <input type="range" min="1" max="60" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-[100px]" />
                </div>
            )}

            {/* Опції для SHAPES */}
            {activeTool === 'shapes' && (
                <div className={toolbarCommonClass}>
                    <SmallButton onClick={() => addShape('rect', false)}>{t("media_editor.add_rect")}</SmallButton>
                    <SmallButton onClick={() => addShape('rect', true)}>{t("media_editor.add_round_rect")}</SmallButton>
                    <SmallButton onClick={() => addShape('circle')}>{t("media_editor.add_circle")}</SmallButton>
                    <SmallButton onClick={() => addShape('triangle')}>{t("media_editor.add_triangle")}</SmallButton>
                    <SmallButton onClick={() => addShape('star')}>{t("media_editor.add_star")}</SmallButton>
                    <SmallButton onClick={() => addShape('arrow')}>{t("media_editor.add_arrow")}</SmallButton>
                    <SmallButton onClick={() => addShape('highlight')}>{t("media_editor.add_highlight")}</SmallButton>
                    <SmallButton onClick={() => addShape('censor')}>{t("media_editor.add_censor")}</SmallButton>
                    <span className="w-[1px] h-[18px] bg-border mx-[2px]" />
                    {COLORS.slice(1).map(c => <button key={c} onClick={() => setColor(c)} style={{backgroundColor: c}} className={`w-[18px] h-[18px] border cursor-pointer ${color === c ? 'border-theme-link shadow-[0_0_0_1px_var(--theme-link)]' : 'border-border'}`} />)}
                </div>
            )}

            {/* Опції для TEXT */}
            {activeTool === 'text' && (
                <div className={toolbarCommonClass}>
                    <SmallButton onClick={addText}><SvgIcon name="text" size={13} /> {t("media_editor.add_text")}</SmallButton>
                    {activeIsText && (
                        <>
                            <span className="w-[1px] h-[18px] bg-border mx-[2px]" />
                            <select value={selectedObject.fontFamily || "Tahoma"} onChange={(e) => updateSelected({ fontFamily: e.target.value }, true)} className="h-[28px] bg-input-bg border border-border px-[6px] text-[10px] text-text-main outline-none">
                                {FONT_FAMILIES.map((family) => (<option key={family} value={family}>{family}</option>))}
                            </select>
                            <input type="number" min="8" max="300" value={Math.round(selectedObject.fontSize || 64)} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} className="w-[45px] h-[28px] px-[5px] bg-input-bg border border-border text-[10px] text-text-main outline-none" />
                            <SmallButton active={selectedObject.fontWeight === "bold"} onClick={() => updateSelected({ fontWeight: selectedObject.fontWeight === "bold" ? "normal" : "bold" }, true)}><SvgIcon name="bold" size={13} /></SmallButton>
                            <SmallButton active={selectedObject.fontStyle === "italic"} onClick={() => updateSelected({ fontStyle: selectedObject.fontStyle === "italic" ? "normal" : "italic" }, true)}><SvgIcon name="italic" size={13} /></SmallButton>
                            <SmallButton active={selectedObject.underline} onClick={() => updateSelected({ underline: !selectedObject.underline }, true)}><SvgIcon name="underline" size={13} /></SmallButton>
                            <span className="w-[1px] h-[18px] bg-border mx-[2px]" />
                            <PropertyLabel>{t('media_editor.color')}</PropertyLabel>
                            <input type="color" value={selectedObject.fill} onChange={(e) => updateSelected({ fill: e.target.value })} className="w-[28px] h-[28px] p-0 bg-transparent border border-border cursor-pointer" />
                            <input type="text" value={textBackground} onChange={(e) => { setTextBackground(e.target.value); updateSelected({ backgroundColor: e.target.value || "" }); }} placeholder={t("media_editor.text_background")} className="w-[80px] h-[28px] px-[6px] bg-input-bg border border-border text-[10px] text-text-main outline-none" />
                            <SmallButton active={!!selectedObject.shadow} onClick={toggleShadow}><SvgIcon name="shadow" size={13} /><span className="max-md:hidden">{t("media_editor.shadow")}</span></SmallButton>
                        </>
                    )}
                </div>
            )}

            {/* Опції для FILTER */}
            {activeTool === 'filter' && (
                <div className={toolbarCommonClass}>
                    <PropertyLabel>{filterTargetLabel}</PropertyLabel>
                    {!activeFilterIsImage && <span className="text-[10px] text-theme-error ml-2">{t("media_editor.filter_no_image")}</span>}
                    <span className="w-[1px] h-[18px] bg-border mx-[2px]" />
                    {FILTERS.map((f) => (
                        <SmallButton key={f.key} active={filterType === f.key} disabled={!activeFilterIsImage} onClick={() => applyFilter(f.key, f.defaultValue)}>
                            {t(`media_editor.${f.translation}`)}
                        </SmallButton>
                    ))}
                    {filterType !== "none" && activeFilterIsImage && (
                        <>
                            <span className="w-[1px] h-[18px] bg-border mx-[2px]" />
                            <input type="range" min={filterConfig.min} max={filterConfig.max} step={filterConfig.step} value={filterAmount} onChange={(e) => applyFilter(filterType, Number(e.target.value))} className="w-[100px]" />
                        </>
                    )}
                </div>
            )}

            {/* STICKER (Пустий бар) */}
            {activeTool === 'sticker' && <div className="text-[11px] text-text-muted italic px-[4px]">{t("media_editor.tool_sticker")}</div>}

            {/* Зум і Видалити (Завжди збоку) */}
            <div className="flex items-center gap-[8px] ml-auto bg-bg-box pl-[8px]">
                {hasSelection && (
                    <SmallButton danger onClick={deleteSelected} title={t("media_editor.delete_selected")}>
                        <SvgIcon name="trash" size={13} />
                    </SmallButton>
                )}
                <div className="w-[1px] h-[16px] bg-border ml-[4px] mr-[4px]" />
                <button type="button" onPointerDown={() => toggleCompare(true)} onPointerUp={() => toggleCompare(false)} onPointerLeave={() => toggleCompare(false)} className={`shrink-0 inline-flex items-center gap-[6px] h-[28px] px-[9px] border-none outline-none font-tahoma text-[10px] cursor-pointer transition-colors ${isComparing ? "bg-theme-link text-white" : "bg-transparent text-text-muted hover:text-theme-link"}`} title={t("media_editor.compare_hint")}>
                    <SvgIcon name="compare" size={13} />
                </button>
                <div className="w-[1px] h-[16px] bg-border ml-[4px] mr-[4px]" />
                <SmallButton onClick={() => setZoomSafe(zoom - 0.1)} disabled={zoom <= 0.5}><SvgIcon name="zoom-out" size={13} /></SmallButton>
                <span className="w-[36px] text-center text-[10px] text-text-muted font-tahoma">{Math.round(zoom * 100)}%</span>
                <SmallButton onClick={() => setZoomSafe(zoom + 0.1)} disabled={zoom >= 2}><SvgIcon name="zoom-in" size={13} /></SmallButton>
            </div>
        </div>

        {/* СТІКЕРИ (Випадають під верхньою панеллю) */}
        {activeTool === "sticker" && stickerPacks?.length > 0 && (
          <div className="absolute top-[46px] left-[0px] z-50 shadow-lg border-b border-r border-border max-h-[300px] overflow-auto bg-bg-box p-[8px]">
            <StickerPicker packs={stickerPacks} favorites={[]} isLoading={false} searchQuery={stickerSearch} onSearchChange={setStickerSearch} onSelect={addStickerToCanvas} />
          </div>
        )}

        {/* ОСНОВНЕ ПОЛОТНО */}
        <div className="relative flex-1 min-h-0 bg-[#1a1a1c]">
          <div ref={canvasContainerRef} className="absolute inset-0 flex items-center justify-center overflow-auto p-[20px] max-md:p-[10px] select-none" />
          {!isCanvasReady && <div className="absolute inset-0 z-10 flex items-center justify-center text-[11px] font-tahoma text-text-muted pointer-events-none">{t("media_editor.loading")}</div>}
        </div>

        {/* ФУТЕР */}
        <div className="shrink-0 border-t border-border bg-bg-page px-[12px] py-[10px]">
          <div className="flex items-center justify-between gap-[10px]">
              <button type="button" onClick={resetAll} className="text-theme-error hover:underline text-[11px] font-tahoma cursor-pointer bg-transparent border-none outline-none whitespace-nowrap">{t("media_editor.reset_all")}</button>
              <div className="flex items-center gap-[8px]">
                  <Button variant="secondary" onClick={onClose}>{t("action.cancel")}</Button>
                  <Button onClick={() => void handleSave()} disabled={!isCanvasReady}>{t("action.save")}</Button>
              </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}