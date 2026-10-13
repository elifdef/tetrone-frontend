import React, { useState } from 'react';
import { filters, FabricImage } from 'fabric';
import { SvgIcon, SidebarButton, SmallButton, PropertyLabel } from '../EditorUI';
import { FILTERS } from '../constants';

function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
function isFabricImage(object) { return object instanceof FabricImage; }

export const useFilters = (core, t) => {
    const { state: { canvas, activeTool, selectedObject }, actions: { setActiveTool, pushHistory, getBackground } } = core;
    const isActive = activeTool === 'filter';

    const [filterType, setFilterType] = useState("none");
    const [filterAmount, setFilterAmount] = useState(0);

    const hasSelection = !!selectedObject && !selectedObject?.isBackground;
    const activeIsImage = hasSelection && isFabricImage(selectedObject);

    const activeFilterObject = activeIsImage ? selectedObject : getBackground(canvas);
    const activeFilterIsImage = !!activeFilterObject && isFabricImage(activeFilterObject);
    const filterConfig = FILTERS.find((item) => item.key === filterType) || FILTERS[0];

    const applyFilter = (type, amount) => {
        if (!canvas) return;
        const target = activeFilterObject;
        if (!target) return;

        const val = Number(amount);
        let flist = [];

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

        target.filters = flist;
        target.editorFilterType = type;
        target.editorFilterAmount = val;
        target.applyFilters();

        canvas.requestRenderAll();
        setFilterType(type);
        setFilterAmount(val);
        pushHistory(canvas);
    };

    return {
        id: "filter",
        isActive,
        renderSidebarButton: () => (
            <SidebarButton active={isActive} onClick={() => setActiveTool("filter")} icon={<SvgIcon name="filter" size={20} />} label={t('media_editor.tool_filter')} />
        ),
        renderSettingsPanel: () => {
            if (!isActive) return null;
            return (
                <div className="flex flex-col gap-4">
                    <PropertyLabel>{activeIsImage ? t("media_editor.filter_selected") : t("media_editor.filter_original")}</PropertyLabel>
                    {!activeFilterIsImage && <span className="text-[11px] text-theme-error leading-tight">{t("media_editor.filter_no_image")}</span>}

                    <div className="flex flex-col gap-2">
                        {FILTERS.map((f) => (
                            <SmallButton key={f.key} active={filterType === f.key} disabled={!activeFilterIsImage} onClick={() => applyFilter(f.key, f.defaultValue)}>
                                {t(`media_editor.filter_${f.key}`)}
                            </SmallButton>
                        ))}
                    </div>

                    {filterType !== "none" && activeFilterIsImage && filterConfig.max > filterConfig.min && (
                        <div className="flex flex-col gap-1 mt-2">
                            <PropertyLabel>{t('media_editor.intensity')}</PropertyLabel>
                            <input type="range" min={filterConfig.min} max={filterConfig.max} step={filterConfig.step} value={filterAmount} onChange={(e) => applyFilter(filterType, Number(e.target.value))} className="w-full" />
                        </div>
                    )}
                </div>
            );
        }
    };
};