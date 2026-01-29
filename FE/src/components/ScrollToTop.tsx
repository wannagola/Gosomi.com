import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Disable browser's default scroll restoration to avoid conflicts
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
