// https://github.com/iamdustan/smoothscroll/
const SCROLL_TIME = 468;
const smoothscroll = (el, options) => {
    const { fallbackToNearest } = options ?? {};
    const now = performance && performance.now ? performance.now.bind(performance) : Date.now;
    const ease = (k) => 0.5 * (1 - Math.cos(Math.PI * k));
    const isMicrosoftBrowser = (userAgent) => {
        const userAgentPatterns = ['MSIE ', 'Trident/', 'Edge/'];
        return new RegExp(userAgentPatterns.join('|')).test(userAgent);
    };
    const canOverflow = (el, axis) => {
        const overflowValue = getComputedStyle(el, null)[('overflow' + axis)];
        return overflowValue === 'auto' || overflowValue === 'scroll';
    };
    const ROUNDING_TOLERANCE = isMicrosoftBrowser(navigator.userAgent) ? 1 : 0;
    const hasScrollableSpace = (el, axis) => {
        if (!fallbackToNearest) {
            return true;
        }
        if (axis === 'Y') {
            return el.clientHeight + ROUNDING_TOLERANCE < el.scrollHeight;
        }
        if (axis === 'X') {
            return el.clientWidth + ROUNDING_TOLERANCE < el.scrollWidth;
        }
        return false;
    };
    const isScrollable = (el) => {
        const isScrollableY = hasScrollableSpace(el, 'Y') && canOverflow(el, 'Y');
        const isScrollableX = hasScrollableSpace(el, 'X') && canOverflow(el, 'X');
        return isScrollableY || isScrollableX;
    };
    const findScrollableParent = (el) => {
        while (el !== document.body && isScrollable(el) === false) {
            if (el.parentElement)
                el = el.parentElement;
        }
        return el;
    };
    const step = (context) => {
        const time = now();
        let value = 0;
        let currentX = 0;
        let currentY = 0;
        let elapsed = (time - context.startTime) / SCROLL_TIME;
        // avoid elapsed times higher than one
        elapsed = elapsed > 1 ? 1 : elapsed;
        // apply easing to elapsed time
        value = ease(elapsed);
        currentX = context.startX + (context.x - context.startX) * value;
        currentY = context.startY + (context.y - context.startY) * value;
        if (context.scrollableParent === document.body) {
            scrollTo(currentX, currentY);
        }
        else {
            context.scrollableParent.scrollLeft = currentX;
            context.scrollableParent.scrollTop = currentY;
        }
        // scroll more if we have not reached our destination
        if (currentX !== context.x || currentY !== context.y) {
            requestAnimationFrame(() => {
                step(context);
            });
        }
    };
    const scroll = () => {
        if (!el)
            return;
        const scrollableParent = findScrollableParent(el);
        const parentRect = scrollableParent.getBoundingClientRect();
        const clientRect = el.getBoundingClientRect();
        const startX = scrollableParent === document.body ? scrollX : scrollableParent.scrollLeft;
        const startY = scrollableParent === document.body ? scrollY : scrollableParent.scrollTop;
        const x = startX + clientRect.left - parentRect.left;
        const y = startY + clientRect.top - parentRect.top;
        if (CSS.supports('scroll-behavior', 'smooth')) {
            if (scrollableParent === document.body) {
                scrollTo({
                    top: y,
                    left: x,
                    behavior: 'smooth'
                });
            }
            else {
                scrollableParent.scrollTo({
                    top: y,
                    left: x,
                    behavior: 'smooth'
                });
            }
            return;
        }
        const startTime = now();
        step({
            scrollableParent,
            scrollable: el,
            startX,
            startY,
            x,
            y,
            startTime
        });
    };
    scroll();
};

export { smoothscroll };
