import { useEffect } from 'react';
import { Rect, FabricImage, filters } from 'fabric';

export const useCensorEffect = (canvas, historySuspendedRef, pushHistory) => {
    useEffect(() => {
        if (!canvas) return;

        const onMoving = (e) => {
            const obj = e.target;
            if (obj && obj.editorType === 'censor') {
                if (!obj.previewRect) {
                    obj.set('opacity', 0);
                    const rect = new Rect({
                        left: obj.left, top: obj.top, width: obj.width, height: obj.height,
                        scaleX: obj.scaleX, scaleY: obj.scaleY, originX: obj.originX, originY: obj.originY,
                        fill: 'rgba(150,150,150,0.5)', selectable: false, evented: false
                    });
                    canvas.add(rect); obj.previewRect = rect;
                } else {
                    obj.previewRect.set({ left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY });
                }
                canvas.requestRenderAll();
            }
        };

        const updateCensor = async (obj) => {
            historySuspendedRef.current = true;
            if (obj.previewRect) { canvas.remove(obj.previewRect); obj.previewRect = null; }
            obj.visible = false; canvas.requestRenderAll();

            const vpt = canvas.viewportTransform;
            canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

            const bound = obj.getBoundingRect();
            if (bound.width <= 0 || bound.height <= 0) {
                canvas.setViewportTransform(vpt); obj.visible = true; historySuspendedRef.current = false; return;
            }

            const dataUrl = canvas.toDataURL({ left: bound.left, top: bound.top, width: bound.width, height: bound.height, format: 'png', multiplier: 0.25 });
            canvas.setViewportTransform(vpt);

            try {
                const tempImg = await FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
                const newCensor = new FabricImage(tempImg.getElement(), {
                    left: bound.left, top: bound.top, originX: 'left', originY: 'top',
                    scaleX: bound.width / tempImg.width, scaleY: bound.height / tempImg.height,
                    editorType: "censor", id: obj.id, name: obj.name, lockRotation: true,
                    folderId: obj.folderId, blurIntensity: obj.blurIntensity || 0.5
                });

                newCensor.filters = [new filters.Blur({ blur: obj.blurIntensity || 0.5 })];
                newCensor.applyFilters();

                const idx = canvas.getObjects().indexOf(obj);
                canvas.remove(obj); canvas.add(newCensor); canvas.moveObjectTo(newCensor, idx); canvas.setActiveObject(newCensor);
            } catch(e) { obj.visible = true; obj.set('opacity', 1); }

            historySuspendedRef.current = false; canvas.requestRenderAll(); pushHistory(canvas);
        };

        const onMod = (e) => {
            const obj = e.target;
            if (!historySuspendedRef.current && obj) {
                if (obj.editorType === 'censor') { obj.set('opacity', 1); updateCensor(obj); }
                else { pushHistory(canvas); }
            }
        };

        // НОВИЙ СЛУХАЧ: Ловимо щойно намальований сірий квадрат!
        const onAdd = (e) => {
            const obj = e.target;
            // Перевіряємо, чи це саме щойно створена фігура цензури (ще не перетворена на блюр-картинку)
            if (obj && obj.editorType === 'censor' && obj.type === 'rect') {
                // Вішаємо слухача 'modified' безпосередньо на самий об'єкт.
                // Коли ми відпустимо мишку після малювання, він спрацює миттєво.
                obj.on('modified', () => {
                    if (!historySuspendedRef.current) {
                        updateCensor(obj);
                    }
                });
            }
        };

        canvas.on("object:moving", onMoving);
        canvas.on("object:scaling", onMoving);
        canvas.on("object:modified", onMod);
        canvas.on("object:added", onAdd); // Підключаємо слухач створення

        return () => {
            canvas.off("object:moving", onMoving);
            canvas.off("object:scaling", onMoving);
            canvas.off("object:modified", onMod);
            canvas.off("object:added", onAdd); // Відключаємо при демонтажі
        };
    }, [canvas, pushHistory, historySuspendedRef]);
};