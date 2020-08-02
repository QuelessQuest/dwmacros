import * as sh from './spellHelper.js'
import * as cs from './clericSpells.js'
import * as ws from './wizardSpells.js'
import * as cmn from './commonSpells.js'
import * as dm from './druidMoves.js'
import * as util from './dwUtils.js'
import * as basic from './basicMoves.js'

export function DWMacros() {

    async function castClericLight(actorData) {
        return cmn.light(actorData, cs.clericSpell);
    }

    async function castWizardLight(actorData) {
        return cmn.light(actorData, ws.wizardSpell);
    }

    /**
     * CLERIC SPELLS ========================================
     */
    async function castGuidance(actorData) {
        return cs.guidance(actorData);
    }

    async function castSanctify(actorData) {
        return cs.sanctify(actorData);
    }

    async function castBless(actorData) {
        return cs.bless(actorData);
    }

    async function castCauseFear(actorData) {
        return cs.causeFear(actorData);
    }

    async function castCureLightWounds(actorData) {
        return cs.cureLightWounds(actorData);
    }

    async function castDetectAlignment(actorData) {
        return cs.detectAlignment(actorData);
    }

    async function castMagicWeapon(actorData) {
        return cs.magicWeapon(actorData);
    }

    async function castSanctuary(actorData) {
        return cs.sanctuary(actorData);
    }

    async function castSpeakWithDead(actorData) {
        return cs.speakWithDead(actorData);
    }


    /**
     * WIZARD SPELLS ========================================
     */

    async function castAlarm(actorData) {
        return ws.alarm(actorData);
    }
    async function castCharmPerson(actorData) {
        return ws.charmPerson(actorData);
    }

    async function castContactSpirits(actorDaa) {
        return ws.contactSpirits(actorDaa);
    }

    async function castDetectMagic(actorDaa) {
        return ws.detectMagic(actorDaa);
    }

    async function castMagicMissile(actorDaa) {
        return ws.magicMissile(actorDaa);
    }

    async function castInvisibility(actorData) {
        return ws.invisibility(actorData);
    }

    async function castPrestidigitation(actorData) {
        return ws.prestidigitation(actorData);
    }

    async function castTelepathy(actorData) {
        return ws.telepathy(actorData);
    }

    async function castUnseenServant(actorData) {
        return ws.unseenServant(actorData);
    }

    /**
     * HELPERS ========================================
     */
    async function cancelSpell(actorData) {
        return sh.dropSpell(actorData);
    }

    async function prepareSpells(actorData) {
        return sh.setSpells(actorData);
    }

    async function gcolors(actorData) {
        return util.getColors(actorData, game.user.targets.values().next().value.actor);
    }

    /**
     * BASIC MOVES ========================================
     */

    async function doHackAndSlash(actorData) {
        return basic.hackAndSlash(actorData);
    }

    /**
     * CLASS MOVES ========================================
     */
    async function druidShapeshift(actorData) {
        return dm.shapeshift(actorData);
    }


    async function showActor(actorData) {
        console.log(actorData);
    }

    async function showToken() {
        console.log(canvas.tokens.controlled[0]);
    }

    return {
        cancelSpell: cancelSpell,
        castClericLight: castClericLight,
        castWizardLight: castWizardLight,
        castGuidance: castGuidance,
        castSanctify: castSanctify,
        castBless: castBless,
        castCauseFear: castCauseFear,
        castCureLightWounds: castCureLightWounds,
        castDetectAlignment: castDetectAlignment,
        castMagicWeapon: castMagicWeapon,
        castSanctuary: castSanctuary,
        castSpeakWithDead: castSpeakWithDead,
        castPrestidigitation: castPrestidigitation,
        castUnseenServant: castUnseenServant,
        castContactSpirits: castContactSpirits,
        castDetectMagic: castDetectMagic,
        castCharmPerson: castCharmPerson,
        castTelepathy: castTelepathy,
        castInvisibility: castInvisibility,
        castAlarm: castAlarm,
        doHackAndSlash: doHackAndSlash,
        druidShapeshift: druidShapeshift,
        castMagicMissile: castMagicMissile,
        prepareSpells: prepareSpells,
        showToken: showToken,
        showActor: showActor,
        gcolors: gcolors
    }
}

export const DWM = DWMacros();

Hooks.on("ready", () => {
    console.log("DW Hook -> ready");
    window.DWMacros = DWM;
});