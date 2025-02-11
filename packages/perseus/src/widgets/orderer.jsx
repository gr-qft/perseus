/* eslint-disable @babel/no-invalid-this, no-unused-vars, one-var, react/no-unsafe, react/sort-comp */
// @flow
import {
    linterContextProps,
    linterContextDefault,
} from "@khanacademy/perseus-linter";
import $ from "jquery";
import PropTypes, {bool} from "prop-types";
import * as React from "react";
import ReactDOM from "react-dom";
import _ from "underscore";

import {getDependencies} from "../dependencies.js";
import {Errors, Log} from "../logging/log.js";
import {ClassNames as ApiClassNames} from "../perseus-api.jsx";
import Renderer from "../renderer.jsx";
import Util from "../util.js";

import type {PerseusOrdererWidgetOptions} from "../perseus-types.js";
import type {WidgetExports, WidgetProps} from "../types.js";

class PlaceholderCard extends React.Component<$FlowFixMe> {
    static propTypes = {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
    };

    render(): React.Node {
        return (
            <div
                className={"card-wrap " + ApiClassNames.INTERACTIVE}
                style={{width: this.props.width}}
            >
                <div
                    className="card placeholder"
                    style={{height: this.props.height}}
                />
            </div>
        );
    }
}

class DragHintCard extends React.Component<$FlowFixMe> {
    render(): React.Node {
        return (
            <div className={"card-wrap " + ApiClassNames.INTERACTIVE}>
                <div className="card drag-hint" />
            </div>
        );
    }
}

const PropTypePosition = PropTypes.shape({
    left: PropTypes.number,
    top: PropTypes.number,
});

class Card extends React.Component<$FlowFixMe, $FlowFixMe> {
    mouseMoveUpBound: boolean;

    static propTypes = {
        floating: PropTypes.bool.isRequired,
        animating: PropTypes.bool,
        width: PropTypes.number,
        stack: PropTypes.bool,

        onMouseDown: PropTypes.func,
        onMouseMove: PropTypes.func,
        onMouseUp: PropTypes.func,

        // Used only for floating/animating cards
        startMouse: PropTypePosition,
        startOffset: PropTypePosition,
        animateTo: PropTypePosition,
        onAnimationEnd: PropTypes.func,
        linterContext: linterContextProps,
    };

    static defaultProps = {
        stack: false,
        animating: false,
        linterContext: linterContextDefault,
    };

    state = {dragging: false};

    render(): React.Node {
        let style = {};

        if (this.props.floating) {
            style = {
                position: "absolute",
                left: this.props.startOffset.left,
                top: this.props.startOffset.top,
            };
        }

        if (this.props.width) {
            // $FlowFixMe[prop-missing]
            style.width = this.props.width;
        }

        const className = ["card"];
        if (this.props.stack) {
            className.push("stack");
        }
        if (this.props.floating && !this.props.animating) {
            className.push("dragging");
            style.left += this.props.mouse.left - this.props.startMouse.left;
            style.top += this.props.mouse.top - this.props.startMouse.top;
        }

        // Pull out the content to get rendered
        const rendererProps = _.pick(this.props, "content");

        const onMouseDown = this.props.animating ? $.noop : this.onMouseDown;

        return (
            <div
                className={"card-wrap " + ApiClassNames.INTERACTIVE}
                style={style}
                onMouseDown={onMouseDown}
                onTouchStart={onMouseDown}
                onTouchEnd={this.onMouseUp}
                onTouchCancel={this.onMouseUp}
            >
                <div className={className.join(" ")}>
                    <Renderer
                        {...rendererProps}
                        linterContext={this.props.linterContext}
                    />
                </div>
            </div>
        );
    }

    shouldComponentUpdate(nextProps, nextState) {
        // Cards in the bank or drag list don't usually change -- they only
        // reorder themselves -- so we want to skip the update to things a
        // little faster. We also need to re-render if the content changes,
        // which happens only in the editor. (We do want to update the floating
        // card on mouse move to update its position.)
        return (
            this.props.floating ||
            nextProps.floating ||
            this.props.content !== nextProps.content ||
            // TODO(alpert): Remove ref here after fixing facebook/react#1392.
            this.props.fakeRef !== nextProps.fakeRef
        );
    }

    componentDidMount() {
        this.mouseMoveUpBound = false;

        // On touch devices, we set up our own touchmove handler because React
        // all event subscriptions using `OnTouchMove` props are non-passive.
        // See: https://github.com/facebook/react/issues/6436
        // Also, we can't subscribe to `ontouchmove`  within the `ontouchstart`
        // handler because of a WebKit bug:
        // https://github.com/atlassian/react-beautiful-dnd/issues/413 and
        // https://bugs.webkit.org/show_bug.cgi?id=184250
        document.addEventListener(
            "touchmove",
            this.onMouseMove,
            // Not all browsers support passive events, and when they don't
            // this third paramter is just a boolean. If we pass the "options"
            // object, it's interpreted as `capture=true` (which we don't want!)
            Util.supportsPassiveEvents() ? {passive: false} : false,
        );
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.animating && !prevProps.animating) {
            // If we just were changed into animating, start the animation.
            // We pick the animation speed based on the distance that the card
            // needs to travel. (Why sqrt? Just because it looks nice -- with a
            // linear scale, far things take too long to come back.)
            const ms =
                15 *
                Math.sqrt(
                    Math.sqrt(
                        Math.pow(
                            this.props.animateTo.left -
                                this.props.startOffset.left,
                            2,
                        ) +
                            Math.pow(
                                this.props.animateTo.top -
                                    this.props.startOffset.top,
                                2,
                            ),
                    ),
                );
            $(ReactDOM.findDOMNode(this)).animate(
                this.props.animateTo,
                Math.max(ms, 1),
                this.props.onAnimationEnd,
            );
        }
    }

    componentWillUnmount() {
        // Event handlers should be unbound before component unmounting, but
        // just in case...
        if (this.mouseMoveUpBound) {
            Log.error(
                "Removing an element with bound event handlers.",
                Errors.Internal,
            );

            this.unbindMouseMoveUp();
            Util.resetTouchHandlers();
        }

        document.removeEventListener("touchmove", this.onMouseMove);
    }

    bindMouseMoveUp: () => void = () => {
        this.mouseMoveUpBound = true;
        $(document).on("mousemove", this.onMouseMove);
        $(document).on("mouseup", this.onMouseUp);
    };

    unbindMouseMoveUp: () => void = () => {
        this.mouseMoveUpBound = false;
        $(document).off("mousemove", this.onMouseMove);
        $(document).off("mouseup", this.onMouseUp);
    };

    onMouseDown: ($FlowFixMe) => void = (event) => {
        event.preventDefault();
        const loc = Util.extractPointerLocation(event);
        if (loc) {
            this.setState({dragging: true});
            this.bindMouseMoveUp();
            this.props.onMouseDown && this.props.onMouseDown(loc, this);
        }
    };

    onMouseMove: ($FlowFixMe) => void = (event) => {
        if (!this.state.dragging) {
            return;
        }

        event.preventDefault();
        const loc = Util.extractPointerLocation(event);
        if (loc) {
            this.props.onMouseMove && this.props.onMouseMove(loc);
        }
    };

    onMouseUp: ($FlowFixMe) => void = (event) => {
        event.preventDefault();
        const loc = Util.extractPointerLocation(event);
        if (loc) {
            this.setState({dragging: false});
            this.unbindMouseMoveUp();
            this.props.onMouseUp && this.props.onMouseUp(loc);
        }
    };
}

const NORMAL = "normal",
    AUTO = "auto",
    HORIZONTAL = "horizontal",
    VERTICAL = "vertical";

type Rubric = PerseusOrdererWidgetOptions;
type RenderProps = {|
    ...PerseusOrdererWidgetOptions,
    current: $FlowFixMe,
|};
export type OrdererProps = WidgetProps<RenderProps, Rubric>;

type OrdererDefaultProps = {|
    current: OrdererProps["current"],
    options: OrdererProps["options"],
    correctOptions: OrdererProps["correctOptions"],
    height: OrdererProps["height"],
    layout: OrdererProps["layout"],
    linterContext: OrdererProps["linterContext"],
|};

type OrdererState = {|
    current: $ReadOnlyArray<$FlowFixMe>,
    dragging: boolean,
    placeholderIndex: ?number,
    dragKey: ?string,
    animating: boolean,
    dragWidth: ?number,
    dragHeight: ?number,
    dragContent: $FlowFixMe,
    offsetPos: ?number,
    grabPos: $FlowFixMe,
    mousePos?: $FlowFixMe,
    animateTo: ?{|
        top: number,
        left: number,
    |},
    onAnimationEnd?: ($FlowFixMe) => void,
|};

class Orderer extends React.Component<OrdererProps, OrdererState> {
    static defaultProps: OrdererDefaultProps = {
        current: [],
        options: [],
        correctOptions: [],
        height: NORMAL,
        layout: HORIZONTAL,
        linterContext: linterContextDefault,
    };

    state: OrdererState = {
        current: [],
        dragging: false,
        placeholderIndex: null,
        dragKey: null,
        animating: false,
        dragContent: null,
        dragWidth: null,
        dragHeight: null,
        offsetPos: null,
        animateTo: null,
        grabPos: null,
    };

    UNSAFE_componentWillReceiveProps(nextProps: OrdererProps) {
        if (!_.isEqual(this.props.current, nextProps.current)) {
            this.setState({current: nextProps.current});
        }
    }

    render(): React.Node {
        // This is the card we are currently dragging
        const dragging = this.state.dragging && (
            <Card
                // eslint-disable-next-line react/no-string-refs
                ref="dragging"
                floating={true}
                content={this.state.dragContent}
                startOffset={this.state.offsetPos}
                startMouse={this.state.grabPos}
                mouse={this.state.mousePos}
                width={this.state.dragWidth}
                onMouseUp={this.onRelease}
                onMouseMove={this.onMouseMove}
                key={this.state.dragKey || "draggingCard"}
                linterContext={this.props.linterContext}
            />
        );

        // This is the card that is currently animating
        const animating = this.state.animating && (
            <Card
                floating={true}
                animating={true}
                content={this.state.dragContent}
                startOffset={this.state.offsetPos}
                width={this.state.dragWidth}
                animateTo={this.state.animateTo}
                onAnimationEnd={this.state.onAnimationEnd}
                key={this.state.dragKey || "draggingCard"}
                linterContext={this.props.linterContext}
            />
        );

        // This is the list of draggable, rearrangable cards
        const sortableCards = _.map(
            this.state.current,
            function (opt, i) {
                return (
                    <Card
                        key={`sortableCard${i}`}
                        ref={"sortable" + i}
                        fakeRef={"sortable" + i}
                        floating={false}
                        content={opt.content}
                        width={opt.width}
                        linterContext={this.props.linterContext}
                        // eslint-disable-next-line react/jsx-no-bind
                        onMouseDown={
                            this.state.animating
                                ? $.noop
                                : this.onClick.bind(null, "current", i)
                        }
                    />
                );
            },
            this,
        );

        if (this.state.placeholderIndex != null) {
            const placeholder = (
                <PlaceholderCard
                    // eslint-disable-next-line react/no-string-refs
                    ref="placeholder"
                    width={this.state.dragWidth}
                    height={this.state.dragHeight}
                    key="placeholder"
                />
            );
            sortableCards.splice(this.state.placeholderIndex, 0, placeholder);
        }

        const anySortableCards = sortableCards.length > 0;
        sortableCards.push(dragging, animating);

        // If there are no cards in the list, then add a "hint" card
        const sortable = (
            <div className="perseus-clearfix draggable-box">
                {!anySortableCards && <DragHintCard />}
                {/* eslint-disable-next-line react/no-string-refs */}
                <div ref="dragList">{sortableCards}</div>
            </div>
        );

        // This is the bank of stacks of cards
        const bank = (
            // eslint-disable-next-line react/no-string-refs
            <div ref="bank" className="bank perseus-clearfix">
                {_.map(
                    this.props.options,
                    (opt, i) => {
                        return (
                            <Card
                                ref={"bank" + i}
                                floating={false}
                                content={opt.content}
                                stack={true}
                                key={i}
                                linterContext={this.props.linterContext}
                                // eslint-disable-next-line react/jsx-no-bind
                                onMouseDown={
                                    this.state.animating
                                        ? $.noop
                                        : this.onClick.bind(null, "bank", i)
                                }
                                onMouseMove={this.onMouseMove}
                                onMouseUp={this.onRelease}
                            />
                        );
                    },
                    this,
                )}
            </div>
        );

        return (
            <div
                className={
                    "draggy-boxy-thing orderer " +
                    "height-" +
                    this.props.height +
                    " " +
                    "layout-" +
                    this.props.layout +
                    " " +
                    "above-scratchpad blank-background " +
                    "perseus-clearfix " +
                    ApiClassNames.INTERACTIVE
                }
                // eslint-disable-next-line react/no-string-refs
                ref="orderer"
            >
                {bank}
                {sortable}
            </div>
        );
    }

    onClick: (string, number, $FlowFixMe, Element) => void = (
        type,
        index,
        loc,
        draggable,
    ) => {
        const $draggable = $(ReactDOM.findDOMNode(draggable));
        const list = this.state.current.slice();

        let opt;
        let placeholderIndex = null;

        if (type === "current") {
            // If this is coming from the original list, remove the original
            // card from the list
            list.splice(index, 1);
            opt = this.state.current[index];
            placeholderIndex = index;
        } else if (type === "bank") {
            opt = this.props.options[index];
        }

        this.setState({
            current: list,
            dragging: true,
            placeholderIndex: placeholderIndex,
            // $FlowFixMe[prop-missing]
            // $FlowFixMe[incompatible-use]
            dragKey: opt.key,
            // $FlowFixMe[incompatible-use]
            dragContent: opt.content,
            dragWidth: $draggable.width(),
            dragHeight: $draggable.height(),
            grabPos: loc,
            mousePos: loc,
            offsetPos: $draggable.position(),
        });
    };

    onRelease: ($FlowFixMe) => void = (loc) => {
        // eslint-disable-next-line react/no-string-refs
        const draggable = this.refs.dragging;
        if (draggable == null) {
            return;
        }
        const inCardBank = this.isCardInBank(draggable);
        const index = this.state.placeholderIndex || 0;

        // Here, we build a callback function for the card to call when it is
        // done animating
        const onAnimationEnd = () => {
            const list = this.state.current.slice();

            if (!inCardBank) {
                // Insert the new card into the position
                const newCard = {
                    content: this.state.dragContent,
                    key: _.uniqueId("perseus_draggable_card_"),
                    width: this.state.dragWidth,
                };

                list.splice(index, 0, newCard);
            }

            // $FlowFixMe[prop-missing]
            this.props.onChange({
                current: list,
            });
            this.setState({
                current: list,
                dragging: false,
                placeholderIndex: null,
                animating: false,
            });
            this.props.trackInteraction();
        };

        // Find the position of the card we should animate to
        // TODO(alpert): Update mouse position once more before animating?
        const offset = $(ReactDOM.findDOMNode(draggable)).position();
        let finalOffset = null;
        if (inCardBank) {
            // If we're in the card bank, go through the options to find the
            // one with the same content
            _.each(
                this.props.options,
                function (opt, i) {
                    if (opt.content === this.state.dragContent) {
                        const card = ReactDOM.findDOMNode(
                            // eslint-disable-next-line react/no-string-refs
                            this.refs["bank" + i],
                        );
                        finalOffset = $(card).position();
                    }
                },
                this,
            );
            // eslint-disable-next-line react/no-string-refs
        } else if (this.refs.placeholder != null) {
            // Otherwise, go to the position that the placeholder is at
            finalOffset = $(
                // eslint-disable-next-line react/no-string-refs
                ReactDOM.findDOMNode(this.refs.placeholder),
            ).position();
        }

        if (finalOffset == null) {
            // If we didn't find a card to go to, simply make the changes we
            // would have made at the end. (should only happen if we are
            // messing around with card contents, and not on the real site)
            onAnimationEnd();
        } else {
            this.setState({
                offsetPos: offset,
                animateTo: finalOffset,
                onAnimationEnd: onAnimationEnd,
                animating: true,
                dragging: false,
            });
        }
    };

    onMouseMove: ($FlowFixMe) => void = (loc) => {
        // eslint-disable-next-line react/no-string-refs
        const draggable = this.refs.dragging;
        if (draggable == null) {
            return;
        }

        let index;
        if (this.isCardInBank(draggable)) {
            index = null;
        } else {
            index = this.findCorrectIndex(draggable, this.state.current);
        }

        this.setState({
            mousePos: loc,
            placeholderIndex: index,
        });
    };

    findCorrectIndex: ($FlowFixMe, $FlowFixMe) => $FlowFixMe = (
        draggable,
        list,
    ) => {
        // Find the correct index for a card given the current cards.
        const isHorizontal = this.props.layout === HORIZONTAL;
        // eslint-disable-next-line react/no-string-refs
        const $dragList = $(ReactDOM.findDOMNode(this.refs.dragList));
        const leftEdge = $dragList.offset().left;
        const topEdge = $dragList.offset().top;
        const midWidth =
            $(ReactDOM.findDOMNode(draggable)).offset().left - leftEdge;
        const midHeight =
            $(ReactDOM.findDOMNode(draggable)).offset().top - topEdge;
        let index = 0;
        let sumWidth = 0;
        let sumHeight = 0;

        if (isHorizontal) {
            _.each(
                list,
                function (opt, i) {
                    const card = ReactDOM.findDOMNode(
                        // eslint-disable-next-line react/no-string-refs
                        this.refs["sortable" + i],
                    );
                    const outerWidth = $(card).outerWidth(true);
                    if (midWidth > sumWidth + outerWidth / 2) {
                        index += 1;
                    }
                    sumWidth += outerWidth;
                },
                this,
            );
        } else {
            _.each(
                list,
                function (opt, i) {
                    const card = ReactDOM.findDOMNode(
                        // eslint-disable-next-line react/no-string-refs
                        this.refs["sortable" + i],
                    );
                    const outerHeight = $(card).outerHeight(true);
                    if (midHeight > sumHeight + outerHeight / 2) {
                        index += 1;
                    }
                    sumHeight += outerHeight;
                },
                this,
            );
        }

        return index;
    };

    isCardInBank: ($FlowFixMe) => boolean = (draggable) => {
        if (draggable == null) {
            return false;
        }

        const isHorizontal = this.props.layout === HORIZONTAL,
            $draggable = $(ReactDOM.findDOMNode(draggable)),
            // eslint-disable-next-line react/no-string-refs
            $bank = $(ReactDOM.findDOMNode(this.refs.bank)),
            draggableOffset = $draggable.offset(),
            bankOffset = $bank.offset(),
            draggableHeight = $draggable.outerHeight(true),
            bankHeight = $bank.outerHeight(true),
            bankWidth = $bank.outerWidth(true),
            // eslint-disable-next-line react/no-string-refs
            dragList = ReactDOM.findDOMNode(this.refs.dragList),
            dragListWidth = $(dragList).width(),
            draggableWidth = $draggable.outerWidth(true);

        if (isHorizontal) {
            return (
                draggableOffset.top + draggableHeight / 2 <
                bankOffset.top + bankHeight
            );
        }
        return (
            draggableOffset.left + draggableWidth / 2 <
            bankOffset.left + bankWidth
        );
    };

    // This component makes use of a lot of DOM manipulation
    // For testing and direct manipulation of values there's a function
    // to directly set the list value
    setListValues: ($ReadOnlyArray<string>) => void = (values) => {
        const list = values.map((value: string) => {
            return {content: value};
        });
        // $FlowFixMe[prop-missing]
        this.props.onChange({
            current: list,
        });

        this.setState({current: list});
    };

    getUserInput: () => $FlowFixMe = () => {
        return {
            current: _.map(this.props.current, function (v) {
                return v.content;
            }),
        };
    };

    simpleValidate: ($FlowFixMe) => $FlowFixMe = (rubric) => {
        // $FlowFixMe[prop-missing]
        return Orderer.validate(this.getUserInput(), rubric);
    };
}

_.extend(Orderer, {
    validate: function (state, rubric) {
        if (state.current.length === 0) {
            return {
                type: "invalid",
                message: null,
            };
        }

        const correct = _.isEqual(
            state.current,
            _.pluck(rubric.correctOptions, "content"),
        );

        return {
            type: "points",
            earned: correct ? 1 : 0,
            total: 1,
            message: null,
        };
    },
});

export default ({
    name: "orderer",
    displayName: "Orderer",
    widget: Orderer,
    isLintable: true,
}: WidgetExports<typeof Orderer>);
