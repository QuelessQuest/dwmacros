import * as sh from './spellHelper.js'
import * as util from './dwUtils.js'
import * as basic from './basicMoves.js'
import {getColors} from "./dwUtils.js";
import {DWconst} from './DWconst.js'

/**
 * ClericSpell
 * Used to cast all Cleric Spells. Provides the Success with Consequences dialog if necessary
 * @param actorData
 * @param spellName
 * @param move
 * @param target
 * @param post
 * @returns {Promise<*>}
 */
export async function clericSpell({actorData: actorData, spellName: spellName, move: move, target: target = false}) {
    if (actorData) {
        if (target) {
            if (game.user.targets.size === 0) {
                ui.notifications.warn("Spell requires a target.");
                return;
            }
        }

        let targetData = util.getTargets(actorData);
        let flavor = "Your casting succeeds, however you must select one of the following options.";
        let options = {
            success: {
                details: {
                    middleWords: `Successfully Casts ${spellName} on`
                },
                style: "background: rgba(0, 255, 0, 0.1)",
                result: "NORMAL"
            },
            fail: {
                details: {
                    middleWords: `Failed to Cast ${spellName}`
                },
                style: "background: rgba(255, 0, 0, 0.1)",
                result: "FAILED"
            },
            pSuccess: {
                style: "background: rgba(255, 255, 0, 0.1)",
                result: [
                    {
                        key: "opt1",
                        icon: `<i class="fas fa-eye"></i>`,
                        label: "You draw unwelcome attention or put yourself in a spot",
                        details: {
                            middleWords: `Successfully Casts ${spellName} on`,
                            endWords: "but draws unwelcome attention or is put in a spot"
                        },
                        result: "NORMAL"
                    },
                    {
                        key: "opt2",
                        icon: `<i class="fas fa-angry"></i>`,
                        label: "Your casting distances you from your deity",
                        details: {
                            middleWords: `Successfully Casts ${spellName} on`,
                            endWords: "But distances themselves from their deity"
                        },
                        result: "DISTANCED"
                    },
                    {
                        key: "opt3",
                        icon: `<i class="fas fa-ban"></i>`,
                        label: "After you cast it, the spell is revoked by your deity",
                        details: {
                            middleWords: `Successfully Casts ${spellName} on`,
                            endWords: "but has the spell revoked by their deity"
                        },
                        result: "REVOKED"
                    }
                ]
            }
        };

        let cast = await basic.basicMove({
            actorData: actorData,
            targetActor: targetData.targetActor,
            flavor: flavor,
            title: spellName,
            move: move,
            options: options
        });

        let success = false;
        switch (cast) {
            case "FAILED":
                let targetData = util.getTargets(actorData);
                await TokenMagic.deleteFilters(targetData.targetToken);
                break;
            case "DISTANCED":
                await sh.setOngoing(actorData, -1);
                success = true;
                break;
            case "REVOKED":
                let spell = actorData.data.items.find(i => i.name.toLowerCase() === title.toLowerCase());
                let sId = spell._id;
                const item = actorData.getOwnedItem(sId);
                if (item) {
                    let updatedItem = duplicate(item);
                    updatedItem.data.prepared = true;
                    await actorData.updateOwnedItem(updatedItem);
                }
                success = true;
                break;
            default:
                success = true;
        }
        return new Promise(resolve => {
            resolve(success);
        });
    } else {
        ui.notifications.warn("Please select a token.");
    }
}

// ROTES =======================================================================================

/**
 * GUIDANCE
 * @param actorData
 * @returns {Promise<void>}
 */
export async function guidance(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Guidance"}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Guidance"
        });
    });
}

/**
 * SANCTIFY
 * @param actorData
 * @returns {Promise<void>}
 */
export async function sanctify(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Sanctify"}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Sanctify"
        });
    });
}

// FIRST LEVEL =======================================================================================

/**
 * BLESS
 * @param actorData
 * @returns {Promise<void>}
 */
export async function bless(actorData) {
    let valid = await sh.validateSpell({actorData: actorData, spell: "Bless"});
    if (!valid) return;

    let cast = await clericSpell({actorData: actorData, spellName: "Bless", move: "Cast A Spell"});
    if (!cast) return;

    let targetData = util.getTargets(actorData);

    let bGlow =
        [{
            filterType: "zapshadow",
            alphaTolerance: 0.50
        },
            {
                filterType: "xglow",
                auraType: 1,
                color: 0x70BBFF,
                thickness: 2,
                scale: 0.25,
                time: 0,
                auraIntensity: 0.5,
                subAuraIntensity: 2,
                threshold: 0.25,
                discard: false,
                animated:
                    {
                        time:
                            {
                                active: true,
                                speed: 0.0006,
                                animType: "move"
                            }
                    }
            }];

    await TokenMagic.addFilters(targetData.targetToken, bGlow);

    let blessFlag = {
        spell: "Bless",
        data: {
            targetName: targetData.targetActor.name,
            targetId: targetData.targetActor._id,
            targetToken: targetData.targetToken.id,
            sustained: true,
            forward: true,
            filter: true,
            startingWords: "",
            middleWords: "has canceled the Bless on",
            endWords: ""
        }
    };

    await sh.setActiveSpell(actorData, blessFlag);
    await sh.setSustained(actorData, {spell: "Bless", data: {targetName: targetData.targetActor.name, value: 1}});
    await sh.setForward(targetData.targetActor, {type: "Bless", value: 1});

    await util.coloredChat({
        actorData: actorData,
        target: targetData.targetActor,
        middleWords: "has Blessed"
    });
}

/**
 * CURE LIGHT WOUNDS
 * @param actorData
 * @returns {Promise<void>}
 */
export async function cureLightWounds(actorData) {

    let valid = await sh.validateSpell({actorData: actorData, spell: "Cure Light Wounds", target: true});
    if (!valid) return;

    let cast = await clericSpell({actorData: actorData, spellName: "Cure Light Wounds", move: "Cast A Spell", target: true})
    if (!cast) return;

    let targetData = util.getTargets(actorData);
    let glow = [
        {
            filterType: "zapshadow",
            alphaTolerance: 0.50
        },
        {
            filterType: "outline",
            autoDestroy: true,
            padding: 10,
            color: 0xFFFFFF,
            thickness: 1,
            quality: 10,
            animated:
                {
                    thickness:
                        {
                            active: true,
                            loopDuration: 4000,
                            loops: 1,
                            animType: "syncCosOscillation",
                            val1: 1,
                            val2: 8
                        }
                }
        }];

    await TokenMagic.addFiltersOnTargeted(glow);
    let roll = new Roll("1d8", {});
    roll.roll();
    let rolled = await roll.render();
    await game.dice3d.showForRoll(roll);

    let maxHeal = Math.clamped(roll.result, 0,
        targetData.targetActor.data.data.attributes.hp.max - targetData.targetActor.data.data.attributes.hp.value);

    if (targetData.targetActor.permission !== CONST.ENTITY_PERMISSIONS.OWNER)
        roll.toMessage({
            speaker: ChatMessage.getSpeaker(),
            flavor: `${actorData.name} casts Cure Light Wounds on ${targetActor.data.name}.<br>
                            <p><em>Manually apply ${maxHeal} HP of healing to ${targetActor.data.name}</em></p>`
        });
    else {
        let gColors = getColors(actorData, targetData.targetActor);
        let sName = actorData ? actorData.name : "";
        let tName = targetData.targetActor ? targetData.targetActor.name : "";
        let templateData = {
            sourceColor: gColors.source,
            sourceName: sName,
            targetColor: gColors.target,
            targetName: tName,
            middleWords: "casts Cure Light Wounds on",
            endWords: `for ${maxHeal} HP`,
            title: "Healing",
            base: "1d8",
            rollDw: rolled
        }
        renderTemplate(DWconst.template, templateData).then(content => {
            let chatData = {
                speaker: ChatMessage.getSpeaker(),
                content: content
            };
            ChatMessage.create(chatData);
            targetData.targetActor.update({
                "data.attributes.hp.value": targetData.targetActor.data.data.attributes.hp.value + maxHeal
            })
        });
    }
}

/**
 * CAUSE FEAR
 * @param actorData
 * @returns {Promise<void>}
 */
export async function causeFear(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Cause Fear"}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Cause Fear"
        }).then(r => {
            if (!r) return;

        });
    });
}

/**
 * DETECT ALIGNMENT
 * @param actorData
 * @returns {Promise<void>}
 */
export async function detectAlignment(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Detect Alignment"}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Detect Alignment"
        });
    });
}

/**
 * MAGIC WEAPON
 * @param actorData
 * @returns {Promise<void>}
 */
export async function magicWeapon(actorData) {
    let valid = await sh.validateSpell({actorData: actorData, spell: "Magic Weapon"});
    if (!valid) return;

    let cast = await clericSpell({actorData: actorData, spellName: "Magic Weapon"});
    if (!cast) return;

    let currentMisc = actorData.data.data.attributes.damage.misc;

    let params =
        [
            {
                filterType: "ray",
                time: 0,
                color: 0x70BBFF,
                alpha: 0.25,
                divisor: 32,
                anchorY: 0,
                animated:
                    {
                        time:
                            {
                                active: true,
                                speed: 0.0005,
                                animType: "move"
                            }
                    }
            }
        ];

    await TokenMagic.addFiltersOnSelected(params);
    let flag = {
        spell: "Magic Weapon",
        data: {
            targetName: actorData.name,
            sustained: true,
            filter: true,
            targetToken: canvas.tokens.controlled[0].id,
            damage: "1d4",
            middleWords: "cancels Magic Weapon"
        }
    };

    if (currentMisc) {
        currentMisc += "+1d4";
    } else {
        currentMisc = "1d4";
    }
    await sh.setActiveSpell(actorData, flag);
    await sh.setSustained(actorData, {spell: "Magic Weapon", data: {targetName: actorData.name, value: 1}});
    await actorData.update({"data": {"attributes": {"damage": {"misc": currentMisc}}}});
    await util.coloredChat({
        actorData: actorData,
        middleWords: "casts Magic Weapon"
    });
}

/**
 * SANCTUARY
 * @param actorData
 * @returns {Promise<void>}
 */
export async function sanctuary(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Sanctuary"}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Sanctuary"
        });
    });
}

/**
 * SPEAK WITH DEAD
 * @param actorData
 * @returns {Promise<void>}
 */
export async function speakWithDead(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Speak With Dead"}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Speak With Dead"
        });
    });
}