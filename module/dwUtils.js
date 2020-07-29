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

    if (actorData) {
        let sourceUser = game.users.find(u => u.data.character === actorData._id);
        if (sourceUser) {
            gcolors.source = sourceUser.data.color;
        }
    }

    if (target) {
        let targetUser = game.users.find(u => u.data.character === target._id);
        if (targetUser) {
            gcolors.target = targetUser.data.color;
        }
    }

    return gcolors;
}

export function coloredChat({
                                actorData = null,
                                target = null,
                                startingWords = "",
                                middleWords = "",
                                endWords = ""
                            }) {
    let template = "modules/dwmacros/templates/chat/defaultWithColor.html";

    let gcolors = getColors(actorData, target);

    let sName = actorData ? actorData.name : "";
    let tName = target ? target.name : "";

    let templateData = {
        sourceColor: gcolors.source,
        sourceName: sName,
        targetColor: gcolors.target,
        targetName: tName,
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

export function getTargets(actorData) {
    let targetActor;
    let targetToken;
    if (game.user.targets.size > 0) {
        targetActor = game.user.targets.values().next().value.actor;
        targetToken = canvas.tokens.placeables.filter(placeable => placeable.isTargeted)[0];
    } else {
        targetActor = actorData;
        targetToken = canvas.tokens.controlled[0];
    }
    return {
        targetActor: targetActor,
        targetToken: targetToken
    }
}