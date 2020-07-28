import SpellCastingDialog from "./objects/spell-casting-dialog.js";

/**
 * Cast Spell
 * The basic mechanics for casting a spell and showing the results
 * @param actorData
 * @param dialogFlavor
 * @param flavor
 * @param title
 * @param template
 * @param details
 * @param speaker
 * @param options
 * @param dialogOptions
 * @param post
 * @param fail
 * @returns {Promise<void>}
 */
export async function castSpell({
                                    actorData = {},
                                    dialogFlavor = null,
                                    flavor = null,
                                    title = null,
                                    template = null,
                                    details = {},
                                    speaker = null,
                                    options = [],
                                    dialogOptions = {},
                                    post = () => {
                                    },
                                    fail = () => {
                                    }
                                } = {}) {

    let baseFormula = '2d6';
    let castingData = actorData.items.find(i => i.name.toLowerCase() === "Cast A Spell".toLowerCase());
    let ability = castingData.data.data.rollType.toLowerCase();
    speaker = speaker || ChatMessage.getSpeaker();
    let mod = castingData.data.data.rollMod;
    let ongoing = actorData.getFlag("world", "ongoing");
    let abilityMod = actorData.data.data.abilities[ability].mod;
    let formula = `${baseFormula}+${abilityMod}`;
    let sustained = actorData.getFlag("world", "sustained");
    let sus = 0;
    for (let idx = 0; idx < sustained.length; idx++) {
        sus += sustained[idx].value;
    }
    if (sus) {
        formula += `-${sus}`;
    }
    if (ongoing) {
        formula += `+${ongoing}`;
    } else {
        ongoing = 0;
    }
    if (mod && mod != 0) {
        formula += `+${mod}`;
    }

    let cRoll = new Roll(`${formula}`);
    cRoll.roll();

    template = template || "modules/dwmacros/templates/chat/spell-dialog.html";
    let templateData = {
        title: title,
        flavor: flavor,
        ability: ability.charAt(0).toUpperCase() + ability.slice(1),
        mod: abilityMod,
        ongoing: ongoing,
        sustained: sus ? `-$sus` : 0,
        rollDw: await cRoll.render(),
        style: ""
    }
    let chatData = {
        speaker: speaker,
    }

    game.dice3d.showForRoll(cRoll).then(displayed => {
        if (cRoll.total >= 10) {
            templateData.details = "Successful Casting";
            templateData.style = "background: rgba(0, 255, 0, 0.1)";
            renderTemplate(template, templateData).then(content => {
                chatData.content = content;
                ChatMessage.create(chatData);
                post();
            });
        } else if (cRoll.total <= 6) {
            templateData.details = "Failed Casting";
            templateData.style = "background: rgba(255, 0, 0, 0.1)";
            renderTemplate(template, templateData).then(content => {
                chatData.content = content;
                ChatMessage.create(chatData);
                fail();
            });
        } else {
            let opt1 = options.shift();
            let opt2 = options.shift();
            let opt3 = options.shift();
            templateData.style = "background: rgba(255, 255, 0, 0.1)";
            let z = new Promise(resolve => {
                new SpellCastingDialog({
                    title: title,
                    content: dialogFlavor,
                    buttons: {
                        opt1: {
                            icon: opt1.icon,
                            label: opt1.label,
                            callback: () => {
                                templateData.details = opt1.detail;
                                renderTemplate(template, templateData).then(content => {
                                    chatData.content = content;
                                    ChatMessage.create(chatData);
                                    post();
                                });
                            }
                        },
                        opt2: {
                            icon: opt2.icon,
                            label: opt2.label,
                            callback: () => {
                                templateData.details = opt2.detail;
                                renderTemplate(template, templateData).then(content => {
                                    chatData.content = content;
                                    ChatMessage.create(chatData);
                                    post();
                                });
                                setOngoing(actorData, -1);
                            }
                        },
                        opt3: {
                            icon: opt3.icon,
                            label: opt3.label,
                            callback: () => {
                                templateData.details = opt3.detail;
                                renderTemplate(template, templateData).then(content => {
                                    chatData.content = content;
                                    ChatMessage.create(chatData);
                                    post();
                                });
                                let spell = actorData.data.items.find(i => i.name.toLowerCase() === title.toLowerCase());
                                let sId = spell._id;
                                const item = actorData.getOwnedItem(sId);
                                if (item) {
                                    let updatedItem = duplicate(item);
                                    updatedItem.data.prepared = true;
                                    actorData.updateOwnedItem(updatedItem);
                                }
                            }
                        }
                    },
                    close: resolve
                }, dialogOptions).render(true);
            });
        }
    });
}

/**
 * DROP SPELL
 * Will cancel the selected active spell according to the spells cancel function
 * @param actorData
 * @returns {Promise<void>}
 */
export async function dropSpell(actorData) {
    let activeSpells = actorData.getFlag("world", "activeSpells");
    let templateData = {
        activeSpells: activeSpells
    }
    const content = await renderTemplate("modules/dwmacros/templates/cancelSpell.html", templateData);
    let spell = await new Promise((resolve, reject) => {
        new Dialog({
            title: "Cancel An Active Spell",
            content: content,
            default: 'ok',
            buttons: {
                use: {
                    icon: '<i class="fas fa-ban"></i>',
                    label: "Cancel Spell",
                    callback: html => {
                        resolve(
                            html.find('.dw-cancel-spell.dialog [name="activeSpells"]')[0].value);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Abort Cancel",
                }
            }
        }).render(true);
    });

    // Remove from active list
    let as = activeSpells.find(x => x.spell === spell);
    let filtered = activeSpells.filter(e => e.spell !== spell);
    await actorData.setFlag("world", "activeSpells", filtered);

    // Call spells cancel function for the target
    let tokens = canvas.tokens.objects.children;
    let targetToken = tokens.find(c => c.actor.id === as.target);
    let targetActor = targetToken.actor;
    as.cancel(actorData, targetActor);
}

/**
 * SET SUSTAINED
 * Sets a penalty that will be applied to all other casting rolls made by this actor
 * @param actorData
 * @param spell
 * @param value
 * @returns {Promise<void>}
 */
export async function setSustained(actorData, spell, value) {
    let sus = actorData.getFlag("world", "sustained");
    let susFlagItem = {
        name: spell,
        value: value
    };
    if (sus) {
        let f = sus.find(x => x.spell === spell);
        if (!f) {
            sus.push(susFlagItem);
        } else {
            susFlagItem.value += f.value;
            let newSus = sus.filter(x=> x.spell !== spell);
            newSus.push(susFlagItem);
            sus = newSus;
        }
    } else {
        sus = [susFlagItem];
    }
    actorData.setFlag("world", "sustained", sus);
}

/**
 * SET ONGOING
 * Set an ongoing casting penalty that won't go away until spells are prepared again.
 * @param actorData
 * @param value
 * @returns {Promise<void>}
 */
export async function setOngoing(actorData, value) {
    let ongoing = actorData.getFlag("world", "ongoing");
    if (ongoing) {
        ongoing += value;
    } else {
        ongoing = value;
    }
    actorData.setFlag("world", "ongoing", ongoing);
}

/**&
 * SET ACTIVE SPELL
 * Adds the spell to the list of currently active spells. This list is used when a spell is to be canceled.
 * @param actorData
 * @param spell
 * @param data
 * @returns {Promise<void>}
 */
export async function setActiveSpell(actorData, spell, data) {
    let as = actorData.getFlag("world", "activeSpells");
    if (as) {
        if (!as.find(x => x.spell === spell)) {
            as.push(data);
        }
    } else {
        as = [data];
    }
    actorData.setFlag("world", "activeSpells", as);
}

/**
 * SET FORWARD
 * Set the 'going forward' bonus for an actor
 * @param target
 * @param type
 * @param value
 * @returns {Promise<void>}
 */
export async function setForward(target, type, value) {
    let flag = target.getFlag("world", "forward");
    let flagData = {
        type: type,
        value: value
    };
    if (flag) {
       flag.push(flagData)
    } else {
        flag = [flagData];
    }
    await target.setFlag("world", "forward", flag);
}

/**
 * VALIDATE SPELL
 * Checks: Is the spell known? Is the spell prepared? Are they barred from any casting?
 * @param actorData
 * @param spell
 * @param target
 * @returns {Promise<boolean>}
 */
export async function validateSpell({actorData: actorData, spell: spell, target: target}) {
    let hasSpell = actorData.items.find(i => i.name.toLowerCase() === spell.toLowerCase());
    if (hasSpell === null) {
        ui.notifications.warn(`${actorData.name} does not know how to cast ${spell}`);
        return false;
    }
    if (hasSpell.data.data.prepared) {
        if (target) {
            if (game.user.targets.size === 0) {
                ui.notifications.warn("Spell requires a target.");
                return false;
            }
        }
        let message = await barredFromCasting(actorData);
        if (message === "ok") {
            return true;
        } else {
            ui.notifications.warn(message);
            return false;
        }
    } else {
        ui.notifications.warn(`${actorData.name} does not have ${spell} prepared`);
        return false;
    }
}

/**
 * BARRED FROM CASTING
 * Determines if any spells can be cast (e.g. if invisibility is currently active)
 * @param actorData
 * @returns {Promise<string>}
 */
async function barredFromCasting(actorData) {
    let as = actorData.getFlag("world", "activeSpells");
    if (as) {
        if (as.find(x => x.spell === "invisibility")) {
            return "Cannot cast a spell while Invisibility is being maintained";
        }
    }
    return "ok";
}

/**
 * SET SPELLS
 * Provides a dialog that allows for selecting prepared spells.
 * @param actorData
 * @returns {Promise<void>}
 */
export async function setSpells(actorData) {

    let spellItems = actorData.items.filter(i => i.type === "spell");
    let lvlTotal = parseInt(actorData.data.data.attributes.level.value) + 1;
    let idx = 0;
    let templateData = {
        rotes: [],
        spellData: []
    };
    for (idx = 0; idx < 10; idx++) {
        let spells = spellItems.filter(l => l.data.data.spellLevel === idx).map(n => n.name)
        if (idx === 0) {
            templateData.rotes = spells;
        } else if (spells.length > 0) {
            templateData.spellData.push({lvl: idx, spells: spells});
        }
    }

    const content = await renderTemplate("modules/dwmacros/templates/prepareSpells.html", templateData);
    let p = await new Promise(resolve => {
        new Dialog({
            title: "Prepare Spells",
            content: content,
            buttons: {
                prepare: {
                    icon: `<i class="fas fa-scroll"></i>`,
                    label: "Prepare",
                    callback: html => {
                        resolve(
                            html.find('input'));
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: resolve
                },
            },
            close: resolve
        }).render(true);
    });
    let pLvls = 0;
    let pSpells = [];
    let upSpells = [];
    for (let idx = 0; idx < p.length; idx++) {
        if (p[idx].checked) {
            pSpells.push(p[idx].name);
            pLvls += parseInt(p[idx].value);
        } else {
            upSpells.push(p[idx].name);
        }

    }
    if (pLvls > lvlTotal) {
        ui.notifications.warn(`${actorData.name} can only prepare ${lvlTotal} levels of spells`);
    } else {
        pSpells.forEach(ps => {
            let spell = actorData.data.items.find(i => i.name === ps);
            let sId = spell._id;
            const item = actorData.getOwnedItem(sId);
            if (item) {
                let updatedItem = duplicate(item);
                updatedItem.data.prepared = true;
                actorData.updateOwnedItem(updatedItem);
            }
        });
        upSpells.forEach(ups => {
            let spell = actorData.data.items.find(i => i.name === ups);
            let sId = spell._id;
            const item = actorData.getOwnedItem(sId);
            if (item) {
                let updatedItem = duplicate(item);
                updatedItem.data.prepared = false;
                actorData.updateOwnedItem(updatedItem);
            }
        });
        actorData.setFlag("world", "ongoing", null);
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker(),
            content: `${actorData.name} has finished preparing spells.<br>`
        });
    }
}

/**
 * LAUNCH PROJECTILE
 * Provides an animation of the provided image from the caster to the target.
 * @param sourceToken
 * @param targetToken
 * @param img
 * @returns {Promise<void>}
 */
export async function launchProjectile(sourceToken, targetToken, img) {
    let projectile = await Token.create({
        name: "pp",
        img: img,
        scale: 0.5,
        x: sourceToken.x,
        y: sourceToken.y,
        elevation: 0,
        lockRotation: false,
        rotation: 0,
        effects: [],
        vision: false
    });
    await projectile.setPosition(sourceToken.x, sourceToken.y, {animate: false});
    await projectile.setPosition(targetToken.x, targetToken.y);
    projectile.delete();
}