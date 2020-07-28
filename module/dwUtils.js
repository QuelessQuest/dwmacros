/**
 * If the actor and or target are characters, return the player color
 * @param actorData
 * @param target
 * @returns {Promise<{source: string, target: string}>}
 */
export function getColors(actorData, target) {

    let gcolors = {
        source: "#000000",
        target: "#000000"
    }

    let sourceUser = game.users.find(u => u.data.character === actorData._id);
    if (sourceUser) {
        gcolors.source = sourceUser.data.color;
    }

    let targetUser = game.users.find(u => u.data.character === target._id);
    if (targetUser) {
        gcolors.target = targetUser.data.color;
    }

    return gcolors;
}

export function coloredChat(actorData, target, { startingWords= "", middleWords= "", endWords= ""}) {
    let template = "modules/dwmacros/templates/chat/defaultWithColor.html";

    let gcolors = getColors(actorData, target);

    let templateData = {
        sourceColor: gcolors.source,
        sourceName: actorData.name,
        targetColor: gcolors.target,
        targetName: target.name,
        startingWords: startingWords,
        middleWords: middleWords,
        endWords: endWords
    }

    renderTemplate(template, templateData).then(content => {
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker(),
            content: content
        });
    });
}