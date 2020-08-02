import * as util from './dwUtils.js'
import {DWconst} from './DWconst.js'

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
    let sus = 0;
    let ongoing = 0;
    if (move.toLowerCase() === "cast a spell") {
        let sustained = actorData.getFlag("world", "sustained");
        if (sustained) {
            for (let sSpell of sustained) {
                sus += sSpell.data.value;
            }
        }
        if (sus) {
            formula += `-${sus}`;
        }
        ongoing = actorData.getFlag("world", "ongoing");
        if (ongoing) {
            formula += `+${ongoing}`;
        }
    }
    if (mod && mod !== 0) {
        formula += `+${mod}`;
    }
    let cRoll = new Roll(`${formula}`);
    cRoll.roll();
    let rolled = await cRoll.render();
    let gColors = util.getColors(actorData, targetActor);

    let templateData = {
        title: title,
        ability: ability.charAt(0).toUpperCase() + ability.slice(1),
        mod: abilityMod,
        ongoing: ongoing,
        sustained: sus ? `-${sus}` : 0,
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
            template: DWconst.template,
            templateData: templateData,
            speaker: speaker,
            flavor: flavor,
            title: title
        });
    } else if (cRoll.total <= 6) {
        return await util.renderDiceResults({
            options: options.fail,
            template: DWconst.template,
            templateData: templateData,
            speaker: speaker,
            flavor: flavor,
            title: title
        });
    } else {
        return await util.renderDiceResults({
            options: options.pSuccess,
            template: DWconst.template,
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

        let targetData = util.getTargets(actorData);
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
                        icon: `<i class="fas fa-dice-d6"></i>`,
                        label: "Your Attack deals +1d6 Damage, but you open yourself up to attack.",
                        details: {
                            middleWords: "Successfully Attacks",
                            endWords: "and deals an additional +1d6 damage"
                        },
                        result: "1d6"
                    },
                    {
                        key: "opt2",
                        icon: `<i class="fas fa-bacon"></i>`,
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

        let attack = await basicMove(({actorData: actorData, targetActor: targetData.targetActor, flavor: flavor, options: options, title: "Hack And Slash", move: "Hack & Slash"}));
        if (attack) {
            await util.doDamage({actorData: actorData, targetData: targetData, damageMod: attack});
        }
    } else {
        ui.notifications.warn("Please select a token.");
    }
}

export async function volley(actorData) {
    if (actorData) {
        if (game.user.targets.size === 0) {
            ui.notifications.warn("Action requires a target.");
            return;
        }

        let targetData = util.getTargets(actorData);
        let flavor = "Your attack is successful, chose an option.";
        let options = {
            fail: {
                details: {
                    middleWords: "Failed to Attack"
                },
                style: "background: rgba(255, 0, 0, 0.1)",
                result: null
            },
            success: {
                details: {
                    middleWords: "Successfully Attacks"
                },
                style: "background: rgba(0, 255, 0, 0.1)",
                result: "0"
            },
            pSuccess: {
                style: "background: rgba(255, 255, 0, 0.1)",
                result: [
                    {
                        key: "opt1",
                        icon: `<i class="fas fa-shoe-prints"></i>`,
                        label: "You have to move to get the shot, placing you in danger",
                        details: {
                            middleWords: "Successfully Attacks",
                            endWords: ", but moves and places themselves in danger."
                        },
                        result: "0"
                    },
                    {
                        key: "opt2",
                        icon: `<i class="fas fa-wind"></i>`,
                        label: "You have to take what you can get",
                        details: {
                            middleWords: "Successfully Attacks",
                            endWords: ", but takes the shot that was offered"
                        },
                        result: "-1d6"
                    },
                    {
                        key: "opt3",
                        icon: `<i class="fas fa-compress-arrows-alt"></i>`,
                        label: "You have to take several shots",
                        details: {
                            middleWords: "Successfully Attacks",
                            endWords: ", but it takes more than one shot"
                        },
                        result: "0"
                    }
                ]
            }
        };

        let attack = await basicMove(({actorData: actorData, targetActor: targetData.targetActor, flavor: flavor, options: options, title: "Volley", move: "Volley"}));
        if (attack) {
            await util.doDamage({actorData: actorData, targetData: targetData, damageMod: attack});
        }
    } else {
        ui.notifications.warn("Please select a token.");
    }
}