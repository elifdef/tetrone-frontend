import { useEditorCore } from './hooks/useEditorCore';
import { useShapes } from './hooks/useShapes';

// import { useRichText } from './hooks/useRichText';
// import { useMemeGenerator } from './hooks/useMemeGenerator';
// import { useFilters } from './hooks/useFilters';
// import { useTransform } from './hooks/useTransform';
// import { useCollage } from './hooks/useCollage';

export const useMediaEditor = (props) => {
    const core = useEditorCore(props);

    // Ініціалізуємо тільки фігури
    const shapesModule = useShapes(core, props.t);

    // const modules = [shapesModule, richTextModule, memeModule, filtersModule, transformModule, collageModule];
    const modules = [shapesModule];

    const handleSave = () => core.actions.handleSave(props.file, props.onSave);

    return {
        refs: core.refs,
        state: core.state,
        actions: { ...core.actions, handleSave },
        modules
    };
};