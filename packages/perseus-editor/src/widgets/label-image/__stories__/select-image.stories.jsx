// @flow
import {StyleSheet, css} from "aphrodite";
import * as React from "react";

import SelectImage from "../select-image.jsx";

type StoryArgs = {||};

type Story = {|
    title: string,
|};

export default ({
    title: "Perseus/Editor/Widgets/Label Image/Select Image",
}: Story);

const styles = StyleSheet.create({
    wrapper: {
        // The maximum width of a widget in the editor.
        width: 338,
    },
});

const Wrapper = (props) => (
    <div className={css(styles.wrapper)}>
        <SelectImage {...props} />
    </div>
);

const WithState = () => {
    const [url, setUrl] = React.useState("");

    return (
        <div className={css(styles.wrapper)}>
            <SelectImage onChange={(url) => setUrl(url)} url={url} />
        </div>
    );
};

export const Empty = (args: StoryArgs): React.Node => {
    const props = {
        url: "",
        onChange: () => {},
    };

    return <Wrapper {...props} />;
};

export const Filled = (args: StoryArgs): React.Node => {
    const props = {
        url: "https://ka-perseus-images.s3.amazonaws.com/2ee5fc32e35c5178373b39fd304b325b2994c913.png",
        onChange: () => {},
    };

    return <Wrapper {...props} />;
};

export const Interactive = (args: StoryArgs): React.Node => {
    return <WithState />;
};
