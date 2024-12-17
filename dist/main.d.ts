type Options = Partial<{
    fallbackToNearest: boolean;
    offsetX: number;
    offsetY: number;
}>;
declare class SmoothScroll {
    private offsetX;
    private offsetY;
    private fallbackToNearest;
    constructor(options?: Options);
    private Now;
    private Ease;
    private IsBody;
    private IsMicrosoftBrowser;
    private ConvertToPx;
    private CanOverflow;
    private HasScrollableSpace;
    private IsScrollable;
    private FindScrollableParent;
    private Step;
    ScrollTo(el?: HTMLElement | null): void;
    ScrollIntoView(el?: HTMLElement | null): void;
}

export { SmoothScroll };
