// @flow
/**
 * The Option is an item to be used in the Select components and the
 * derivations such as MultiSelect, CheckList, and CheckBoxList. Also includes
 * OptionGroup which is an internal component used in the dropdowns to house
 * a list of options.
 **/
import {components, globalStyles} from "@khanacademy/perseus";
import {css, StyleSheet} from "aphrodite";
import * as React from "react";
import ReactDOM from "react-dom";

import {focusWithChromeStickyFocusBugWorkaround} from "./util.js";

export type OptionRenderer = (
    children: ?React.Element<any>,
    value: string,
    selected: boolean,
    disabled?: boolean,
) => React.Element<any>;

const {Icon} = components;
const {colors} = globalStyles;

const findAndFocusElement = (component: ?Element) => {
    const DOMNode: ?(Element | Text) = ReactDOM.findDOMNode(component);
    const button = ((DOMNode: any): HTMLInputElement);
    // $FlowIgnore[method-unbinding]
    if (button.focus) {
        focusWithChromeStickyFocusBugWorkaround(button);
    }
};

type OptionProps = {|
    // The value to use when the option is selected
    value: string,

    // The display of the option
    children?: React.Node,

    // Is the current option selected?
    selected?: boolean,

    // Is the current option disabled?
    disabled?: boolean,

    // An event when an option is clicked
    onClick?: () => void,

    // An optional rendering function to render the details of the option
    optionRenderer?: OptionRenderer,

    // An optional function to call when the dropdown should close
    // Only relevant if the Option is inside of a dropdown menu
    onDropdownClose?: () => void,

    // An optional value to override the focus styling of an option.
    // Use caution when using this - keyboard users need to know what they're
    // focused on in order to interact with the product!
    hideFocusState?: boolean,

    // An optional test id that can be used to identify this Option in automated tests.
    testId?: string,

    // Text to provide for assistive tech users
    ariaLabel?: string,
|};

const check = `M10,3.8C10,4,9.9,4.2,9.8,4.3L5.1,8.9L4.3,9.8C4.2,9.9,4,10,3.8,10
 S3.5,9.9,3.4,9.8L2.5,8.9L0.2,6.6C0.1,6.5,0,6.3,0,6.2s0.1-0.3,0.2-0.4
 l0.9-0.9c0.1-0.1,0.3-0.2,0.4-0.2s0.3,0.1,0.4,0.2l1.9,1.9l4.2-4.2c0.1
 -0.1,0.3-0.2,0.4-0.2c0.2,0,0.3,0.1,0.4,0.2l0.9,0.9C9.9,3.5,10,3.7,
 10,3.8z`;

export const optionHeight = 30;

class Option extends React.Component<OptionProps> {
    node: HTMLDivElement;

    handleKeyDown(event: any): void {
        const {onDropdownClose} = this.props;
        const pressedKey = event.key;
        const focusedElement = event.target;

        if (pressedKey === "ArrowDown" && focusedElement.nextSibling) {
            event.preventDefault();
            focusedElement.nextSibling.focus();
        }
        if (pressedKey === "ArrowUp" && focusedElement.previousSibling) {
            event.preventDefault();
            focusedElement.previousSibling.focus();
        }
        if (
            pressedKey === "ArrowUp" &&
            !focusedElement.previousSibling &&
            onDropdownClose
        ) {
            event.preventDefault();
            onDropdownClose();
        }
        if (
            (pressedKey === "Escape" || pressedKey === "Tab") &&
            onDropdownClose
        ) {
            onDropdownClose();
        }
    }

    render(): React.Node {
        const {
            selected,
            value,
            onClick,
            children,
            optionRenderer,
            disabled,
            hideFocusState,
            testId,
            ariaLabel,
        } = this.props;

        return (
            <button
                // TODO(mdr): We found a new Flow error when upgrading:
                //     "node (null) This type is incompatible with this.node (HTMLDivElement)"
                // $FlowFixMe[incompatible-type](0.52.0->0.53.0)
                ref={(node) => (this.node = node)}
                value={value}
                role="menuitemradio"
                aria-checked={selected}
                className={css(
                    styles.notAButton,
                    disabled && styles.cursorDefault,
                    hideFocusState && styles.noFocus,
                )}
                onClick={(value: string) => {
                    if (!disabled && onClick) {
                        // TODO(mdr): We found a new Flow error here when upgrading
                        //     from 0.35.0 to 0.52.0: "value (unused function
                        //     argument)". This comment was automatically added to
                        //     this file, to suppress the error for now. Please
                        //     consider fixing!
                        // $FlowFixMe[extra-arg]
                        onClick(value);
                    }
                }}
                onKeyDown={(event: KeyboardEvent) => this.handleKeyDown(event)}
                aria-disabled={disabled}
                aria-label={ariaLabel}
                data-test-id={testId}
            >
                {optionRenderer &&
                    optionRenderer(
                        /**
                         * This expects a `React.Element<>` but `children` is a
                         * `React.Node`. We can convert a `React.Node` to a
                         * `React.Element<>` by wrapping it in a fragment.
                         */
                        <>{children}</>,
                        value || "",
                        selected || false,
                        disabled,
                    )}

                {!optionRenderer && (
                    <span
                        className={css(
                            styles.option,
                            selected && styles.optionSelected,
                            disabled && styles.optionDisabled,
                        )}
                    >
                        {children}
                        {selected && (
                            <span className={css(styles.check)}>
                                <Icon icon={check} />
                            </span>
                        )}
                    </span>
                )}
            </button>
        );
    }
}

// TODO(kevinb):
// - keep the the option group within the page bounds
// - do we really want to dismiss this on scroll
// - how does the drop down interact with tooltips?  what's the z-index order?
class OptionGroup extends React.Component<{
    // An event when an option is selected
    onSelected: (value: string) => void,
    // The list of options to display
    children?: Array<React.Element<typeof Option>>,
    // The currently selected options
    selectedValues: Array<string>,
    // An optional rendering function to render the details of the options
    optionRenderer?: OptionRenderer,
    // An override to skip the bit of top/bottom spacing around the group
    noMargin?: boolean,
    // An optional function to call when the dropdown should close
    onDropdownClose?: () => void,
    // An optional value to override the focus styling of an option.
    // Use caution when using this - keyboard users need to know what
    // they're focused on in order to interact with the product!
    hideFocusState?: boolean,
    ...
}> {
    focusedElement: Element;

    componentDidMount() {
        if (this.focusedElement) {
            findAndFocusElement(this.focusedElement);
        }
    }

    render(): React.Element<"div"> {
        const {
            children,
            onSelected,
            selectedValues,
            optionRenderer,
            noMargin,
            onDropdownClose,
            hideFocusState,
        } = this.props;

        return (
            <div
                style={{top}}
                className={css(
                    styles.optionGroup,
                    noMargin && styles.optionGroupNoMargin,
                )}
            >
                {React.Children.map(children, (child, index) => {
                    const selected = selectedValues.includes(child.props.value);

                    const reference =
                        selected || index === 0
                            ? (node: Element) => (this.focusedElement = node)
                            : null;

                    return React.cloneElement(child, {
                        ...child.props,
                        key: index,
                        selected: selected,
                        onClick: () => onSelected(child.props.value),
                        optionRenderer: optionRenderer,
                        ref: reference,
                        onDropdownClose: onDropdownClose,
                        hideFocusState: hideFocusState,
                    });
                })}
            </div>
        );
    }
}

const styles = StyleSheet.create({
    optionGroup: {
        margin: "4px 0",
    },
    optionGroupNoMargin: {
        margin: 0,
    },
    option: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 32,
        paddingRight: 32,
        height: optionHeight,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        color: colors.gray17,
        userSelect: "none",

        ":hover": {
            backgroundColor: colors.gray95,
        },
    },
    optionSelected: {
        backgroundColor: colors.gray95,
        color: "#11ACCD",
    },
    optionDisabled: {
        color: colors.gray76,
        ":hover": {
            backgroundColor: "transparent",
        },
    },
    check: {
        position: "absolute",
        left: 11,
    },
    notAButton: {
        backgroundColor: "transparent",
        border: "none",
        display: "block",
        padding: 0,
        margin: 0,
        width: "100%",
        // <button> uses user agent stylesheet over inherit so we need to set
        // it explicitly.
        font: "inherit",
    },
    noFocus: {
        outline: "none",
    },
    cursorDefault: {
        cursor: "default",
    },
});

export {OptionGroup};
export default Option;
