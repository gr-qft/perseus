// @flow

// eslint-disable-next-line import/no-unassigned-import
import "cypress-jest-adapter";
// eslint-disable-next-line import/no-unassigned-import
import "cypress-wait-until";

if (Cypress.env("CYPRESS_COVERAGE")) {
    require("@cypress/code-coverage/support");
}

// Here we register our custom commands
// NOTE: If we end up with a lot of custom commands, we should break
// each command into its own file.

/**
 * Click a node and drag it to the specified {x, y} position
 */
const dragTo = (node, pos: {|x: number, y: number|}) => {
    return cy
        .wrap(node)
        .trigger("mousedown", {force: true, which: 1, button: 0})
        .trigger("mousemove", {force: true, pageX: pos.x, pageY: pos.y})
        .trigger("mouseup", {force: true})
        .trigger("mouseout", {force: true});
};
Cypress.Commands.add("dragTo", {prevSubject: true}, dragTo);
