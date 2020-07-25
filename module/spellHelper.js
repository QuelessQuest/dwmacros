import SpellCastingDialog from "./objects/spell-casting-dialog.js";

/**
 * Cast Spell
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
    let formula = `${baseFormula}+${actorData.data.data.abilities[ability].mod}`;
    if (mod && mod != 0) {
        formula += `+${mod}`;
    }

    let cRoll = new Roll(`${formula}`);
    cRoll.roll();

    template = template || "modules/dwmacros/templates/chat/spell-dialog.html";
    let templateData = {
        title: title,
        flavor: flavor,
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
                                let spellItem = actorData.items.find(i => i.name.toLowerCase() === title.toLowerCase());
                                spellItem.data.data.prepared = false;
                            }
                        }
                    },
                    close: resolve
                }, dialogOptions).render(true);
            });
        }
    });
}

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
    let tt = tokens.find(c => c.uuid === as.target);
    as.cancel(tt);
}

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
        return true;
    } else {
        ui.notifications.warn(`${actorData.name} does not have ${spell} prepared`);
        return false;
    }
}

export async function setSpells(actorData) {
    let spellItems = actorData.items.filter(i => i.type === "spell");
    let spells = [];
    let idx = 0;
    for (idx = 0; idx < 10; idx++) {
        spells.push(spellItems.filter(l => l.data.data.spellLevel === idx).map(n => n.name));
    }
    console.log(spells);
}

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