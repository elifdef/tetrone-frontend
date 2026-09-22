import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, Circle, FabricImage, IText, Line, Path, PencilBrush, Polygon, Rect, Shadow, Triangle, filters } from "fabric";
import { dataURLtoFile } from '../../../utils/upload';
import { OBJECT_PROPS, CROP_RATIOS, FILTERS } from './constants';

function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
function isIText(object) { return object instanceof IText; }
function isFabricImage(object) { return object instanceof FabricImage; }

export const useMediaEditor = ({ isOpen, file, onSave, t }) => {
  const canvasContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const originalSourceRef = useRef(null);
  const originalObjectUrlRef = useRef(null);
  const cropRectRef = useRef(null);
  const drawLineRef = useRef(null);

  const historyRef = useRef({ stack: [], index: -1, lastSignature: "" });
  const historyTimerRef = useRef(null);
  const historySuspendedRef = useRef(false);
  const mountedRef = useRef(false);

  const [canvas, setCanvas] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [drawMode, setDrawMode] = useState("pencil");
  const [color, setColor] = useState("#ff3347");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [selectedObject, setSelectedObject] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [stickerSearch, setStickerSearch] = useState("");
  const [cropRatio, setCropRatio] = useState("free");
  const [zoom, setZoom] = useState(1);
  const [filterType, setFilterType] = useState("none");
  const [filterAmount, setFilterAmount] = useState(0);
  const [textBackground, setTextBackground] = useState("");
  const [isTextShadowEnabled, setIsTextShadowEnabled] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);

  // ІДЕАЛЬНИЙ ФІКС: Ці функції більше не залежать від state (розірвано петлю рендеру)
  const getBackground = useCallback((targetCanvas) => {
    if (!targetCanvas) return null;
    const objs = targetCanvas.getObjects();
    if (!objs || objs.length === 0) return null;
    return objs.find(o => o.isBackground || o.editorType === "background") || objs[0];
  }, []);

  const getCenter = useCallback((targetCanvas) => {
    const bg = getBackground(targetCanvas);
    if (bg?.width && bg?.height) return { x: bg.width / 2, y: bg.height / 2 };
    return { x: targetCanvas?.getWidth?.() / 2 || 0, y: targetCanvas?.getHeight?.() / 2 || 0 };
  }, [getBackground]);

  const serializeCanvas = useCallback((targetCanvas) => targetCanvas.toJSON(OBJECT_PROPS), []);

  const pushHistory = useCallback((targetCanvas) => {
    if (!targetCanvas || historySuspendedRef.current) return;
    const json = serializeCanvas(targetCanvas);
    const signature = JSON.stringify(json);
    if (historyRef.current.lastSignature === signature) return;
    const stack = historyRef.current.stack.slice(0, historyRef.current.index + 1);
    stack.push({ json, signature });
    if (stack.length > 60) stack.shift();
    historyRef.current = { stack, index: stack.length - 1, lastSignature: signature };
    setHistoryVersion(v => v + 1);
  }, [serializeCanvas]);

  const scheduleHistory = useCallback((targetCanvas) => {
    if (!targetCanvas) return;
    clearTimeout(historyTimerRef.current);
    historyTimerRef.current = setTimeout(() => pushHistory(targetCanvas), 350);
  }, [pushHistory]);

  const flushHistory = useCallback(() => {
    if (!canvas) return;
    clearTimeout(historyTimerRef.current);
    pushHistory(canvas);
  }, [canvas, pushHistory]);

  const fitCanvasToContainer = useCallback((targetCanvas, targetZoom) => {
    const container = canvasContainerRef.current;
    if (!targetCanvas || !container) return;
    const bg = getBackground(targetCanvas);
    if (!bg?.width || !bg?.height) return;

    const width = Number(bg.width);
    const height = Number(bg.height);
    const padding = window.innerWidth <= 768 ? 16 : 32;
    const aW = Math.max(100, container.clientWidth - padding);
    const aH = Math.max(100, container.clientHeight - padding);
    const fitScale = Math.min(aW / width, aH / height);
    const displayScale = fitScale * clamp(Number(targetZoom) || 1, 0.5, 2);

    targetCanvas.setDimensions({ width, height }, { backstoreOnly: true });
    targetCanvas.setDimensions({ width: `${Math.max(1, Math.round(width * displayScale))}px`, height: `${Math.max(1, Math.round(height * displayScale))}px` }, { cssOnly: true });
    targetCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    targetCanvas.calcOffset();
    targetCanvas.requestRenderAll();
  }, [getBackground]);

  const prepareBackground = useCallback((image) => {
    image.set({
      left: 0, top: 0, originX: "left", originY: "top", scaleX: 1, scaleY: 1,
      selectable: false, evented: false, hoverCursor: "default", isBackground: true,
      editorType: "background"
    });
    return image;
  }, []);

  const restoreHistory = useCallback(async (index) => {
    if (!canvas || !historyRef.current.stack[index]) return;
    try {
      historySuspendedRef.current = true;
      await canvas.loadFromJSON(historyRef.current.stack[index].json);
      const bg = getBackground(canvas);
      backgroundImageRef.current = bg;
      if (bg) {
        canvas.setDimensions({ width: bg.width || 1, height: bg.height || 1 }, { backstoreOnly: true });
        fitCanvasToContainer(canvas, zoom);
      }
      cropRectRef.current = canvas.getObjects().find(o => o.editorType === "crop") || null;
      canvas.discardActiveObject(); setSelectedObject(null);
      historyRef.current.index = index; 
      historyRef.current.lastSignature = historyRef.current.stack[index].signature;
      historySuspendedRef.current = false; setHistoryVersion(v => v + 1);
      canvas.requestRenderAll();
    } catch (e) { historySuspendedRef.current = false; }
  }, [canvas, fitCanvasToContainer, getBackground, zoom]);

  const undo = useCallback(async () => {
    if (!canvas) return;
    flushHistory();
    const cur = historyRef.current.index;
    if (cur <= 0) return;
    await restoreHistory(cur - 1);
  }, [canvas, flushHistory, restoreHistory]);

  const redo = useCallback(async () => {
    const cur = historyRef.current.index;
    if (cur >= historyRef.current.stack.length - 1) return;
    await restoreHistory(cur + 1);
  }, [restoreHistory]);

  const deleteSelected = useCallback(() => {
    if (!canvas) return;
    const bg = getBackground(canvas);
    const objs = canvas.getActiveObjects().filter(o => o !== bg && o.editorType !== "crop");
    if (!objs.length) return;
    historySuspendedRef.current = true;
    canvas.discardActiveObject();
    objs.forEach(o => canvas.remove(o));
    historySuspendedRef.current = false;
    setSelectedObject(null);
    canvas.requestRenderAll();
    pushHistory(canvas);
  }, [canvas, getBackground, pushHistory]);

  // Ініціалізація (Цей ефект тепер спрацює РІВНО 1 РАЗ при відкритті)
  useEffect(() => {
    if (!isOpen || !file || !canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    let cancelled = false;
    mountedRef.current = true;
    setIsCanvasReady(false);

    while (container.firstChild) container.removeChild(container.firstChild);
    const canvasElement = document.createElement("canvas");
    canvasElement.tabIndex = 0;
    container.appendChild(canvasElement);

    const fabricCanvas = new Canvas(canvasElement, {
      selection: true, preserveObjectStacking: true, renderOnAddRemove: true,
      enableRetinaScaling: false, backgroundColor: "#1a1a1c",
    });

    if (fabricCanvas.wrapperEl) {
      fabricCanvas.wrapperEl.style.margin = "auto";
      fabricCanvas.wrapperEl.style.flexShrink = "0";
    }
    canvasRef.current = fabricCanvas;

    const source = (() => {
      if (file instanceof File) {
        if (originalObjectUrlRef.current) URL.revokeObjectURL(originalObjectUrlRef.current);
        const objectUrl = URL.createObjectURL(file);
        originalObjectUrlRef.current = objectUrl;
        originalSourceRef.current = objectUrl;
        return objectUrl;
      }
      const s = typeof file === "string" ? file : (file?.url || file?.src);
      originalSourceRef.current = s;
      return s;
    })();

    if (!source) { fabricCanvas.dispose(); return; }

    const init = async () => {
      try {
        const image = await FabricImage.fromURL(source, { crossOrigin: "anonymous" });
        if (cancelled || !image) return;

        prepareBackground(image);
        fabricCanvas.setDimensions({ width: image.width || 1, height: image.height || 1 }, { backstoreOnly: true });
        fabricCanvas.add(image);
        if (fabricCanvas.sendObjectToBack) {
            fabricCanvas.sendObjectToBack(image);
        } else if (image.sendToBack) {
            image.sendToBack();
        }
        
        backgroundImageRef.current = image;
        fabricCanvas.discardActiveObject();
        
        historySuspendedRef.current = true;
        const initialJson = serializeCanvas(fabricCanvas);
        historyRef.current = { stack: [{ json: initialJson, signature: JSON.stringify(initialJson) }], index: 0, lastSignature: JSON.stringify(initialJson) };
        historySuspendedRef.current = false;
        
        setCanvas(fabricCanvas);
        setIsCanvasReady(true);
        requestAnimationFrame(() => { if (!cancelled && container) fitCanvasToContainer(fabricCanvas, 1); });
      } catch (e) { console.error("Editor load error:", e); }
    };
    init();

    return () => {
      cancelled = true; mountedRef.current = false;
      clearTimeout(historyTimerRef.current);
      try { fabricCanvas.dispose(); } catch (e) {}
      if (container && container.contains(canvasElement)) container.removeChild(canvasElement);
      canvasRef.current = null; setCanvas(null); setIsCanvasReady(false);
      if (originalObjectUrlRef.current) URL.revokeObjectURL(originalObjectUrlRef.current);
    };
  }, [file, isOpen]); // ЖОРСТКА ФІКСАЦІЯ: Тільки ці залежності, жодних інших хуків!

  // Підписка на клавіатуру 
  useEffect(() => {
    if (!canvas) return;
    const handleKeyDown = (e) => {
      const active = canvas.getActiveObject();
      const bg = getBackground(canvas);
      
      if (active instanceof IText && active.isEditing) {
        if (e.key === "Escape") { active.exitEditing(); canvas.discardActiveObject(); canvas.requestRenderAll(); }
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
        if (e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
      }
      if (e.key === "Escape") { canvas.discardActiveObject(); setSelectedObject(null); if (activeTool === "crop") setActiveTool("select"); canvas.requestRenderAll(); return; }
      if (e.key === "Delete" || e.key === "Backspace") { 
        if (!active || active === bg || active.editorType === "crop") return; 
        e.preventDefault(); deleteSelected(); 
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool, canvas, deleteSelected, getBackground, redo, undo]);

  // Події Fabric
  useEffect(() => {
    if (!canvas) return;
    const onMod = (e) => { 
        const bg = getBackground(canvas);
        if (!historySuspendedRef.current && e?.target !== bg && e?.target?.editorType !== "crop") pushHistory(canvas); 
    };
    const onSel = () => { 
        const bg = getBackground(canvas);
        const act = canvas.getActiveObject(); 
        setSelectedObject(act && act !== bg ? act : null); 
    };
    const onText = (e) => { 
        const bg = getBackground(canvas);
        if (!historySuspendedRef.current && e?.target && e.target !== bg) scheduleHistory(canvas); 
    };
    const onPath = (e) => { 
        if (!historySuspendedRef.current) { if (e?.path) e.path.editorType = "drawing"; pushHistory(canvas); }
    };

    canvas.on("selection:created", onSel); canvas.on("selection:updated", onSel); canvas.on("selection:cleared", onSel);
    canvas.on("object:modified", onMod); canvas.on("object:added", onMod); canvas.on("object:removed", onMod);
    canvas.on("text:changed", onText); canvas.on("path:created", onPath);
    
    return () => {
      canvas.off("selection:created", onSel); canvas.off("selection:updated", onSel); canvas.off("selection:cleared", onSel);
      canvas.off("object:modified", onMod); canvas.off("object:added", onMod); canvas.off("object:removed", onMod);
      canvas.off("text:changed", onText); canvas.off("path:created", onPath);
    };
  }, [canvas, getBackground, pushHistory, scheduleHistory]);

  // Ресайз вікна
  useEffect(() => {
    if (!canvas) return;
    const update = () => fitCanvasToContainer(canvas, zoom);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [canvas, fitCanvasToContainer, zoom]);

  // Малювання
  useEffect(() => {
    if (!canvas) return;
    const isDrawing = activeTool === "draw";
    canvas.isDrawingMode = isDrawing && drawMode === "pencil";
    canvas.selection = !isDrawing;
    canvas.defaultCursor = isDrawing ? "crosshair" : "default";
    if (isDrawing && drawMode === "pencil") {
      if (!canvas.freeDrawingBrush) canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = Number(strokeWidth);
      canvas.freeDrawingBrush.limitedToCanvasSize = true;
    }
  }, [activeTool, canvas, color, drawMode, strokeWidth]);

  // Лінія
  useEffect(() => {
    if (!canvas || activeTool !== "draw" || drawMode !== "line") return;
    let startPoint = null;
    const onMouseDown = (e) => {
      if (!e?.scenePoint) return;
      startPoint = e.scenePoint;
      const line = new Line([startPoint.x, startPoint.y, startPoint.x, startPoint.y], { stroke: color, strokeWidth: Number(strokeWidth), fill: null, selectable: false, evented: false, editorType: "drawing" });
      historySuspendedRef.current = true; drawLineRef.current = line; canvas.add(line); historySuspendedRef.current = false;
    };
    const onMouseMove = (e) => {
      if (!startPoint || !drawLineRef.current || !e?.scenePoint) return;
      drawLineRef.current.set({ x2: e.scenePoint.x, y2: e.scenePoint.y });
      drawLineRef.current.setCoords(); canvas.requestRenderAll();
    };
    const onMouseUp = () => {
      const temp = drawLineRef.current;
      if (!temp || !startPoint) { startPoint = null; drawLineRef.current = null; return; }
      const x2 = Number(temp.x2), y2 = Number(temp.y2);
      const length = Math.hypot(x2 - startPoint.x, y2 - startPoint.y);
      historySuspendedRef.current = true; canvas.remove(temp);
      if (length >= 2) {
        const finalLine = new Line([startPoint.x, startPoint.y, x2, y2], { stroke: color, strokeWidth: Number(strokeWidth), selectable: true, evented: true, editorType: "drawing" });
        canvas.add(finalLine); canvas.setActiveObject(finalLine); setSelectedObject(finalLine);
      }
      historySuspendedRef.current = false; drawLineRef.current = null; startPoint = null;
      canvas.selection = false; canvas.requestRenderAll(); pushHistory(canvas);
    };
    canvas.on("mouse:down", onMouseDown); canvas.on("mouse:move", onMouseMove); canvas.on("mouse:up", onMouseUp);
    return () => {
      canvas.off("mouse:down", onMouseDown); canvas.off("mouse:move", onMouseMove); canvas.off("mouse:up", onMouseUp);
      if (drawLineRef.current) { historySuspendedRef.current = true; canvas.remove(drawLineRef.current); historySuspendedRef.current = false; drawLineRef.current = null; }
    };
  }, [activeTool, canvas, color, drawMode, pushHistory, strokeWidth]);

  // Кроп
  useEffect(() => {
    if (activeTool !== "crop" || !canvas) {
      if (cropRectRef.current && canvas) {
        historySuspendedRef.current = true; canvas.remove(cropRectRef.current); cropRectRef.current = null; historySuspendedRef.current = false; canvas.requestRenderAll();
      }
      return;
    }
    if (cropRectRef.current) return;
    const bg = getBackground(canvas);
    if (!bg?.width || !bg?.height) return;
    const crop = new Rect({ left: bg.width / 2, top: bg.height / 2, originX: "center", originY: "center", width: bg.width * 0.78, height: bg.height * 0.78, fill: "rgba(255,255,255,0.04)", stroke: "#ffffff", strokeWidth: 3, strokeDashArray: [12, 8], transparentCorners: false, cornerSize: 12, touchCornerSize: 22, lockRotation: true, lockUniScaling: cropRatio !== "free", hasControls: true, selectable: true, evented: true, editorType: "crop", excludeFromExport: true });
    
    const keepInside = () => {
      const w = crop.getScaledWidth(), h = crop.getScaledHeight(), hw = w / 2, hh = h / 2;
      crop.set({ left: clamp(crop.left, hw, bg.width - hw), top: clamp(crop.top, hh, bg.height - hh) });
      if (w > bg.width) { crop.scaleX = bg.width / Math.max(crop.width, 1); crop.setCoords(); }
      if (h > bg.height) { crop.scaleY = Math.min(crop.scaleY, bg.height / Math.max(crop.height, 1)); crop.setCoords(); }
    };
    crop.on("moving", keepInside); crop.on("scaling", keepInside);
    historySuspendedRef.current = true; cropRectRef.current = crop; canvas.add(crop); canvas.setActiveObject(crop); historySuspendedRef.current = false; canvas.requestRenderAll();
  }, [activeTool, canvas, cropRatio, getBackground]);

  useEffect(() => {
    const crop = cropRectRef.current;
    const bg = getBackground(canvas);
    if (!crop || !bg || activeTool !== "crop") return;
    const ratio = CROP_RATIOS[cropRatio];
    historySuspendedRef.current = true;
    if (!ratio) { crop.set({ lockUniScaling: false }); historySuspendedRef.current = false; canvas?.requestRenderAll(); return; }
    let w = crop.getScaledWidth(), h = w / ratio;
    if (h > bg.height * 0.92) { h = bg.height * 0.92; w = h * ratio; }
    if (w > bg.width * 0.92) { w = bg.width * 0.92; h = w / ratio; }
    crop.scaleX = w / Math.max(crop.width, 1); crop.scaleY = h / Math.max(crop.height, 1);
    crop.set({ lockUniScaling: true }); crop.setCoords();
    historySuspendedRef.current = false; canvas?.requestRenderAll();
  }, [activeTool, canvas, cropRatio, getBackground]);

  // Інструменти
  const addShape = useCallback((type, rounded = false) => {
    if (!canvas) return;
    const center = getCenter(canvas);
    let shape;
    const props = { left: center.x, top: center.y, originX: "center", originY: "center", fill: `${color}33`, stroke: color, strokeWidth: Number(strokeWidth), editorType: "shape" };
    
    if (type === 'rect') shape = new Rect({ ...props, width: 320, height: 200, rx: rounded ? 20 : 0, ry: rounded ? 20 : 0 });
    else if (type === 'circle') shape = new Circle({ ...props, radius: 110 });
    else if (type === 'triangle') shape = new Triangle({ ...props, width: 240, height: 200 });
    else if (type === 'star') {
      const points = [];
      for (let i = 0; i < 10; i++) { const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 10; const radius = i % 2 === 0 ? 120 : 55; points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }); }
      shape = new Polygon(points, props);
    }
    else if (type === 'arrow') {
      const length = Math.min(canvas.getWidth(), canvas.getHeight()) * 0.28;
      shape = new Path(`M 0 0 L ${length} 0 M ${length - 34} -18 L ${length} 0 L ${length - 34} 18`, { ...props, left: center.x - length / 2, fill: "", strokeLineCap: "round", strokeLineJoin: "round" });
    }
    else if (type === 'highlight') shape = new Rect({ ...props, width: 420, height: 80, fill: "rgba(255,235,59,0.35)", strokeWidth: 0, rx: 6, ry: 6 });
    else if (type === 'censor') shape = new Rect({ ...props, width: 360, height: 80, fill: "#111111", strokeWidth: 0 });

    canvas.add(shape); canvas.setActiveObject(shape); setSelectedObject(shape); canvas.requestRenderAll(); pushHistory(canvas);
  }, [canvas, color, getCenter, strokeWidth, pushHistory]);

  const addText = useCallback(() => {
    if (!canvas) return;
    const center = getCenter(canvas);
    const text = new IText(t("media_editor.tool_text"), { left: center.x, top: center.y, originX: "center", originY: "center", fontFamily: "Tahoma", fontSize: 64, fontWeight: "bold", fill: color, textAlign: "center", lineHeight: 1.15, editorType: "text", backgroundColor: textBackground || "", shadow: isTextShadowEnabled ? new Shadow({ color: "rgba(0,0,0,0.45)", blur: 10, offsetX: 4, offsetY: 4 }) : null });
    canvas.add(text); canvas.setActiveObject(text); setSelectedObject(text); canvas.requestRenderAll(); pushHistory(canvas);
    setTimeout(() => { if (text.canvas === canvas) { text.enterEditing(); text.selectAll(); canvas.requestRenderAll(); } }, 0);
  }, [canvas, color, getCenter, isTextShadowEnabled, t, textBackground, pushHistory]);

  const addStickerToCanvas = useCallback(async (sticker) => {
    if (!canvas || (!sticker?.url && !sticker?.src)) return;
    try {
      const image = await FabricImage.fromURL(sticker.url || sticker.src, { crossOrigin: "anonymous" });
      if (!image) return;
      const center = getCenter(canvas);
      const targetSize = Math.min(280, Math.max(120, Math.min(canvas.getWidth(), canvas.getHeight()) * 0.18));
      const scale = targetSize / (image.width || targetSize);
      image.set({ left: center.x, top: center.y, originX: "center", originY: "center", scaleX: scale, scaleY: scale, editorType: "sticker" });
      canvas.add(image); canvas.setActiveObject(image); setSelectedObject(image); canvas.requestRenderAll(); pushHistory(canvas);
    } catch (e) {}
  }, [canvas, getCenter, pushHistory]);

  // Трансформації та фільтри
  const updateSelected = useCallback((props, imm = false) => { 
    if(!canvas) return; 
    const act = canvas.getActiveObject(); 
    const bg = getBackground(canvas);
    if(!act || act === bg || act.editorType==="crop") return; 
    act.set(props); act.setCoords(); canvas.requestRenderAll(); setSelectedObject(act); 
    imm ? flushHistory() : scheduleHistory(canvas); 
  }, [canvas, flushHistory, getBackground, scheduleHistory]);

  const transformSelected = useCallback((action) => {
    if(!canvas) return; 
    const act = canvas.getActiveObject(); 
    const bg = getBackground(canvas);
    if(!act || act === bg || act.editorType==="crop") return;

    if (action === 'rotL') act.rotate((act.angle || 0) - 90);
    else if (action === 'rotR') act.rotate((act.angle || 0) + 90);
    else if (action === 'flipH') act.set("flipX", !act.flipX);
    else if (action === 'flipV') act.set("flipY", !act.flipY);
    else if (action === 'centH') act.set("left", canvas.getWidth() / 2);
    else if (action === 'centV') act.set("top", canvas.getHeight() / 2);
    else if (action === 'dup') {
      act.clone(OBJECT_PROPS).then(clone => {
        clone.set({ left: (act.left || 0) + 30, top: (act.top || 0) + 30 });
        canvas.add(clone); canvas.setActiveObject(clone); setSelectedObject(clone); canvas.requestRenderAll(); pushHistory(canvas);
      });
      return;
    }
    act.setCoords(); canvas.requestRenderAll(); pushHistory(canvas);
  }, [canvas, getBackground, pushHistory]);

  const layerSelected = useCallback((action) => {
    if(!canvas) return; 
    const act = canvas.getActiveObject(); 
    const bg = getBackground(canvas);
    if(!act || act === bg) return;

    if (action === 'fw') canvas.bringObjectForward(act);
    else if (action === 'fr') canvas.bringObjectToFront(act);
    else if (action === 'bw') canvas.sendObjectBackwards(act);
    else if (action === 'bk') canvas.sendObjectToBack(act);
    canvas.requestRenderAll(); pushHistory(canvas);
  }, [canvas, getBackground, pushHistory]);

  const applyFilter = useCallback((type, amount) => {
    if (!canvas) return;
    const act = canvas.getActiveObject();
    const bg = getBackground(canvas);
    const target = act && isFabricImage(act) && act !== bg ? act : bg;
    if (!target) return;
    const val = Number(amount); let flist = [];
    switch (type) {
      case "grayscale": flist = [new filters.Grayscale()]; break;
      case "invert": flist = [new filters.Invert()]; break;
      case "brightness": flist = [new filters.Brightness({ brightness: clamp(val, -1, 1) })]; break;
      case "contrast": flist = [new filters.Contrast({ contrast: clamp(val, -1, 1) })]; break;
      case "saturation": flist = [new filters.Saturation({ saturation: clamp(val, -1, 1) })]; break;
      case "blur": flist = [new filters.Blur({ blur: clamp(val, 0, 1) })]; break;
      case "noise": flist = [new filters.Noise({ noise: clamp(val, 0, 700) })]; break;
      case "sharpen": flist = [new filters.Convolute({ matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0] })]; break;
      default: flist = []; break;
    }
    target.filters = flist; target.editorFilterType = type; target.editorFilterAmount = val; target.applyFilters();
    canvas.requestRenderAll(); setFilterType(type); setFilterAmount(val); pushHistory(canvas);
  }, [canvas, getBackground, pushHistory]);

  const finishCrop = useCallback(async () => {
    if (!canvas || !cropRectRef.current) return;
    const crop = cropRectRef.current; const bg = getBackground(canvas);
    if (!bg?.width || !bg?.height) return;
    try {
      historySuspendedRef.current = true;
      const cW = crop.getScaledWidth(), cH = crop.getScaledHeight();
      const left = clamp(crop.left - cW / 2, 0, bg.width - 1), top = clamp(crop.top - cH / 2, 0, bg.height - 1);
      const right = clamp(left + cW, 1, bg.width), bottom = clamp(top + cH, 1, bg.height);
      const width = Math.max(1, right - left), height = Math.max(1, bottom - top);
      canvas.discardActiveObject();
      const exportCanvas = canvas.toCanvasElement(1, { left: Math.round(left), top: Math.round(top), width: Math.round(width), height: Math.round(height) });
      const blob = await new Promise(res => exportCanvas.toBlob(res, "image/png", 1));
      const objectUrl = URL.createObjectURL(blob);
      const croppedImage = await FabricImage.fromURL(objectUrl);
      URL.revokeObjectURL(objectUrl);
      prepareBackground(croppedImage);
      canvas.clear(); canvas.backgroundColor = "#1a1a1c";
      canvas.setDimensions({ width: croppedImage.width || Math.round(width), height: croppedImage.height || Math.round(height) }, { backstoreOnly: true });
      canvas.add(croppedImage); 
      
      if (canvas.sendObjectToBack) {
          canvas.sendObjectToBack(croppedImage);
      } else if (croppedImage.sendToBack) {
          croppedImage.sendToBack();
      }

      backgroundImageRef.current = croppedImage; cropRectRef.current = null; setSelectedObject(null); setActiveTool("select");
      historySuspendedRef.current = false; fitCanvasToContainer(canvas, zoom); canvas.requestRenderAll(); pushHistory(canvas);
    } catch (e) { historySuspendedRef.current = false; }
  }, [canvas, fitCanvasToContainer, getBackground, prepareBackground, pushHistory, zoom]);

  const handleSave = useCallback(async () => {
    if (!canvas) return;
    try {
      flushHistory(); setIsComparing(false);
      const bg = getBackground(canvas);

      canvas.getObjects().forEach(o => { if(o !== bg) o.set("visible", true); });
      canvas.discardActiveObject();
      
      if (!bg || !bg.width || !bg.height) {
         throw new Error("Invalid original canvas size or background missing");
      }
      
      const exportWidth = bg.width || canvas.getWidth();
      const exportHeight = bg.height || canvas.getHeight();

      canvas.setDimensions({ width: exportWidth, height: exportHeight }, { backstoreOnly: true });
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      canvas.requestRenderAll();
      
      const type = file instanceof File ? file.type : "image/png";
      const blob = await new Promise(res => canvas.toCanvasElement(1).toBlob(res, type, 0.95));
      const ext = type === "image/jpeg" ? "jpg" : type === "image/webp" ? "webp" : "png";
      onSave(new File([blob], `edited_image.${ext}`, { type, lastModified: Date.now() }));
    } catch (e) { console.error("Image save error:", e); } finally { fitCanvasToContainer(canvas, zoom); }
  }, [canvas, file, fitCanvasToContainer, flushHistory, getBackground, onSave, zoom]);

  const setZoomSafe = (v) => { const n = clamp(Number(v), 0.5, 2); setZoom(n); if(canvas) requestAnimationFrame(() => fitCanvasToContainer(canvas, n)); };
  const toggleCompare = (h) => { 
      if(!canvas) return; 
      setIsComparing(h); 
      const bg = getBackground(canvas);
      canvas.getObjects().forEach(o => { if(o !== bg) o.set("visible", !h); }); 
      canvas.requestRenderAll(); 
  };

  return {
    refs: { canvasContainerRef },
    state: { canvas, activeTool, drawMode, color, strokeWidth, selectedObject, isComparing, stickerSearch, cropRatio, zoom, filterType, filterAmount, textBackground, isTextShadowEnabled, isCanvasReady, canUndo: historyRef.current.index > 0, canRedo: historyRef.current.index < historyRef.current.stack.length - 1 },
    actions: { setActiveTool, setDrawMode, setColor, setStrokeWidth, setStickerSearch, setCropRatio, setZoomSafe, toggleCompare, handleSave, undo, redo, addText, addShape, applyFilter, transformSelected, layerSelected, finishCrop, cancelCrop: () => setActiveTool('select'), addStickerToCanvas, deleteSelected, updateSelected, toggleShadow: () => { const en = !isTextShadowEnabled; setIsTextShadowEnabled(en); updateSelected({ shadow: en ? new Shadow({ color: "rgba(0,0,0,0.45)", blur: 10, offsetX: 5, offsetY: 5 }) : null }, true); }, resetAll: async () => { if(!canvas) return; await restoreOriginalImage(canvas, true); setActiveTool("select"); setCropRatio("free"); setFilterType("none"); setFilterAmount(0); setZoom(1); } }
  };
};