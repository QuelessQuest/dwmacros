export default class ChatDWMacros extends ChatMessage {

    /** @override */
    static async create(data, options) {
        return super.create(data, options);
    }

    /*
    prepareData() {
        super.prepareData();
        if (!this.data.dialogType) this.data.dialogType = CONFIG.DWMacros.dialogTypes.normal;
    }

     */
}