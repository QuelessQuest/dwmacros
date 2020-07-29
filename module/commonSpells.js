import * as sh from './spellHelper.js'
import * as util from './dwUtils.js'

/**
 * LIGHT
 * @param actorData
 * @param spellType
 * @returns {Promise<void>}
 */
export async function light(actorData, spellType) {

    sh.validateSpell({actorData: actorData, spell: "Light"}).then(v => {
        if (!v) return;

        spellType({
            actorData: actorData, spellName: "Light"
        }).then(r => {
            if (!r) return;

            let lightFlag = {
                spell: "light",
                endSpell: function (actorData) {
                    let targetData = util.getTargets(actorData);
                    targetData.targetToken.update({"dimLight": 0, "brightLight": 0});
                }
            };
            new Dialog({
                title: 'Light',
                content:
                    "<input type='text' name='alwaysOn' is='colorpicker-input' id='permanent'>",
                buttons: {
                    ok: {
                        icon: '<i class="fas fa-sun"></i>',
                        label: "Cast",
                        callback: () => {
                            util.coloredChat({
                                actorData: actorData,
                                middleWords: "casts Light"
                            });
                            let targetData = util.getTargets(actorData);
                            targetData.targetToken.update({"dimLight": 40, "brightLight": 20, "lightAngle": 360, "lightColor": document.getElementById("permanent").value.substring(0, 7)});
                            sh.setActiveSpell(actorData, lightFlag);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => {
                        }
                    }
                }
            }).render(true);
        });
    });
}