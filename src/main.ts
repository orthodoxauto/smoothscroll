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

export const smoothscroll = (el?: HTMLElement | null, options?: Options) => {
    const { fallbackToNearest } = options ?? {}

    const now = performance && performance.now ? performance.now.bind(performance) : Date.now

    const ease = (k: number) => 0.5 * (1 - Math.cos(Math.PI * k))

    const isBody = (el: Element) => el === document.body

    const isMicrosoftBrowser = (userAgent: string) => {
        const userAgentPatterns = ['MSIE ', 'Trident/', 'Edge/']
        return new RegExp(userAgentPatterns.join('|')).test(userAgent)
    }

    const convertToPx = (value?: string | null) => {
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

    const canOverflow = (el: HTMLElement, axis: Axis) => {
        const overflowValue = getComputedStyle(el, null)[
            ('overflow' + axis) as keyof CSSStyleDeclaration
        ]

        return overflowValue === 'auto' || overflowValue === 'scroll'
    }

    const ROUNDING_TOLERANCE = isMicrosoftBrowser(navigator.userAgent) ? 1 : 0

    const hasScrollableSpace = (el: HTMLElement, axis: Axis) => {
        if (!fallbackToNearest) {
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

    const isScrollable = (el: HTMLElement) => {
        const isScrollableY = hasScrollableSpace(el, 'Y') && canOverflow(el, 'Y')
        const isScrollableX = hasScrollableSpace(el, 'X') && canOverflow(el, 'X')

        return isScrollableY || isScrollableX
    }

    const findScrollableParent = (el: HTMLElement) => {
        while (el !== document.body && isScrollable(el) === false) {
            if (el.parentElement) el = el.parentElement
        }

        return el
    }

    const step = (context: {
        scrollableParent: HTMLElement
        scrollable: HTMLElement
        startX: number
        startY: number
        x: number
        y: number
        startTime: number
    }) => {
        const time = now()
        let value = 0
        let currentX = 0
        let currentY = 0
        let elapsed = (time - context.startTime) / SCROLL_TIME

        // avoid elapsed times higher than one
        elapsed = elapsed > 1 ? 1 : elapsed

        // apply easing to elapsed time
        value = ease(elapsed)

        currentX = context.startX + (context.x - context.startX) * value
        currentY = context.startY + (context.y - context.startY) * value

        if (isBody(context.scrollableParent)) {
            scrollTo(currentX, currentY)
        } else {
            context.scrollableParent.scrollLeft = currentX
            context.scrollableParent.scrollTop = currentY
        }

        // scroll more if we have not reached our destination
        if (currentX !== context.x || currentY !== context.y) {
            requestAnimationFrame(() => {
                step(context)
            })
        }
    }

    const scroll = () => {
        if (!el) return

        const scrollableParent = findScrollableParent(el)
        const scrollableParentStyle = scrollableParent.getAttribute('style') ?? ''

        // getComputedStyle().getPropertyValue() inherits value so resort to good ol' regex.
        const offsetX =
            options?.offsetX ?? convertToPx(OFFSET_X_REGEX.exec(scrollableParentStyle)?.[1])
        const offsetY =
            options?.offsetY ?? convertToPx(OFFSET_Y_REGEX.exec(scrollableParentStyle)?.[1])

        const parentRect = isBody(scrollableParent)
            ? new DOMRectReadOnly(0, 0, 0, 0)
            : scrollableParent.getBoundingClientRect()
        const clientRect = el.getBoundingClientRect()

        const startX = isBody(scrollableParent) ? scrollX : scrollableParent.scrollLeft
        const startY = isBody(scrollableParent) ? scrollY : scrollableParent.scrollTop

        const x = isBody(el) ? 0 : startX + clientRect.left - parentRect.left - offsetX
        const y = isBody(el) ? 0 : startY + clientRect.top - parentRect.top - offsetY

        if (CSS.supports('scroll-behavior', 'smooth')) {
            if (isBody(scrollableParent)) {
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

        const startTime = now()

        step({
            scrollableParent,
            scrollable: el,
            startX,
            startY,
            x,
            y,
            startTime
        })
    }

    scroll()
}
