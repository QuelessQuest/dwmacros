import {DWconst} from './DWconst.js'

export default class ChatDWMacros extends ChatMessage {

    /** @override */
    async render(force, options) {
        // Determine some metadata
        const data = duplicate(this.data);
        const isWhisper = this.data.whisper.length;
        const isVisible = this.isContentVisible;
        // Construct message data
        const messageData = {
            message: data,
            user: game.user,
            author: this.user,
            alias: this.alias,
            cssClass: [
                this.data.type === CONST.CHAT_MESSAGE_TYPES.IC ? "ic" : null,
                this.data.type === CONST.CHAT_MESSAGE_TYPES.EMOTE ? "emote" : null,
                this.options.test === "x" ? "dwmacros damage" : null,
                isWhisper ? "whisper" : null,
                this.data.blind ? "blind": null
            ].filter(c => c !== null).join(" "),
            isWhisper: this.data.whisper.some(id => id !== game.user._id),
            whisperTo: this.data.whisper.map(u => {
                let user = game.users.get(u);
                return user ? user.name : null;
            }).filter(n => n !== null).join(", ")
        };
        console.log("MD");
        console.log(this.options);
        console.log(this.data);
        console.log(messageData);
        // Enrich some data for dice rolls
        if ( this.isRoll ) {
            // Render public rolls if they do not already start with valid HTML
            const hasHTMLContent = data.content.slice(0, 1) === "<";
            if ( isVisible && !hasHTMLContent ) {
                data.content = await this.roll.render();
            }
            // Conceal some private roll information
            if ( !isVisible ) {
                data.content = await this.roll.render({isPrivate: !isVisible});
                data.flavor = `${this.user.name} privately rolled some dice`;
                messageData.isWhisper = false;
                messageData.alias = this.user.name;
            }
        }
        // Define a border color
        if ( this.data.type === CONST.CHAT_MESSAGE_TYPES.OOC ) {
            messageData.borderColor = this.user.color;
        }
        // Render the chat message
        let html = await renderTemplate(CONFIG.ChatMessage.template, messageData);
        html = $(html);
        // Call a hook for the rendered ChatMessage data
        Hooks.call("renderChatMessage", this, html, messageData);
        return html;
    }
}