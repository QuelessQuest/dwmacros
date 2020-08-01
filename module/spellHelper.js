import SpellCastingDialog from "./objects/spell-casting-dialog.js";
import * as util from './dwUtils.js'

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
                                    dialogOptions = {}
                                }) {

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
    if (sustained) {
        sus = sustained.reduce(function (a, b) {
            return a + b;
        }, 0);
    }
    if (sus) {
        formula += `-${sus}`;
    }
    if (ongoing) {
        formula += `+${ongoing}`;
    } else {
        ongoing = 0;
    }
    if (mod && mod !== 0) {
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
        sustained: sus ? `-${sus}` : 0,
        rollDw: await cRoll.render(),
        style: ""
    }
    let chatData = {
        speaker: speaker,
    }

    return game.dice3d.showForRoll(cRoll).then(displayed => {
        if (cRoll.total >= 10) {
            templateData.details = "Successful Casting";
            templateData.style = "background: rgba(0, 255, 0, 0.1)";
            return renderTemplate(template, templateData).then(content => {
                chatData.content = content;
                ChatMessage.create(chatData);
                return true;
            });

        } else if (cRoll.total <= 6) {
            templateData.details = "Failed Casting";
            templateData.style = "background: rgba(255, 0, 0, 0.1)";
            return renderTemplate(template, templateData).then(content => {
                chatData.content = content;
                ChatMessage.create(chatData);
                return false;
            });
        } else {
            let opt1 = options.shift();
            let opt2 = options.shift();
            let opt3 = options.shift();
            templateData.style = "background: rgba(255, 255, 0, 0.1)";
            return new Promise(resolve => {
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

            }).then(() => {
                return true;
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


    // spell = spellName,targetName
    // Remove from active list
    let info = spell.split(',');
    await removeActiveSpell(actorData, {spell: info[0], targetName: info[1]});
}

/**
 * SET SUSTAINED
 * Sets a penalty that will be applied to all other casting rolls made by this actor
 * @param actorData
 * @param data
 * @returns {Promise<void>}
 */
export async function setSustained(actorData, data) {
    await setSpellFlag(actorData, "sustained", data)
}

/**
 * REMOVE SPELL FLAG
 * @param actorData
 * @param flag
 * @param spell
 * @param targetName
 * @returns {Promise<{data: null, actorData: *}>}
 */
async function removeSpellFlag(actorData, flag, {spell = "", targetName = ""}) {
    let flagItem = actorData.getFlag("world", flag);
    let filtered = [];
    let theItem = null;

    flagItem.forEach(item => {
        console.log(item);
        if (item.spell === spell) {
            if (item.data.targetName === targetName) {
                theItem = item;
            } else {
                filtered.push(item);
            }
        } else {
            filtered.push(item);
        }
    });

    await actorData.setFlag("world", flag, filtered);
    return {actorData: actorData, data: theItem};
}

/**
 * REMOVE SUSTAINED
 * @param actorData
 * @param spell
 * @param targetName
 * @returns {Promise<void>}
 */
export async function removeSustained(actorData, {spell = "", targetName = ""}) {
    await removeSpellFlag(actorData, "sustained", {spell: spell, targetName: targetName});
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
    await actorData.setFlag("world", "ongoing", ongoing);
}

/**
 * REMOVE ONGOING
 * @param actorData
 * @param spell
 * @param targetName
 * @returns {Promise<void>}
 */
export async function removeOngoing(actorData, {spell = "", targetName = ""}) {
    await removeSpellFlag(actorData, "ongoing", {spell: spell, targetName: targetName});
}

/**
 * SET ACTIVE SPELL
 * Adds the spell to the list of currently active spells. This list is used when a spell is to be canceled.
 * @param actorData
 * @param data
 * @returns {Promise<void>}
 */
export async function setActiveSpell(actorData, data) {
    await setSpellFlag(actorData, "activeSpells", data);
}

/**
 * REMOVE ACTIVE SPELL
 * @param actorData
 * @param data
 * @returns {Promise<void>}
 */
export async function removeActiveSpell(actorData, {spell = "", targetName = ""}) {
    let stuff = await removeSpellFlag(actorData, "activeSpells", {spell: spell, targetName: targetName});

    let targetActor = null;
    let data = stuff.data.data;

    if (data.targetId) {
        targetActor = game.actors.find(a => a._id === data.targetId);
    }
    if (data.sustained) {
        await removeSustained(actorData, {spell: spell, targetName: data.targetName});
    }
    if (data.forward) {
        await removeForward(targetActor, spell);
    }

    if (data.filter) {
        let xx = canvas.tokens.placeables.filter(placeable => placeable.id === data.targetToken);
        let targetToken = xx[0];
        await TokenMagic.deleteFilters(targetToken);
    }

    if (data.damage) {
        let dmgMisc = actorData.data.data.attributes.damage.misc;
        let newMisc;
        if (dmgMisc === "1d4") {
            newMisc = "";
        } else {
            let idx = dmgMisc.indexOf("+1d4");
            newMisc = dmgMisc.substring(0, idx);
            if (idx + 4 < dmgMisc.length) {
                newMisc += dmgMisc.substring(idx + 4);
            }
        }

        await actorData.update({"data": {"attributes": {"damage": {"misc": newMisc}}}});
    }

    if (data.updateData) {
        switch(data.updateType) {
            case "Token":
                let xx = canvas.tokens.placeables.filter(placeable => placeable.id === data.targetToken);
                let targetToken = xx[0];
                await targetToken.update(data.updateData);
                break;
            case "Actor":
                break;
        }
    }

    await util.coloredChat({
        actorData: actorData,
        target: targetActor,
        startingWords: data.startingWords,
        middleWords: data.middleWords,
        endWords: data.endWords
    });
}

/**
 * SET SPELL FLAG
 * @param actorData
 * @param flag
 * @param data
 * @returns {Promise<void>}
 */
async function setSpellFlag(actorData, flag, data) {
    let currentFlag = actorData.getFlag("world", flag);
    if (currentFlag) {
        currentFlag.push(data);
    } else {
        currentFlag = [data];
    }
    await actorData.setFlag("world", flag, currentFlag);
}

/**
 * SET FORWARD
 * Set the 'going forward' bonus for an actor
 * @param target
 * @param data
 * @returns {Promise<void>}
 */
export async function setForward(target, data) {
    await setSpellFlag(target, "forward", data);
}

/**
 * REMOVE FORWARD
 * @param target
 * @param spell
 * @returns {Promise<void>}
 */
export async function removeForward(target, spell) {
    let ff = target.getFlag("world", "forward");
    let fFiltered = ff.filter(f => f.type !== spell);
    await target.setFlag("world", "forward", fFiltered);
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
    let pLevels = 0;
    let pSpells = [];
    let upSpells = [];
    for (let idx = 0; idx < p.length; idx++) {
        if (p[idx].checked) {
            pSpells.push(p[idx].name);
            pLevels += parseInt(p[idx].value);
        } else {
            upSpells.push(p[idx].name);
        }

    }
    if (pLevels > lvlTotal) {
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
        await actorData.setFlag("world", "ongoing", null);
        await util.coloredChat({
            actorData: actorData,
            middleWords: "has finished preparing spells",
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