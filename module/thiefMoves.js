import * as util from './dwUtils.js'
import {basicMove} from "./basicMoves.js";

/**
 * Provides a dialog to chose a new shape. Token image will be updated to reflect the selection.
 * @returns {Promise<void>}
 */
export async function backstab(actorData) {
    let canDo = await util.validateMove({actorData: actorData, move: "Backstab", target: true});
    if (!canDo) {
        return;
    }

    if (game.user.targets.size <= 0) {
        ui.notifications.warn("Backstab needs a target");
        return;
    }

    let targetData = util.getTargets(actorData);
    await new Dialog({
        title: 'Backstab',
        content: `<p>You are attempting to Backstab ${targetData.targetActor.name}. Do you</p>`,
        buttons: {
            dmg: {
                icon: '<i class="fas fa-bullseye"></i>',
                label: "Deal Your Damage",
                callback: () => {
                    util.doDamage({actorData: actorData, targetData: targetData, title: "Backstab"});
                }
            },
            rr: {
                icon: '<i class="fas fa-dice-d6"></i>',
                label: "Roll",
                callback: () => {
                    backstabRoll({actorData: actorData, targetData: targetData});
                }
            }
        }
    }).render(true);
}

async function backstabRoll({actorData = {}, targetData = {}}) {
    let flavor = "Your attack is successful, chose an option.";
    let options = {
        fail: {
            dialogType: CONFIG.DWMacros.dialogTypes.fail,
            details: {
                middleWords: "Failed to Backstab"
            },
            result: null
        },
        pSuccess: {
            dialogType: CONFIG.DWMacros.dialogTypes.partial,
            details: {
                middleWords: "Successfully Backstabs"
            },
            result: "0"
        },
        success: {
            dialogType: CONFIG.DWMacros.dialogTypes.success,
            result: "0"
        }
    };
    let attack = await basicMove(({actorData: actorData, targetActor: targetData.targetActor, flavor: flavor, options: options, title: "Backstab", move: "Backstab"}));
}
