import * as util from './dwUtils.js'

export async function basicMove({
                                    actorData = {},
                                    targetActor = {},
                                    flavor = null,
                                    title = null,
                                    move = null,
                                    speaker = null,
                                    options = []
                                }) {

    let baseFormula = '2d6';
    let moveData = actorData.items.find(i => i.name.toLowerCase() === move.toLowerCase());
    let ability = moveData.data.data.rollType.toLowerCase();
    let mod = moveData.data.data.rollMod;
    let abilityMod = actorData.data.data.abilities[ability].mod;
    let formula = `${baseFormula}+${abilityMod}`;
    let forward = actorData.getFlag("world", "forward");
    let frw = 0;
    if (forward) {
        frw = forward.reduce(function (a, b) {
            return a + b;
        }, 0);
    }
    if (frw) {
        formula += `+${frw}`;
    }
    if (mod && mod !== 0) {
        formula += `+${mod}`;
    }

    let cRoll = new Roll(`${formula}`);
    cRoll.roll();
    let rolled = await cRoll.render();
    let gColors = util.getColors(actorData, targetActor);
    let template = "modules/dwmacros/templates/chat/move-dialog.html";

    let templateData = {
        title: title,
        ability: ability.charAt(0).toUpperCase() + ability.slice(1),
        mod: abilityMod,
        forward: frw ? `+${frw}` : 0,
        rollDw: rolled,
        sourceColor: gColors.source,
        targetColor: gColors.target,
        sourceName: actorData ? actorData.name : "",
        targetName: targetActor ? targetActor.name : "",
        style: "",
        startingWords: "",
        middleWords: "",
        endWords: ""
    }

    await game.dice3d.showForRoll(cRoll);
    if (cRoll.total >= 10) {
        return await util.renderDiceResults({
            options: options.success,
            template: template,
            templateData: templateData,
            speaker: speaker,
            flavor: flavor,
            title: title
        });
    } else if (cRoll.total <= 6) {
        return await util.renderDiceResults({
            options: options.fail,
            template: template,
            templateData: templateData,
            speaker: speaker,
            flavor: flavor,
            title: title
        });
    } else {
        return await util.renderDiceResults({
            options: options.pSuccess,
            template: template,
            templateData: templateData,
            speaker: speaker,
            flavor: flavor,
            title: title
        });
    }
}

/**
 * HACK AND SLASH
 * @param actorData
 * @returns {Promise<void>}
 */
export async function hackAndSlash(actorData) {
    if (actorData) {
        if (game.user.targets.size === 0) {
            ui.notifications.warn("Action requires a target.");
            return;
        }

        let targetActor = game.user.targets.values().next().value.actor;
        let flavor = "Your attack is successful, chose an option.";
        let options = {
            fail: {
                details: {
                    middleWords: "Failed to Attack"
                },
                style: "background: rgba(255, 0, 0, 0.1)",
                result: null
            },
            pSuccess: {
                details: {
                    middleWords: "Successfully Attacks, but opens themselves up to Attacks from"
                },
                style: "background: rgba(255, 255, 0, 0.1)",
                result: "0"
            },
            success: {
                style: "background: rgba(0, 255, 0, 0.1)",
                result: [
                    {
                        key: "opt1",
                        icon: `<i class="fas fa-eye"></i>`,
                        label: "Your Attack deals +1d6 Damage, but you open yourself up to attack.",
                        details: {
                            middleWords: "Successfully Attacks",
                            endWords: "and deals an additional +1d6 damage"
                        },
                        result: "1d6"
                    },
                    {
                        key: "opt2",
                        icon: `<i class="fas fa-angry"></i>`,
                        label: "Deal your damage to the enemy and avoid their attack",
                        details: {
                            middleWords: "Successfully Attacks",
                            endWords: "and avoids the enemy attack"
                        },
                        result: "0"
                    }
                ]
            }
        };

        let attack = await basicMove(({actorData: actorData, targetActor: targetActor, flavor: flavor, options: options, title: "Hack And Slash", move: "Hack & Slash"}));
        if (attack) {
            await util.doDamage({actorData: actorData, targetActor: targetActor, damageMod: attack});
        }
    } else {
        ui.notifications.warn("Please select a token.");
    }
}