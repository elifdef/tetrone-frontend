import { useState, useCallback } from 'react';
import { Rect } from 'fabric';
import { generateId, OBJECT_PROPS } from '../../constants';

if (!OBJECT_PROPS.includes('folderId')) OBJECT_PROPS.push('folderId');

export const useLayers = (t) => {
    const [layers, setLayers] = useState([]);
    const [activeFolderId, setActiveFolderId] = useState(null);

    const syncLayers = useCallback((targetCanvas) => {
        if (!targetCanvas) return;

        const allObjects = targetCanvas.getObjects().filter(o => o.editorType !== "crop" && o.editorType !== "crop_overlay");
        const folders = allObjects.filter(o => o.editorType === 'folder');
        const regularObjects = allObjects.filter(o => o.editorType !== 'folder');

        const treeMap = {};
        folders.forEach(f => {
            treeMap[f.id] = {
                id: f.id, type: 'folder', name: f.name || t('media_editor.layer_group'),
                visible: f.visible, isGroup: true, isBg: false, obj: f, children: []
            };
        });

        const rootList = [];
        regularObjects.forEach(obj => {
            const isBg = obj.isBackground || obj.editorType === "background";
            const node = {
                id: obj.id || Math.random().toString(36).substring(2),
                type: obj.editorType || obj.type,
                name: obj.name || (isBg ? t('media_editor.filter_original') : t('media_editor.layer_shape')),
                visible: obj.visible, isGroup: false, isBg: isBg, obj: obj, folderId: obj.folderId
            };

            if (obj.folderId && treeMap[obj.folderId]) {
                treeMap[obj.folderId].children.push(node);
            } else {
                rootList.push(node);
            }
        });

        const finalTree = [];
        folders.forEach(f => finalTree.push(treeMap[f.id]));
        rootList.forEach(node => finalTree.push(node));

        setLayers(finalTree.reverse());
    }, [t]);

    const getLayerActions = useCallback((canvas, pushHistory, historySuspendedRef) => ({
        setActiveFolderId: (id) => setActiveFolderId(id),

        toggleVisibility: (layer) => {
            if (!canvas) return; layer.obj.set('visible', !layer.visible);
            if (layer.isGroup) {
                canvas.getObjects().forEach(o => {
                    if (o.folderId === layer.id) o.set('visible', layer.obj.visible);
                });
            }
            canvas.requestRenderAll(); syncLayers(canvas); pushHistory(canvas);
        },
        duplicate: (layer) => {
            if (!canvas || layer.isBg || layer.isGroup) return;
            layer.obj.clone(['id', 'editorType', 'name', 'folderId', 'lockRotation', 'blurIntensity']).then(clone => {
                clone.set({ id: generateId(), left: (layer.obj.left || 0) + 30, top: (layer.obj.top || 0) + 30 });
                canvas.add(clone); canvas.setActiveObject(clone); canvas.requestRenderAll(); pushHistory(canvas);
            });
        },
        remove: (layer) => {
            if (!canvas || layer.isBg) return;
            historySuspendedRef.current = true;
            if (layer.isGroup) {
                const toRemove = canvas.getObjects().filter(o => o.folderId === layer.id);
                toRemove.forEach(o => canvas.remove(o));
                if (activeFolderId === layer.id) setActiveFolderId(null);
            }
            canvas.remove(layer.obj);
            canvas.discardActiveObject(); historySuspendedRef.current = false;
            canvas.requestRenderAll(); pushHistory(canvas);
        },
        selectLayer: (layer) => {
            if (!canvas) return;
            setActiveFolderId(null);
            if (layer.isBg || layer.isGroup) canvas.discardActiveObject(); else canvas.setActiveObject(layer.obj);
            canvas.requestRenderAll();
        },
        rename: (layer, newName) => {
            if (!canvas || !newName.trim()) return;
            layer.obj.set('name', newName); syncLayers(canvas); pushHistory(canvas);
        },
        createEmptyGroup: () => {
            if (!canvas) return;
            historySuspendedRef.current = true;
            const folderId = generateId();
            const folderMarker = new Rect({
                left: -9999, top: -9999, width: 0, height: 0,
                visible: false, selectable: false, evented: false,
                id: folderId, name: t('media_editor.layer_group'), editorType: 'folder'
            });
            canvas.add(folderMarker);
            setActiveFolderId(folderId);
            historySuspendedRef.current = false; syncLayers(canvas); pushHistory(canvas);
        },
        moveLayer: (sourceId, targetId, position) => {
            if (!canvas || sourceId === targetId) return;
            const sourceObj = canvas.getObjects().find(o => o.id === sourceId);
            const targetObj = canvas.getObjects().find(o => o.id === targetId);
            if (!sourceObj || !targetObj || sourceObj.isBackground) return;

            historySuspendedRef.current = true;
            if (position === 'inside' && targetObj.editorType === 'folder') {
                sourceObj.set('folderId', targetId);
            } else {
                sourceObj.set('folderId', targetObj.folderId || null);
                const objects = canvas.getObjects();
                const sourceIdx = objects.indexOf(sourceObj);
                let targetIdx = objects.indexOf(targetObj);

                if (position === 'before') {
                    if (sourceIdx < targetIdx) canvas.moveObjectTo(sourceObj, targetIdx);
                    else canvas.moveObjectTo(sourceObj, targetIdx + 1);
                } else if (position === 'after') {
                    if (sourceIdx < targetIdx) canvas.moveObjectTo(sourceObj, targetIdx - 1);
                    else canvas.moveObjectTo(sourceObj, targetIdx);
                }
            }
            historySuspendedRef.current = false; canvas.requestRenderAll(); syncLayers(canvas); pushHistory(canvas);
        }
    }), [syncLayers, t, activeFolderId]);

    return { layers, syncLayers, getLayerActions, activeFolderId };
};