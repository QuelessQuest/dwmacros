import * as sh from './spellHelper.js'
import * as util from './dwUtils.js'

/**
 * ClericSpell
 * Used to cast all Cleric Spells. Provides the Success with Consequences dialog if necessary
 * @param actorData
 * @param spellName
 * @param target
 * @param post
 * @returns {Promise<*>}
 */
export async function clericSpell({actorData: actorData, spellName: spellName, target: target = false, post: post, fail: fail}) {
    if (actorData) {
        if (target) {
            if (game.user.targets.size === 0) {
                ui.notifications.warn("Spell requires a target.");
                return;
            }
        }
        let flavor = "Your casting succeeds, however you must select one of the following options.";
        let options = [
            {
                icon: `<i class="fas fa-eye"></i>`,
                label: "You draw unwelcome attention or put yourself in a spot",
                detail: `Conditional Casting.<br>${actorData.name} draws unwelcome attention or is put in a spot`
            },
            {
                icon: `<i class="fas fa-angry"></i>`,
                label: "Your casting distances you from your deity",
                detail: `Conditional Casting.<br>${actorData.name} distances themselves from their deity`
            },
            {
                icon: `<i class="fas fa-ban"></i>`,
                label: "After you cast it, the spell is revoked by your deity",
                detail: `Conditional Casting.<br>${actorData.name} has the spell revoked by their deity`
            }
        ];

        return sh.castSpell(({actorData: actorData, dialogFlavor: flavor, options: options, title: spellName, post: post, fail: fail}));
    } else {
        ui.notifications.warn("Please select a token.");
    }
}

// ROTES =======================================================================================

export async function guidance(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Guidance"}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Guidance", post: () => {

            }
        });
    });
}

export async function sanctify(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Sanctify"}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Sanctify", post: () => {

            }
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
    sh.validateSpell({actorData: actorData, spell: "Bless"}).then(v => {
        if (!v) return;

        let bGlow = [
            {
                filterType: "zapshadow",
                alphaTolerance: 0.60
            },
            {
                filterType: "outline",
                padding: 10,
                color: 0xACC1C6,
                thickness: 1,
                quality: 10,
                animated:
                    {
                        thickness:
                            {
                                active: true,
                                loopDuration: 10000,
                                animType: "syncCosOscillation",
                                val1: 2,
                                val2: 6
                            }
                    }
            }];
        let targetActor;
        let targetToken;
        if (game.user.targets.size > 0) {
            targetActor = game.user.targets.values().next().value.actor;
            targetToken = canvas.tokens.placeables.filter(placeable => placeable.isTargeted)[0];
        } else {
            targetActor = actorData;
            targetToken = canvas.tokens.controlled[0];
        }

        TokenMagic.addFilters(targetToken, bGlow);

        let blessFlag = {
            spell: "bless",
            cancel: async function (actorData) {
                // Remove penalty for sustaining the spell
                let sus = actorData.getFlag("world", "sustained");
                let filtered = sus.filter(e => e.name !== "bless");
                actorData.setFlag("world", "sustained", filtered);

                // Remove bonus from target
                let ff = targetActor.getFlag("world", "forward");
                let fFiltered = ff.filter(f => f.type !== "bless");
                targetActor.setFlag("world", "forward", fFiltered);

                // Cancel the animated effect
                TokenMagic.deleteFilters(targetToken);

                util.coloredChat({
                    actorData: actorData,
                    target: targetActor,
                    middleWords: "has canceled the Bless on"
                });
            }
        };

        clericSpell({
            actorData: actorData, spellName: "Bless", post: () => {
                sh.setActiveSpell(actorData, "bless", blessFlag);
                sh.setSustained(actorData, "bless", 1);
                sh.setForward(targetActor, "bless", 1);

                util.coloredChat({
                    actorData: actorData,
                    target: targetActor,
                    middleWords: "has Blessed"
                });
            },
            fail: () => {
                TokenMagic.deleteFilters(targetToken);
            }
        });
    });
}

/**
 * CURE LIGHT WOUNDS
 * @param actorData
 * @returns {Promise<void>}
 */
export async function cureLightWounds(actorData) {

    sh.validateSpell({actorData: actorData, spell: "Cure Light Wounds", target: true}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Cure Light Wounds", target: true, post: () => {
                let template = "modules/dwmacros/templates/chat/spell-dialog.html";
                let glow =
                    [{
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

                let roll = new Roll("1d8", {});
                roll.roll();
                TokenMagic.addFiltersOnTargeted(glow);
                roll.render().then(r => {
                    let templateData = {
                        title: "title",
                        flavor: "flavor",
                        rollDw: r,
                        style: ""
                    }
                    renderTemplate(template, templateData).then(content => {
                        game.dice3d.showForRoll(roll).then(displayed => {
                            let targetActor = game.user.targets.values().next().value.actor;
                            let maxHeal = Math.clamped(roll.result, 0,
                                targetActor.data.data.attributes.hp.max - targetActor.data.data.attributes.hp.value);

                            if (targetActor.permission !== CONST.ENTITY_PERMISSIONS.OWNER)
                                // We need help applying the healing, so make a roll message for right-click convenience.
                                roll.toMessage({
                                    speaker: ChatMessage.getSpeaker(),
                                    flavor: `${actorData.name} casts Cure Light Wounds on ${targetActor.data.name}.<br>
                            <p><em>Manually apply ${maxHeal} HP of healing to ${targetActor.data.name}</em></p>`
                                });
                            else {
                                // We can apply healing automatically, so just show a normal chat message.
                                util.coloredChat({
                                    actorData: actorData,
                                    target: targetActor,
                                    middleWords: "casts Cure Light Wounds on",
                                    endWords: `for ${maxHeal} HP`
                                });
                                game.actors.find(a => a._id === targetActor._id).update({
                                    "data.attributes.hp.value": targetActor.data.data.attributes.hp.value + maxHeal
                                });
                            }
                        });
                    });
                })
            }
        });
    });
}

export async function causeFear(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Cause Fear"}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Cause Fear", post: () => {

            }
        });
    });
}

export async function detectAlignment(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Detect Alignment"}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Detect Alignment", post: () => {

            }
        });
    });
}

export async function magicWeapon(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Magic Weapon"}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Magic Weapon", post: () => {

            }
        });
    });
}

export async function sanctuary(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Sanctuary"}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Sanctuary", post: () => {

            }
        });
    });
}

export async function speakWithDead(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Speak With Dead"}).then(v => {
        if (!v) return;

        clericSpell({
            actorData: actorData, spellName: "Speak With Dead", post: () => {

            }
        });
    });
}
