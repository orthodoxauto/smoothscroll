type Options = Partial<{
    fallbackToNearest: boolean;
    offsetX: number;
    offsetY: number;
}>;
declare const smoothscroll: (el?: HTMLElement | null, options?: Options) => void;

export { smoothscroll };
