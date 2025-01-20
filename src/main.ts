// https://github.com/iamdustan/smoothscroll/

type Axis = 'X' | 'Y'
type Options = Partial<{
    fallbackToNearest: boolean
    offsetX: number
    offsetY: number
}>

const SCROLL_TIME = 468
const OFFSET_X_REGEX = /--ss-scroll-offset-x:\s*(\d+(?:\.\d+)?(?:rem|px))/
const OFFSET_Y_REGEX = /--ss-scroll-offset-y:\s*(\d+(?:\.\d+)?(?:rem|px))/

export class SmoothScroll {
    private offsetX = 0
    private offsetY = 0
    private fallbackToNearest = false

    constructor(options?: Options) {
        this.offsetX = options?.offsetX ?? 0
        this.offsetY = options?.offsetY ?? 0
        this.fallbackToNearest = options?.fallbackToNearest ?? false
    }

    private Now = performance && performance.now ? performance.now.bind(performance) : Date.now

    private Ease = (k: number) => 0.5 * (1 - Math.cos(Math.PI * k))

    private IsBody = (el: Element) => el === document.body

    private IsMicrosoftBrowser = (userAgent: string) =>
        new RegExp(['MSIE ', 'Trident/', 'Edge/'].join('|')).test(userAgent)

    private ConvertToPx = (value?: string | null) => {
        if (value?.includes('px')) {
            return Number(value.replace('px', ''))
        } else if (value?.includes('rem')) {
            return (
                Number(value.replace('rem', '')) *
                parseFloat(getComputedStyle(document.documentElement).fontSize)
            )
        }

        return 0
    }

    private CanOverflow = (el: HTMLElement, axis: Axis) => {
        const overflowValue = getComputedStyle(el, null)[
            ('overflow' + axis) as keyof CSSStyleDeclaration
        ]

        return overflowValue === 'auto' || overflowValue === 'scroll'
    }

    private HasScrollableSpace = (el: HTMLElement, axis: Axis) => {
        const ROUNDING_TOLERANCE = this.IsMicrosoftBrowser(navigator.userAgent) ? 1 : 0

        if (!this.fallbackToNearest) {
            return true
        }

        if (axis === 'Y') {
            return el.clientHeight + ROUNDING_TOLERANCE < el.scrollHeight
        }

        if (axis === 'X') {
            return el.clientWidth + ROUNDING_TOLERANCE < el.scrollWidth
        }

        return false
    }

    private IsScrollable = (el: HTMLElement) => {
        const isScrollableY = this.HasScrollableSpace(el, 'Y') && this.CanOverflow(el, 'Y')
        const isScrollableX = this.HasScrollableSpace(el, 'X') && this.CanOverflow(el, 'X')

        return isScrollableY || isScrollableX
    }

    private FindScrollableParent = (el: HTMLElement) => {
        while (el !== document.body && this.IsScrollable(el) === false) {
            if (el.parentElement) el = el.parentElement
        }

        return el
    }

    private Step = (context: {
        scrollableParent: HTMLElement
        startX: number
        startY: number
        x: number
        y: number
        startTime: number
    }) => {
        const time = this.Now()
        let value = 0
        let currentX = 0
        let currentY = 0
        let elapsed = (time - context.startTime) / SCROLL_TIME

        // avoid elapsed times higher than one
        elapsed = elapsed > 1 ? 1 : elapsed

        // apply easing to elapsed time
        value = this.Ease(elapsed)

        currentX = context.startX + (context.x - context.startX) * value
        currentY = context.startY + (context.y - context.startY) * value

        if (this.IsBody(context.scrollableParent)) {
            scrollTo(currentX, currentY)
        } else {
            context.scrollableParent.scrollLeft = currentX
            context.scrollableParent.scrollTop = currentY
        }

        // scroll more if we have not reached our destination
        if (currentX !== context.x || currentY !== context.y) {
            requestAnimationFrame(() => this.Step(context))
        }
    }

    ScrollTo(el?: HTMLElement | null) {
        const scrollableParent = el ? this.FindScrollableParent(el) : document.body

        const parentRect = this.IsBody(scrollableParent)
            ? new DOMRectReadOnly(0, 0, 0, 0)
            : scrollableParent.getBoundingClientRect()
        const clientRect = el ? el.getBoundingClientRect() : new DOMRectReadOnly(0, 0, 0, 0)

        const startX = this.IsBody(scrollableParent) ? scrollX : scrollableParent.scrollLeft
        const startY = this.IsBody(scrollableParent) ? scrollY : scrollableParent.scrollTop

        const scrollableParentStyle = scrollableParent.getAttribute('style') ?? ''

        // getComputedStyle().getPropertyValue() inherits value so resort to good ol' regex.
        const offsetX =
            this.offsetX || this.ConvertToPx(OFFSET_X_REGEX.exec(scrollableParentStyle)?.[1])
        const offsetY =
            this.offsetY || this.ConvertToPx(OFFSET_Y_REGEX.exec(scrollableParentStyle)?.[1])

        const x = el ? startX + clientRect.left - parentRect.left - offsetX : 0
        const y = el ? startY + clientRect.top - parentRect.top - offsetY : 0

        if (CSS.supports('scroll-behavior', 'smooth')) {
            if (this.IsBody(scrollableParent)) {
                scrollTo({
                    top: y,
                    left: x,
                    behavior: 'smooth'
                })
            } else {
                scrollableParent.scrollTo({
                    top: y,
                    left: x,
                    behavior: 'smooth'
                })
            }
            return
        }

        const startTime = this.Now()

        this.Step({
            scrollableParent,
            startX,
            startY,
            x,
            y,
            startTime
        })
    }

    ScrollIntoView(el?: HTMLElement | null, center = true) {
        if (!el) return

        const scrollableParent = this.FindScrollableParent(el)

        const parentRect = this.IsBody(scrollableParent)
            ? new DOMRectReadOnly(0, 0, innerWidth, innerHeight)
            : scrollableParent.getBoundingClientRect()
        const clientRect = el.getBoundingClientRect()

        const startX = this.IsBody(scrollableParent) ? window.scrollX : scrollableParent.scrollLeft
        const startY = this.IsBody(scrollableParent) ? window.scrollY : scrollableParent.scrollTop

        let scrollDeltaX = 0
        let scrollDeltaY = 0

        if (center) {
            const elementCenterX = clientRect.left + clientRect.width / 2
            const elementCenterY = clientRect.top + clientRect.height / 2

            const parentCenterX = parentRect.left + parentRect.width / 2
            const parentCenterY = parentRect.top + parentRect.height / 2

            scrollDeltaX = elementCenterX - parentCenterX
            scrollDeltaY = elementCenterY - parentCenterY
        } else {
            if (clientRect.top < parentRect.top) {
                scrollDeltaY = clientRect.top - parentRect.top - this.offsetY
            } else if (clientRect.bottom > parentRect.bottom) {
                scrollDeltaY = clientRect.bottom - parentRect.bottom + this.offsetY
            }

            if (clientRect.left < parentRect.left) {
                scrollDeltaX = clientRect.left - parentRect.left - this.offsetX
            } else if (clientRect.right > parentRect.right) {
                scrollDeltaX = clientRect.right - parentRect.right + this.offsetX
            }
        }

        if (scrollDeltaX === 0 && scrollDeltaY === 0) {
            return
        }

        const x = startX + scrollDeltaX
        const y = startY + scrollDeltaY

        if (CSS.supports('scroll-behavior', 'smooth')) {
            if (this.IsBody(scrollableParent)) {
                scrollTo({
                    top: y,
                    left: x,
                    behavior: 'smooth'
                })
            } else {
                scrollableParent.scrollTo({
                    top: y,
                    left: x,
                    behavior: 'smooth'
                })
            }
            return
        }

        const startTime = this.Now()

        this.Step({
            scrollableParent,
            startX,
            startY,
            x,
            y,
            startTime
        })
    }
}
