# OSE Generators

This is a loot pile generator (like many others done for various FoundryVTT Systems) intended for use with Old School Essentials, using the treasure generation guidelines found in the Old School Essentials.
It includes premade macros for the predefined [Treasure Maps](https://oldschoolessentials.necroticgnome.com/srd/index.php/Scrolls_and_Maps#Maps), and should be flexible enough to allow custom tables as well.

## EARLY ALPHA

I worked on this for less than a dozen hours, so it can only generate hoards containing gems and jewellery for now (I started this because I didn't want to manually create the hoard for a Type 2 treasure map). Still, the generator should spit out error notifications when it encounters bad Roll formulas or unknown item types.

Also for now, the description are in French (because I am French, as indicated by my Github profile).

## How to Use

The generator does its magic by calling the `OSEGen.TreasureMaps.generateTreasurePile(pileName, pileConfiguration)` function, passing it the name of the resulting hoard, and a configuration object to define what the hoard contains (in the same way that FoundryVTT defines data for its `Actor.create()` or `Item.create()` methods).

Example for a Type 2 Treasure map. You simply put this in a macro, then run it; the module outputs a Fondry notification when the hoard has been created.
```js
OSEGen.TreasureMaps.generateTreasurePile("Treasure Map 2", {gems:"1d6*10", jewellery:"2d10"});
```

**Small note:** I included a little bit a variance (between 95 and 105% of generated cost) for Jewellery generation to break out of the basic and predictable `3d6*100` gp cost suggested in the OSE rules.

### Expected format for the configuration object

```js
{
    <item_type>: "<quantity: Roll formula>",
    [<item_type>: "<quantity: Roll formula>",
    [...]]
}
```

- `<item_type>` can be any of `[gems, jewellery]` (for now, I'll expend that when I implement more)
- "<Roll formula>" is any kind of Roll formula accepted by FoundryVTT (see [here](https://foundryvtt.com/article/dice/) and [here](https://foundryvtt.com/article/dice-advanced/) for more info on that). Basically, if it passes `Roll.validate()`, it's good for me.

## Planned ToDo

This is what I thought of adding to this module, not in any strict chronological order

- [ ] Add other types of items to the hoard generator
- [ ] Find out how to enable "ItemPile" status on a generated hoard (for use with the ItemPile module)
- [ ] Write the macros for the other type of Treasure Maps
- [ ] Enable "custom" items to be able to call any RollTable containing "Item"-type documents
- [ ] Figure out how to include I18N for the jewellery description

## Thanks

- Gavin Norman for OSE
- The peeps in the "Unofficial Old School Essentials for Foundry VTT" Discord for taking over maintenance and developpement of the module.
- [/u/Ecktheo](https://old.reddit.com/u/Ecktheo)'s [Valuables Description Tables](https://www.reddit.com/r/osr/comments/uxiez6/revised_valuables_tables/) (I used that for the Jewellery description)