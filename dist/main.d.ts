type Options = Partial<{
    fallbackToNearest: boolean;
}>;
declare const smoothscroll: (el?: HTMLElement | null, options?: Options) => void;

export { smoothscroll };
