/**
 * A specialized Dialog subclass for ability usage
 * @type {Dialog}
 */
export default class SpellPrepareDialog extends Dialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, options);
        this.options.classes = ["dwmacros", "horiz", "dialog"];
    }
}