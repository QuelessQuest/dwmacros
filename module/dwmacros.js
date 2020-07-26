import * as sh from './spellHelper.js'
import * as cs from './clericSpells.js'
import * as ws from './wizardSpells.js'
import * as cmn from './commonSpells.js'
import * as dm from './druidMoves.js'

export function DWMacros() {

    async function castClericLight(actorData) {
        return cmn.light(actorData, cs.clericSpell);
    }

    async function castWizardLight(actorData) {
        return cmn.light(actorData, ws.wizardSpell);
    }

    async function castBless(actorData) {
        return cs.bless(actorData);
    }
    async function castCureLightWounds(actorData) {
        return cs.cureLightWounds(actorData);
    }

    async function castMagicMissile(actorDaa) {
        return ws.magicMissile(actorDaa);
    }
    async function castInvisibility(actorData) {
        return ws.invisibility(actorData);
    }
    async function cancelSpell(actorData) {
        return sh.dropSpell(actorData);
    }
    async function prepareSpells(actorData) {
        sh.setSpells(actorData);
    }

    async function druidShapshift(actorData) {
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
        castBless: castBless,
        castCureLightWounds: castCureLightWounds,
        castInvisibility: castInvisibility,
        druidShapshift: druidShapshift,
        castMagicMissile: castMagicMissile,
        prepareSpells: prepareSpells,
        showToken: showToken,
        showActor: showActor
    }
}

export const DWM = DWMacros();

Hooks.on("ready", () => {
    console.log("DW Hook -> ready");
    window.DWMacros = DWM;
});