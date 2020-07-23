import * as sh from './spellHelper.js'

/**
 * ClericSpell
 * @param actorData
 * @param spellName
 * @param post
 * @returns {Promise<*>}
 */
export async function clericSpell({actorData: actorData, spellName: spellName, post: post}) {
    if (actorData) {
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

        return sh.castSpell(({actorData: actorData, dialogFlavor: flavor, options: options, title: spellName, post: post}));
    } else {
        ui.notifications.warn("Please select a token.");
    }
}

// FIRST LEVEL =======================================================================================

/**
 * CURE LIGHT WOUNDS
 * @param actorData
 * @returns {Promise<void>}
 */
export async function cureLightWounds(actorData) {
    clericSpell({
        actorData: actorData, spellName: "Cure Light Wounds", post: () => {
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
                            ChatMessage.create({
                                speaker: ChatMessage.getSpeaker(),
                                content: `${actorData.name} casts Cure Light Wounds on ${targetActor.data.name} for ${maxHeal} HP.<br>`
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
}