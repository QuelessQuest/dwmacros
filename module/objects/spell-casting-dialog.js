/**
 * A specialized Dialog subclass for ability usage
 * @type {Dialog}
 */
export default class SpellCastingDialog extends Dialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, options);
        this.options.classes = ["dwmacros", "dialog"];
    }
}