export class TreasureMapGen {

    /**
     * @param {String} hoardName
     * @param {*} hoardConfiguration Object describing the content of the generated treasure hoard; contains one or many of the following fields, accompanied by a Roll formula for the quantity
     *
     * Possible generated Items (taken from OSE's Referee tools):
     *   - "gems"
     *   - "jewellery"
     *
     * Expected format for the description Object
     *
     * {
     *   gems: "3d6",
     *   [jewellery: "1d4+5",]
     *   [...]
     * }
     */
    static generateTreasureHoard(hoardName, hoardConfiguration) {
        const allItems = TreasureMapInternal._generateTreasureHoardData(hoardConfiguration).flat();

        Promise.all(allItems)
            .then(responses => {
                const items = responses.flat();
                TreasureMapInternal._createTreasureHoard(hoardName, items).then(() => {
                    ui.notifications.info(`Treasure hoard created for "${hoardName}"`)
                })
            })
            .catch((reason) => {
                ui.notifications.error(reason);
            });
    }
}

class TreasureMapInternal {

    /**
     * @param {*} hoardConfiguration: Object describing the content of the generated treasure hoard; contains one or many of the following fields, accompanied by a Roll formula for the quantity
     *
     * Possible generated Items (taken from OSE's Referee tools):
     *   - "gems"
     *   - "jewellery"
     */
    static _generateTreasureHoardData(hoardConfiguration) {
        const invalidFormulaError = (formula) => `"${formula}" is not a valid formula for item quantity in the Treasure hoard generator.`
        const unsupportedItemTypeError = (key) => `"${key}" is not supported in the Treasure hoard generator yet.`;

        const pileContent = Object.entries(hoardConfiguration).map((prop) => {
            const [key, value] = prop;
            switch (key) {
                case "gems": {
                    const formula = value;
                    if (!Roll.validate(formula)) {
                        return Promise.reject(invalidFormulaError(formula));
                    }
                    const nbGems = Roll.create(formula).evaluate({ async: false });
                    return TreasureMapInternal._generateGemItemData(nbGems.total);
                }
                case "jewellery": {
                    const formula = value;
                    if (!Roll.validate(formula)) {
                        return Promise.reject(invalidFormulaError(formula));
                    }
                    const nbJwl = Roll.create("2d10").evaluate({ async: false });
                    return TreasureMapInternal._generateJewelryItemsData(nbJwl.total)
                }
                default:
                    return Promise.reject(unsupportedItemTypeError(key));
            }
        });

        return pileContent;
    }

    // Internal utilities

    /**
     *
     * @param {string} packName The compendium pack we want to get the table from (if you need to find the pack name use `console.log(game.packs)` in a macro to print all loaded compendiums)
     * @param {string} tableName the table full name (the one in the top field when viewing it on Foundry)
     * @returns the RollTable object
     */
    static async _getRollTableFromCompendium(packName, tableName) {
        const pack = game.packs.get(packName);
        const entry = pack.index.getName(tableName);
        const table = await pack.getDocument(entry._id);

        return table;
    }

    /**
     *
     * @param {FoundryItemData} itemData Object describing the item data, usually from a TableResult (from a draw on a RollTable)
     * @returns {Item} the corresponding Item data
     */
    static async _findItem(itemData) {
        let itemValue = itemData.data.collection + "." + itemData.data.resultId;
        let foundItem = await fromUuid(itemValue);
        return foundItem;
    }

    /**
     * Create an actor containing items generated from {itemData}
     * @param {String} name: name of the actor acting as a treasure hoard
     * @param {FoundryItemData} itemData: item data to generate and add to the pile
     * @returns
     */
    static async _createTreasureHoard(name, itemData) {
        // We need a treasure chest to put out loot into
        const treasureHoard = await Actor.create({
            name: name,
            type: "character",
            img: "icons/containers/chest/chest-reinforced-steel-red.webp"
        });

        treasureHoard.createEmbeddedDocuments("Item", itemData);

        return treasureHoard;
    }

    // Generate collection of items

    /**
     *
     * @param {String} tableName: which table we get the items from
     * @param {Integer} quantity: how many items we want
     */
    static _generateItemDataFromRollTable(tableName, quantity) {

    }

    // Gem stuff
    static _generateGemItemData(quantity) {
        const generatedGems =
            this._getRollTableFromCompendium("foundry-ose-generators.rolltables", "Gem Value")
                .then(table => {
                    return Array.from({ length: quantity }, () => {
                        return table.draw({ rollMode: "gmroll", displayChat: false }).then(gemData => {
                            const gemValue = parseInt(gemData.results[0].data.text.match(/\[(?<cost>\d+)gp\]/).groups.cost, 10);
                            return this._generateGemDetailData(gemValue);
                        });
                    });
                })
                .then(details => {
                    return Promise.all(details)
                });

        return generatedGems;
    }

    static async _generateGemDetailData(gemValue) {
        const gemLookupTableName = (() => {
            switch (gemValue) {
                default:
                case 10:
                    return "Pierres semi-précieuses [valeur basse]";
                case 50:
                    return "Pierres semi-précieuses [valeur moyenne]";
                case 100:
                    return "Pierres semi-précieuses [valeur élevée]";
                case 500:
                case 1000:
                    return "Pierre Précieuse";
            }
        })();

        const gemLookupTable = await this._getRollTableFromCompendium("foundry-ose-generators.rolltables", gemLookupTableName);
        const gemCutTable = await this._getRollTableFromCompendium("foundry-ose-generators.rolltables", "Apparence de Gemme");

        const fullGemName = (await gemLookupTable.draw({ rollMode: "gmroll", displayChat: false })).results[0];
        const gemName = fullGemName.data.text;

        const gemStoneDesc = (() => {
            if (gemLookupTableName.match("semi-précieuses")) {
                // Semi-precious stones
                return gemName.match(/\[(?<desc>.*)\]/).groups.desc;;
            } else {
                // Precious stones
                return gemName;
            }
        })();

        const gemCut = (await gemCutTable.draw({ rollMode: "gmroll", displayChat: false })).results;

        const valueMultStr = gemCut[1].data.text.match(/\[.*x(?<mult>.*)\]/).groups.mult;
        const valueMult = eval(valueMultStr);

        const gemSizes = gemCut[1].data.text.match(/\(Précieuse: (?<precious>.*)\/Semi-précieuse: (?<semiprecious>.*)\)/).groups;
        const gemSize = (() => {
            if (gemLookupTableName.match("semi-précieuses")) {
                // Semi-precious stones
                return gemSizes.semiprecious;
            } else {
                // Precious stones
                return gemSizes.precious;
            }
        })();

        const descString = `Un(e) ${gemStoneDesc} de la taille d'un(e) ${gemSize}, taillée en forme de ${gemCut[2].data.text} ${gemCut[0].data.text}`;

        const gemDetailObject = {
            name: gemName.replace(/\s*\[.*\]/g, ""),
            type: 'item',
            img: fullGemName.icon,
            data: {
                description: descString,
                cost: Math.trunc(gemValue * valueMult),
                treasure: true
            }
        }

        return gemDetailObject;
    }

    // Jewellery Stuff
    static _generateJewelryItemsData(quantity) {
        const generatedJwlry = this._getRollTableFromCompendium("foundry-ose-generators.rolltables", "Bijoux")
            .then((table) => {
                return Array.from({ length: quantity }, () => {
                    return this._generateJewelryItemDetailData(table);
                });
            })
            .then((details) => {
                return Promise.all(details);
            });

        return generatedJwlry;
    }

    static async _generateJewelryItemDetailData(jwlryDescTable) {
        const desc = await jwlryDescTable.draw({ rollMode: "gmroll", displayChat: false });
        const baseDesc = desc.results[0];

        const fullDesc = desc.results
            .reduce((fullDesc, desc) => `${fullDesc} ${desc.data.text}`, "") // Concat the mult-line gem description
            .replace("<br/>", " ") // Remove the CR used when rolling directly
            .replaceAll(/\[\[(.*d.*)\]\]/g, (...args) => Roll.create(args[1]).evaluate({ async: false }).total) // Apply the quant roll once instead of having it reevaluate everytime we display the item property text
            .replaceAll(/\[.*\]/g, ""); // Remove the unneeded gem desc precisions.

        const itemData = {
            name: baseDesc.data.text,
            type: "item",
            img: baseDesc.icon,
            data: {
                description: fullDesc,
                treasure: true,
                cost: TreasureMapInternal._generateJewelryValue()
            }
        };
        return itemData;
    }

    static _generateJewelryValue() {
        const variance = Roll.create("95+1d10").evaluate({ async: false }).total;
        const value = Math.trunc(Roll.create("3d6*100").evaluate({ async: false }).total * variance / 100);
        return value;
    }
}
