import { useCallback, useRef } from 'react';

export const useIntersectionObserver = (
    callback: () => void,
    hasMore: boolean,
    isLoading: boolean
) => {
    const observer = useRef<IntersectionObserver | null>(null);

    const lastElementRef = useCallback(
        (node: Element | null) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0]?.isIntersecting && hasMore) {
                    callback();
                }
            });

            if (node) observer.current.observe(node);
        },
        [isLoading, hasMore, callback]
    );

    return lastElementRef;
};