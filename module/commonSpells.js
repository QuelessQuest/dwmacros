/**
 * LIGHT
 * @param actorData
 * @param spellType
 * @returns {Promise<void>}
 */
export async function light(actorData, spellType) {

    let lightFlag = {
        spell: "light",
        target: {},
        cancel: function(target) {
            target.update({"dimLight": 0, "brightLight": 0});
        }
    };

    spellType({
        actorData: actorData, spellName: "Light", post: () => {
            let token = canvas.tokens.controlled[0];
            lightFlag.target = token;
            let d = new Dialog({
                title: 'Light',
                content:
                    "<input type='text' name='alwaysOn' is='colorpicker-input' id='permanent'>",
                buttons: {
                    ok: {
                        icon: '<i class="fas fa-sun"></i>',
                        label: "Cast",
                        callback: () => {
                            ChatMessage.create({
                                speaker: ChatMessage.getSpeaker(),
                                content: `${actorData.name} casts Light.<br>`
                            });
                            token.update({"dimLight": 40, "brightLight": 20, "lightAngle": 360, "lightColor": document.getElementById("permanent").value.substring(0, 7)});
                            let as = actorData.getFlag("world", "activeSpells");
                            if (as) {
                                if (!as.find(x => x.spell === 'light')) {
                                    as.push(lightFlag);
                                }
                            } else {
                                as = [lightFlag];
                            }
                            actorData.setFlag("world", "activeSpells", as);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => {
                        }
                    }
                }
            });
            d.render(true);
        }
    });
}
