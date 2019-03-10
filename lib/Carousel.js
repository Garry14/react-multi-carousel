"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const style_1 = require("./style");
const utils_1 = require("./utils");
const defaultTransitionDuration = 300;
const defaultTransition = "transform 300ms ease-in-out";
class Carousel extends React.Component {
    constructor(props) {
        super(props);
        this.containerRef = React.createRef();
        this.state = {
            itemWidth: 0,
            slidesToShow: 0,
            currentSlide: 0,
            totalItems: React.Children.count(props.children),
            deviceType: "",
            domLoaded: false,
            transform: 0,
            containerWidth: 0
        };
        this.onResize = this.onResize.bind(this);
        this.handleDown = this.handleDown.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleOut = this.handleOut.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.handleEnter = this.handleEnter.bind(this);
        this.next = this.next.bind(this);
        this.previous = this.previous.bind(this);
        this.onMove = false;
        this.initialPosition = 0;
        this.lastPosition = 0;
        this.isAnimationAllowed = true;
        this.direction = "";
    }
    componentDidMount() {
        this.setState({ domLoaded: true });
        this.setItemsToShow();
        window.addEventListener("resize", this.onResize);
        this.onResize();
        if (this.props.keyBoardControl) {
            window.addEventListener("keyup", this.onKeyUp);
        }
        if (this.props.autoPlay && this.props.autoPlaySpeed) {
            this.autoPlay = setInterval(this.next, this.props.autoPlaySpeed);
        }
    }
    setItemsToShow(shouldCorrectItemPosition) {
        const { responsive } = this.props;
        Object.keys(responsive).forEach(item => {
            const { breakpoint, items } = responsive[item];
            const { max, min } = breakpoint;
            if (window.innerWidth >= min && window.innerWidth <= max) {
                this.setState({ slidesToShow: items, deviceType: item });
                this.setContainerAndItemWidth(items, shouldCorrectItemPosition);
            }
        });
    }
    setContainerAndItemWidth(slidesToShow, shouldCorrectItemPosition) {
        if (this.containerRef && this.containerRef.current) {
            const containerWidth = this.containerRef.current.offsetWidth;
            const itemWidth = Math.round(this.containerRef.current.offsetWidth / slidesToShow);
            this.setState({
                containerWidth,
                itemWidth
            });
            if (shouldCorrectItemPosition) {
                this.setState({
                    transform: -(itemWidth * this.state.currentSlide)
                });
            }
        }
    }
    onResize() {
        this.setItemsToShow();
    }
    componentDidUpdate({ keyBoardControl, autoPlay }, { containerWidth }) {
        if (this.containerRef &&
            this.containerRef.current &&
            this.containerRef.current.offsetWidth !== containerWidth) {
            setTimeout(() => {
                this.setItemsToShow(true);
            }, this.props.transitionDuration || defaultTransitionDuration);
        }
        if (keyBoardControl && !this.props.keyBoardControl) {
            window.removeEventListener("keyup", this.onKeyUp);
        }
        if (autoPlay && !this.props.autoPlay && this.autoPlay) {
            clearInterval(this.autoPlay);
            this.autoPlay = undefined;
        }
        if (!autoPlay && this.props.autoPlay && !this.autoPlay) {
            this.autoPlay = setInterval(this.next, this.props.autoPlaySpeed);
        }
    }
    resetAllItems() {
        this.setState({ transform: 0, currentSlide: 0 });
    }
    next(slidesHavePassed = 0) {
        this.isAnimationAllowed = true;
        const { slidesToShow } = this.state;
        const { slidesToSlide, infinite } = this.props;
        const nextMaximumSlides = this.state.currentSlide + 1 + slidesHavePassed + slidesToShow;
        const nextSlides = this.state.currentSlide + slidesHavePassed + slidesToSlide;
        const nextPosition = -(this.state.itemWidth * nextSlides);
        if (nextMaximumSlides <= this.state.totalItems) {
            this.setState({
                transform: nextPosition,
                currentSlide: nextSlides
            });
        }
        else if (slidesHavePassed > 0 &&
            this.state.currentSlide + 1 + slidesToShow <= this.state.totalItems) {
            // prevent oversliding;
            const maxSlides = this.state.totalItems - slidesToShow;
            const maxPosition = -(this.state.itemWidth * maxSlides);
            this.setState({
                transform: maxPosition,
                currentSlide: maxSlides
            });
        }
        else {
            if (infinite) {
                this.resetAllItems();
            }
        }
    }
    previous(slidesHavePassed = 0) {
        this.isAnimationAllowed = true;
        const { slidesToShow } = this.state;
        const { slidesToSlide, infinite } = this.props;
        const nextMaximumSlides = this.state.currentSlide - slidesHavePassed - slidesToSlide;
        const nextSlides = this.state.currentSlide - slidesHavePassed - slidesToSlide;
        const nextPosition = -(this.state.itemWidth * nextSlides);
        if (nextMaximumSlides >= 0) {
            this.setState({
                transform: nextPosition,
                currentSlide: nextSlides
            });
        }
        else if (slidesHavePassed > 0 &&
            this.state.currentSlide - slidesToSlide >= 0) {
            // prevent oversliding.
            this.setState({
                transform: 0,
                currentSlide: 0
            });
        }
        else {
            const maxSlides = this.state.totalItems - slidesToShow;
            const maxPosition = -(this.state.itemWidth * maxSlides);
            if (infinite) {
                this.setState({
                    transform: maxPosition,
                    currentSlide: maxSlides
                });
            }
        }
    }
    componentWillUnmount() {
        window.removeEventListener("resize", this.onResize);
        if (this.props.keyBoardControl) {
            window.removeEventListener("keyup", this.onKeyUp);
        }
        if (this.props.autoPlay && this.autoPlay) {
            clearInterval(this.autoPlay);
            this.autoPlay = undefined;
        }
    }
    resetMoveStatus() {
        this.onMove = false;
        this.initialPosition = 0;
        this.lastPosition = 0;
        this.direction = "";
    }
    handleDown(e) {
        if ((e.touches && this.props.disableSwipeOnMobile) ||
            (e && !e.touches && this.props.disableDrag)) {
            return;
        }
        const { clientX } = e.touches ? e.touches[0] : e;
        this.onMove = true;
        this.initialPosition = clientX;
        this.lastPosition = clientX;
        this.isAnimationAllowed = false;
    }
    handleMove(e) {
        if ((e.touches && this.props.disableSwipeOnMobile) ||
            (e && !e.touches && this.props.disableDrag)) {
            return;
        }
        const { clientX } = e.touches ? e.touches[0] : e;
        if (this.onMove) {
            if (this.initialPosition > clientX) {
                this.direction = "right";
                const translateXLimit = Math.abs(-(this.state.itemWidth *
                    (this.state.totalItems - this.state.slidesToShow)));
                const nextTranslate = this.state.transform - (this.lastPosition - clientX);
                const isLastSlide = this.state.currentSlide ===
                    this.state.totalItems - this.state.slidesToShow;
                if (Math.abs(nextTranslate) <= translateXLimit ||
                    (isLastSlide && this.props.infinite)) {
                    this.setState({ transform: nextTranslate });
                }
            }
            if (clientX > this.initialPosition) {
                this.direction = "left";
                const nextTranslate = this.state.transform + (clientX - this.lastPosition);
                const isFirstSlide = this.state.currentSlide === 0;
                if (nextTranslate <= 0 || (isFirstSlide && this.props.infinite)) {
                    this.setState({ transform: nextTranslate });
                }
            }
            this.lastPosition = clientX;
        }
    }
    handleOut(e) {
        if (this.props.autoPlay && !this.autoPlay) {
            this.autoPlay = setInterval(this.next, this.props.autoPlaySpeed);
        }
        const shouldDisableOnMobile = e.type === "touchend" && this.props.disableSwipeOnMobile;
        const shouldDisableOnDesktop = (e.type === "mouseleave" || e.type === "mouseup") &&
            this.props.disableDrag;
        if (shouldDisableOnMobile || shouldDisableOnDesktop) {
            return;
        }
        if (this.onMove) {
            if (this.direction === "right") {
                const slidesHavePassed = Math.round((this.initialPosition - this.lastPosition) / this.state.itemWidth);
                this.next(slidesHavePassed);
            }
            if (this.direction === "left") {
                const slidesHavePassed = Math.round((this.lastPosition - this.initialPosition) / this.state.itemWidth);
                this.previous(slidesHavePassed);
            }
            this.resetMoveStatus();
        }
    }
    onKeyUp(e) {
        switch (e.keyCode) {
            case 37:
                return this.previous();
            case 39:
                return this.next();
        }
    }
    handleEnter() {
        if (this.autoPlay && this.props.autoPlay) {
            clearInterval(this.autoPlay);
            this.autoPlay = undefined;
        }
    }
    renderLeftArrow() {
        const { customLeftArrow } = this.props;
        if (customLeftArrow) {
            return React.cloneElement(customLeftArrow, {
                onClick: () => this.previous()
            });
        }
        else {
            return (React.createElement("i", { 
                // @ts-ignore
                style: style_1.leftArrowStyle, onClick: () => this.previous() }));
        }
    }
    renderRightArrow() {
        const { customRightArrow } = this.props;
        if (customRightArrow) {
            return React.cloneElement(customRightArrow, {
                onClick: () => this.next()
            });
        }
        else {
            return (React.createElement("i", { 
                // @ts-ignore
                style: style_1.rightArrowStyle, onClick: () => this.next() }));
        }
    }
    render() {
        const { domLoaded, slidesToShow, containerWidth, itemWidth } = this.state;
        const { deviceType, responsive, forSSR, children, slidesToSlide, removeArrow, removeArrowOnDeviceType, infinite, containerClassName, contentClassName, itemClassName, customTransition } = this.props;
        let flexBisis;
        const domFullyLoaded = domLoaded && slidesToShow && containerWidth && itemWidth;
        if (forSSR && deviceType && !domFullyLoaded) {
            flexBisis = utils_1.guessWidthFromDeviceType(deviceType, responsive);
        }
        const shouldRenderOnSSR = forSSR && deviceType && !domFullyLoaded && flexBisis;
        const isLeftEndReach = !(this.state.currentSlide - slidesToSlide >= 0);
        const isRightEndReach = !(this.state.currentSlide + 1 + slidesToShow <=
            this.state.totalItems);
        const shouldShowArrows = !removeArrow &&
            !(removeArrowOnDeviceType &&
                ((deviceType && removeArrowOnDeviceType.indexOf(deviceType) > -1) ||
                    (this.state.deviceType &&
                        removeArrowOnDeviceType.indexOf(this.state.deviceType) > -1)));
        const disableLeftArrow = !infinite && isLeftEndReach;
        const disableRightArrow = !infinite && isRightEndReach;
        return (React.createElement("div", { className: containerClassName, ref: this.containerRef, style: style_1.containerStyle },
            React.createElement("ul", { className: contentClassName, 
                // @ts-ignore
                style: Object.assign({}, style_1.contentStyle, { listStyle: "none", padding: 0, margin: 0, transition: this.isAnimationAllowed
                        ? customTransition || defaultTransition
                        : "none", overflow: shouldRenderOnSSR ? "hidden" : "unset", transform: `translate3d(${this.state.transform}px,0,0)` }), onMouseMove: this.handleMove, onMouseDown: this.handleDown, onMouseUp: this.handleOut, onMouseEnter: this.handleEnter, onMouseLeave: this.handleOut, onTouchStart: this.handleDown, onTouchMove: this.handleMove, onTouchEnd: this.handleOut }, React.Children.toArray(children).map((child, index) => (React.createElement("li", { key: index, style: {
                    flex: shouldRenderOnSSR ? `1 0 ${flexBisis}%` : "auto",
                    width: domFullyLoaded ? `${itemWidth}px` : "auto"
                }, className: itemClassName }, child)))),
            shouldShowArrows && !disableLeftArrow && this.renderLeftArrow(),
            shouldShowArrows && !disableRightArrow && this.renderRightArrow()));
    }
}
Carousel.defaultProps = {
    slidesToSlide: 1,
    infinite: false,
    containerClassName: "",
    contentClassName: "",
    itemClassName: "",
    keyBoardControl: true,
    autoPlaySpeed: 3000
};
exports.default = Carousel;
//# sourceMappingURL=Carousel.js.map