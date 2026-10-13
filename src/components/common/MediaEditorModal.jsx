import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../modals/Modal';
import Button from '../ui/Button';
import { SvgIcon, SidebarButton, SmallButton } from './MediaEditor/EditorUI';
import { useMediaEditor } from './MediaEditor/useMediaEditor';

const LayerItem = ({ layer, level = 0, actions, t, selectedObjectId, activeFolderId }) => {
    const [expanded, setExpanded] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(layer.name);
    const [dragPosition, setDragPosition] = useState(false);

    const paddingLeft = 12 + (level * 16);
    const isSelected = selectedObjectId === layer.id || (layer.isGroup && activeFolderId === layer.id);

    const saveName = () => { actions.rename(layer, tempName); setIsEditing(false); };

    const handleDragStart = (e) => {
        e.stopPropagation(); e.dataTransfer.setData('text/plain', layer.id); e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (layer.isBg) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;

        if (layer.isGroup) {
            if (y < rect.height * 0.25) setDragPosition('top');
            else if (y > rect.height * 0.75) setDragPosition('bottom');
            else setDragPosition('inside');
        } else {
            if (y < rect.height / 2) setDragPosition('top');
            else setDragPosition('bottom');
        }
    };

    const handleDragLeave = (e) => { e.stopPropagation(); setDragPosition(false); };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setDragPosition(false);
        const draggedLayerId = e.dataTransfer.getData('text/plain');
        if (!draggedLayerId || draggedLayerId === layer.id) return;

        let pos = 'after';
        if (dragPosition === 'top') pos = 'before';
        if (dragPosition === 'inside') pos = 'inside';
        if (dragPosition === 'bottom') pos = 'after';

        actions.moveLayer(draggedLayerId, layer.id, pos);
    };

    let dropStyle = {};
    if (dragPosition === 'top') dropStyle = { borderTop: '2px solid #5B9BD5' };
    else if (dragPosition === 'bottom') dropStyle = { borderBottom: '2px solid #5B9BD5' };
    else if (dragPosition === 'inside') dropStyle = { backgroundColor: 'rgba(91, 155, 213, 0.2)', border: '1px dashed #5B9BD5' };

    return (
        <div className="flex flex-col relative">
            <div
                draggable={!layer.isBg}
                onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                className="flex items-center justify-between p-2 border-b border-border/50 text-[11px] hover:bg-input-bg transition-colors cursor-pointer group"
                style={{ paddingLeft, backgroundColor: isSelected && !dragPosition ? 'rgba(91, 155, 213, 0.15)' : 'transparent', ...dropStyle }}
                onClick={() => layer.isGroup ? actions.setActiveFolderId(layer.id) : actions.selectLayer(layer)}
            >
                <div className="flex items-center gap-2 overflow-hidden flex-1 pointer-events-none">
                    <div className="flex" style={{ width: level * 16 }}>
                        {Array.from({ length: level }).map((_, i) => (<div key={i} className="w-[16px] h-full flex items-center justify-center text-border">{i === level - 1 ? '└' : '│'}</div>))}
                    </div>

                    {layer.children?.length > 0 ? (
                        <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-text-muted hover:text-text-main flex shrink-0 w-4 justify-center pointer-events-auto">
                            {expanded ? '▼' : '▶'}
                        </button>
                    ) : (
                        <div className="w-4 shrink-0 flex justify-center text-text-muted">
                            <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: layer.visible ? '#00cc66' : '#555' }}></div>
                        </div>
                    )}

                    {layer.isGroup && <SvgIcon name="folder" size={14} className="text-theme-link opacity-80 shrink-0" />}

                    {isEditing ? (
                        <input
                            autoFocus value={tempName} onChange={e => setTempName(e.target.value)} onBlur={saveName} onKeyDown={e => e.key === 'Enter' && saveName()}
                            className="bg-transparent border-b border-theme-link text-text-main w-[100px] outline-none pointer-events-auto" onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <span className={`truncate max-w-[100px] ${isSelected ? 'text-theme-link font-bold' : 'text-text-main'} pointer-events-auto`} title={layer.name} onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                            {layer.name}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-auto" onClick={e => e.stopPropagation()}>
                    <button onClick={() => actions.toggleVisibility(layer)} className="text-text-muted hover:text-text-main p-1 ml-1"><SvgIcon name="eye" size={14} className={layer.visible ? "opacity-100 text-theme-link" : "opacity-30"} /></button>
                    {!layer.isBg && (
                        <>
                            <button onClick={() => actions.duplicate(layer)} className="text-text-muted hover:text-theme-link p-1" title={t('media_editor.duplicate')}><SvgIcon name="copy" size={12} /></button>
                            <button onClick={() => actions.remove(layer)} className="text-text-muted hover:text-theme-error p-1" title={t('media_editor.delete_selected')}><SvgIcon name="trash" size={12} /></button>
                        </>
                    )}
                </div>
            </div>
            {expanded && layer.children?.map(child => (<LayerItem key={child.id} layer={child} level={level + 1} actions={actions} t={t} selectedObjectId={selectedObjectId} activeFolderId={activeFolderId} />))}
        </div>
    );
};

export default function MediaEditorModal({ isOpen, file, onClose, onSave, stickerPacks = [] }) {
    const { t } = useTranslation();
    const { refs, state, actions, modules } = useMediaEditor({ isOpen, file, onSave, t, stickerPacks });

    const { canvasContainerRef } = refs;
    const { canvas, selectedObject, activeFolderId, zoom, layers, isCanvasReady, canUndo, canRedo } = state;
    const { setZoomSafe, undo, redo, deleteSelected, handleSave, groupObjects, ungroupObjects, layerActions, addOverlayImage } = actions;

    const hasSelection = !!selectedObject && !selectedObject?.isBackground;
    const isMultiSelection = selectedObject && selectedObject.type === 'activeSelection';
    const isGroup = selectedObject && selectedObject.type === 'group';

    const handleImageUpload = (e) => { if (e.target.files && e.target.files[0]) { addOverlayImage(e.target.files[0]); e.target.value = null; } };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen} onClose={onClose} title={t("media_editor.title")}
            sizeClass="modal-lg" dialogClassName="!w-[calc(100vw-40px)] !max-w-[1300px] max-md:!w-[100vw] max-md:!m-0"
            preventOutsideClose={true} bodyClassName="p-0 flex h-[calc(100dvh-40px)] max-h-[850px] min-h-[500px] max-md:h-[100dvh]"
        >
            <div className="w-[75px] shrink-0 border-r border-border bg-bg-page flex flex-col overflow-y-auto custom-scrollbar z-20">
                {modules.map(module => module.renderSidebarButton ? <React.Fragment key={module.id}>{module.renderSidebarButton()}</React.Fragment> : null)}
                <label className="w-full flex flex-col items-center justify-center gap-[6px] py-[12px] border-b border-border outline-none transition-colors cursor-pointer font-tahoma text-[10px] text-text-muted hover:bg-input-bg hover:text-text-main" title={t("media_editor.layer_image")}>
                    <SvgIcon name="image" size={20} />
                    <span className="text-center px-[2px] leading-tight break-words">+ {t("media_editor.add_image_layer")}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
            </div>

            <div className="flex-1 relative bg-[#1a1a1c] flex flex-col overflow-hidden min-w-0">
                <div className="absolute top-4 right-4 z-20 flex items-center gap-[6px] bg-bg-box shadow-md border border-border p-[6px] rounded-md">
                    <SmallButton disabled={!canUndo} onClick={undo}><SvgIcon name="undo" size={14} /></SmallButton>
                    <SmallButton disabled={!canRedo} onClick={redo}><SvgIcon name="redo" size={14} /></SmallButton>
                    <div className="w-[1px] h-[16px] bg-border mx-[2px]" />
                    {isMultiSelection && <SmallButton onClick={groupObjects}><SvgIcon name="layout" size={14} /></SmallButton>}
                    {isGroup && <SmallButton onClick={ungroupObjects}><SvgIcon name="crop" size={14} /></SmallButton>}
                    {(isMultiSelection || isGroup) && <div className="w-[1px] h-[16px] bg-border mx-[2px]" />}
                    {hasSelection && <SmallButton danger onClick={deleteSelected}><SvgIcon name="trash" size={14} /></SmallButton>}
                    <div className="w-[1px] h-[16px] bg-border mx-[2px]" />
                    <SmallButton onClick={() => setZoomSafe(zoom - 0.1)} disabled={zoom <= 0.5}><SvgIcon name="zoom-out" size={14} /></SmallButton>
                    <span className="w-[40px] text-center text-[11px] text-text-main font-tahoma">{Math.round(zoom * 100)}%</span>
                    <SmallButton onClick={() => setZoomSafe(zoom + 0.1)} disabled={zoom >= 2}><SvgIcon name="zoom-in" size={14} /></SmallButton>
                </div>

                <div ref={canvasContainerRef} className="absolute inset-0 flex items-center justify-center p-[20px] max-md:p-[10px] select-none overflow-auto" onClick={() => layerActions.setActiveFolderId(null)}>
                    {modules.map(module => module.renderOverlays ? <React.Fragment key={`overlay-${module.id}`}>{module.renderOverlays()}</React.Fragment> : null)}
                </div>

                {!isCanvasReady && <div className="absolute inset-0 z-10 flex items-center justify-center text-[12px] font-tahoma text-text-muted pointer-events-none">{t("media_editor.loading")}</div>}

                <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-bg-page px-[16px] py-[12px] z-20 flex items-center justify-between">
                    <div />
                    <div className="flex items-center gap-[12px]">
                        <Button variant="secondary" onClick={onClose}>{t("action.cancel")}</Button>
                        <Button onClick={() => void handleSave()} disabled={!isCanvasReady}>{t("action.save")}</Button>
                    </div>
                </div>
            </div>

            <div className="w-[320px] shrink-0 bg-bg-box border-l border-border flex flex-col z-20 shadow-[-4px_0_15px_rgba(0,0,0,0.1)]">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 border-b border-border min-h-[250px]">
                    <div className="flex flex-col gap-5">
                        {modules.map(module => module.renderSettingsPanel ? <React.Fragment key={`settings-${module.id}`}>{module.renderSettingsPanel()}</React.Fragment> : null)}
                    </div>
                </div>

                <div className="h-[46px] border-b border-border flex items-center justify-between px-4 font-bold text-[13px] text-text-main bg-header-bg shrink-0">
                    {t('media_editor.layer_front')}
                    <SmallButton onClick={layerActions.createEmptyGroup}>
                        <SvgIcon name="folder-plus" size={14} /> {t('media_editor.create_folder')}
                    </SmallButton>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col max-h-[40%]">
                    {layers.length === 0 ? <div className="text-center text-text-muted text-[11px] py-4">{t('media_editor.filter_no_image')}</div> : layers.map(layer => (
                        <LayerItem key={layer.id} layer={layer} actions={layerActions} t={t} selectedObjectId={selectedObject?.id} activeFolderId={activeFolderId} />
                    ))}
                </div>
            </div>
        </Modal>
    );
}