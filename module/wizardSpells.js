import * as sh from './spellHelper.js'

/**
 *
 * @param actorData
 * @param spellName
 * @param post
 * @returns {Promise<void>}
 */
export async function wizardSpell({actorData: actorData, spellName: spellName, post: post}) {
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

        return sh.castSpell(({actorData: actorData, dialogFlavor: flavor, options: options, title: spellName, post: post}));
    } else {
        ui.notifications.warn("Please select a token.");
    }
}

export async function invisibility(actorData) {

    let invFlag = {
        spell: "invisibility",
        cancel: function () {
            let token = canvas.tokens.controlled[0];
            token.update({"hidden": false});
        }
    };

    wizardSpell({actorData: actorData, spellName: "Invisibility", post: () => {
            let token = canvas.tokens.controlled[0];
            token.update({"hidden": true});

            let as = actorData.getFlag("world", "activeSpells");
            if (as) {
                if (!as.find(x => x.spell === 'invisibility')) {
                    as.push(invFlag);
                }
            } else {
                as = [invFlag];
            }
            actorData.setFlag("world", "activeSpells", as);
            console.log(actorData);
        }
    });
}