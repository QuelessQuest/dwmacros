/**
 * If the actor and or target are characters, return the player color
 * @param actorData
 * @param target
 * @returns {{source: string, target: string}}
 */
export function getColors(actorData, target) {

    let gColors = {
        source: "#000000",
        target: "#000000"
    }

    if (actorData) {
        let sourceUser = game.users.find(u => u.data.character === actorData._id);
        if (sourceUser) {
            gColors.source = sourceUser.data.color;
        }
    }

    if (target) {
        let targetUser = game.users.find(u => u.data.character === target._id);
        if (targetUser) {
            gColors.target = targetUser.data.color;
        }
    }

    return gColors;
}

/**
 * COLORED CHAT
 * @param actorData
 * @param target
 * @param startingWords
 * @param middleWords
 * @param endWords
 * @returns {Promise<void>}
 */
export async function coloredChat({
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

    await renderTemplate(template, templateData).then(content => {
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker(),
            content: content
        });
    });
}

/**
 * GET TARGETS
 * @param actorData
 * @returns {{targetActor: *, targetToken: PlaceableObject}}
 */
export function getTargets(actorData) {
    let targetActor;
    let targetToken;
    if (game.user.targets.size > 0) {
        targetActor = game.user.targets.values().next().value.actor;
        let xx = canvas.tokens.placeables.filter(placeable => placeable.isTargeted);
        targetToken = xx[0];
    } else {
        targetActor = actorData;
        targetToken = canvas.tokens.controlled[0];
    }
    return {
        targetActor: targetActor,
        targetToken: targetToken
    }
}