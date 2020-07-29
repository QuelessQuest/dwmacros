import * as sh from './spellHelper.js'
import * as util from './dwUtils.js'

/**
 * WizardSpell
 * Used to cast all Wizard Spells. Provides the Success with Consequences dialog if necessary
 * @param actorData
 * @param spellName
 * @param target
 * @param post
 * @returns {Promise<void>}
 */
export async function wizardSpell({actorData: actorData, spellName: spellName, target: target = false}) {
    if (actorData) {
        let flavor = "Your casting succeeds, however you must select one of the following options.";
        let options = [
            {
                icon: `<i class="fas fa-eye"></i>`,
                label: "You draw unwelcome attention or put yourself in a spot",
                detail: `Conditional Casting.<br>${actorData.name} draws unwelcome attention or is put in a spot`
            },
            {
                icon: `<i class="fas fa-bong"></i>`,
                label: "The spell disturbs the fabric of reality as it is cast",
                detail: `Conditional Casting.<br>${actorData.name} disturbs the fabric of reality`
            },
            {
                icon: `<i class="fas fa-ban"></i>`,
                label: "After it is cast, the spell is forgotten",
                detail: `Conditional Casting.<br>${actorData.name} has forgotten the spell`
            }
        ];

        return sh.castSpell(({actorData: actorData, dialogFlavor: flavor, options: options, title: spellName}));
    } else {
        ui.notifications.warn("Please select a token.");
    }
}

// CANTRIPS =======================================================================================

export async function prestidigitation(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Prestidigitation"}).then(v => {
        if (!v) return;

        wizardSpell({
            actorData: actorData, spellName: "Prestidigitation"
        });
    });
}

export async function unseenServant(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Unseen Servant"}).then(v => {
        if (!v) return;

        wizardSpell({
            actorData: actorData, spellName: "Unseen Servant"
        });
    });
}

// FIRST LEVEL =======================================================================================

export async function alarm(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Alarm"}).then(v => {
        if (!v) return;

        wizardSpell({
            actorData: actorData, spellName: "Alarm"
        });
    });
}

export async function charmPerson(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Charm Person"}).then(v => {
        if (!v) return;

        wizardSpell({
            actorData: actorData, spellName: "Charm Person"
        });
    });
}

export async function contactSpirits(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Contact Spirits"}).then(v => {
        if (!v) return;

        wizardSpell({
            actorData: actorData, spellName: "Contact Spirits"
        });
    });
}

export async function detectMagic(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Detect Magic"}).then(v => {
        if (!v) return;

        wizardSpell({
            actorData: actorData, spellName: "Detect Magic"
        });
    });
}

export async function telepathy(actorData) {
    sh.validateSpell({actorData: actorData, spell: "Telepathy"}).then(v => {
        if (!v) return;

        wizardSpell({
            actorData: actorData, spellName: "Telepathy"
        });
    });
}

/**
 * INVISIBILITY
 * @param actorData
 * @returns {Promise<void>}
 */
export async function invisibility(actorData) {

    sh.validateSpell({actorData: actorData, spell: "Invisibility"}).then(v => {
        if (!v) return;

        wizardSpell({
            actorData: actorData, spellName: "Invisibility"
        }).then(r => {
            let targetData = util.getTargets(actorData);
            if (!r) {
                TokenMagic.deleteFilters(targetData.targetToken);
                return;
            }

            let params =
                [{
                    filterType: "distortion",
                    maskPath: "/modules/tokenmagic/fx/assets/waves-2.png",
                    maskSpriteScaleX: 7,
                    maskSpriteScaleY: 7,
                    padding: 50,
                    animated:
                        {
                            maskSpriteX: {active: true, speed: 0.05, animType: "move"},
                            maskSpriteY: {active: true, speed: 0.07, animType: "move"}
                        }
                },
                    {
                        filterType: "glow",
                        distance: 10,
                        outerStrength: 8,
                        innerStrength: 0,
                        color: 0xD6E6C3,
                        quality: 0.5,
                        animated:
                            {
                                color:
                                    {
                                        active: true,
                                        loopDuration: 3000,
                                        animType: "colorOscillation",
                                        val1: 0xD6E6C3,
                                        val2: 0xCDCFB7
                                    }
                            }
                    }
                ];

            TokenMagic.addFilters(targetData.targetToken, params);

            let invFlag = {
                spell: "invisibility",
                targetName: targetData.targetActor.name,
                data: {
                    tokenId: targetData.targetToken.id
                },
                endSpell: function (actorData) {
                    let targetData = util.getTargets(actorData);
                    targetData.targetToken.update({"hidden": false});
                }
            };

            targetData.targetToken.update({"hidden": true});
            sh.setActiveSpell(actorData, invFlag);
            TokenMagic.deleteFilters(targetData.targetToken);
        })
    });
}

/**
 * MAGIC MISSILE
 * @param actorData
 * @returns {Promise<void>}
 */
export async function magicMissile(actorData) {

    sh.validateSpell({actorData: actorData, spell: "Magic Missile", target: true}).then(v => {
        if (!v) return;

        wizardSpell({
            actorData: actorData, spellName: "Magic Missile", target: true,
        }).then(r => {
            if (!r) return;

            let token = canvas.tokens.controlled[0]
            let template = "modules/dwmacros/templates/chat/spell-dialog.html";
            let missile = [{
                filterType: "electric",
                color: 0xFFFFFF,
                time: 0,
                blend: 1,
                intensity: 5,
                autoDestroy: true,
                animated: {
                    time: {
                        active: true,
                        speed: 0.0020,
                        loopDuration: 1500,
                        loops: 1,
                        animType: "move"
                    }
                }
            }];

            let roll = new Roll("2d4", {});
            roll.roll();
            roll.render().then(r => {
                let templateData = {
                    title: "title",
                    flavor: "flavor",
                    rollDw: r,
                    style: ""
                }
                renderTemplate(template, templateData).then(content => {
                    game.dice3d.showForRoll(roll).then(displayed => {
                        let targetToken = game.user.targets.values().next().value;
                        let targetActor = targetToken.actor;
                        sh.launchProjectile(token, targetToken, "modules/dwmacros/assets/mm.png").then(() => {
                            TokenMagic.addFiltersOnTargeted(missile);
                            if (targetActor.permission !== CONST.ENTITY_PERMISSIONS.OWNER)
                                // We need help applying the damagee, so make a roll message for right-click convenience.
                                roll.toMessage({
                                    speaker: ChatMessage.getSpeaker(),
                                    flavor: `${actorData.name} casts Magic Missle on ${targetActor.data.name}.<br>
                                                 <p><em>Manually apply ${roll.total} HP of damage to ${targetActor.data.name}</em></p>`
                                });
                            else {
                                // We can apply damage automatically, so just show a normal chat message.
                                util.coloredChat({
                                    actorData: actorData,
                                    middleWords: "casts Magic Missile on",
                                    target: targetActor,
                                    endWords: `for ${roll.total} HP`
                                });
                                game.actors.find(a => a._id === targetActor._id).update({
                                    "data.attributes.hp.value": targetActor.data.data.attributes.hp.value - roll.total
                                });
                            }
                        });
                    });
                });
            });
        });
    });
}