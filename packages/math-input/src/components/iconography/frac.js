/**
 * An autogenerated component that renders the FRAC iconograpy in SVG.
 *
 * Generated with: https://gist.github.com/crm416/3c7abc88e520eaed72347af240b32590.
 */
import PropTypes from "prop-types";
import * as React from "react";

class FracInclusive extends React.Component {
    static propTypes = {
        color: PropTypes.string.isRequired,
    };

    render() {
        return (
            <svg width="48" height="48" viewBox="0 0 48 48">
                <g fill="none" fillRule="evenodd">
                    <path fill="none" d="M0 0h48v48H0z" />
                    <g transform="translate(12 12)">
                        <path fill="none" d="M0 0h24v24H0z" />
                        <path
                            d="M8 16.997c0-.55.453-.997.997-.997h6.006c.55 0 .997.453.997.997v6.006c0 .55-.453.997-.997.997H8.997c-.55 0-.997-.453-.997-.997v-6.006zM10 18h4v4h-4v-4z"
                            fill={this.props.color}
                        />
                        <rect
                            fill={this.props.color}
                            x="2"
                            y="11"
                            width="20"
                            height="2"
                            rx="1"
                        />
                        <path
                            d="M8 .997C8 .447 8.453 0 8.997 0h6.006c.55 0 .997.453.997.997v6.006c0 .55-.453.997-.997.997H8.997C8.447 8 8 7.547 8 7.003V.997zM10 2h4v4h-4V2z"
                            fill={this.props.color}
                        />
                    </g>
                </g>
            </svg>
        );
    }
}

export default FracInclusive;
