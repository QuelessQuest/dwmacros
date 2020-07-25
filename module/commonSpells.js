import * as sh from './spellHelper.js'

/**
 * LIGHT
 * @param actorData
 * @param spellType
 * @returns {Promise<void>}
 */
export async function light(actorData, spellType) {

    sh.validateSpell({actorData: actorData, spell: "Light"}).then(v => {
        if (!v) return;

        let lightFlag = {
            spell: "light",
            target: null,
            cancel: function (thing) {
                thing.update({"dimLight": 0, "brightLight": 0});
                thing.refresh();
            }
        };

        spellType({
            actorData: actorData, spellName: "Light", post: () => {
                let token = canvas.tokens.controlled[0];
                lightFlag.target = token.uuid;
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
                                sh.setActiveSpell(actorData, 'light', lightFlag);
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
    });
}