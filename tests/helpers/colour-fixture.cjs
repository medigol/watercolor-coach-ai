module.exports = () => ({
  visibleColours: [
    {
      label: "Reserved warm light",
      approximateHex: "#E5C58C",
      roleId: "tower",
    },
    { label: "Muted green-grey", approximateHex: "#6E897A", roleId: "bank" },
    { label: "Cool blue-grey", approximateHex: "#9CB5BB", roleId: "water" },
  ],
  colourStrategy: "A muted cool field supports one small warm focal accent.",
  valueHierarchy:
    "The reserved tower light separates from connected middle-value water and a few dark bank accents.",
  chromaHierarchy:
    "The warm light carries the strongest colour; the bank remains muted and subordinate.",
  temperatureRelationship:
    "Cooler, lighter distance gives the warm tower a clear landing.",
  technicalAssessment: {
    kind: "coherent",
    insightId: "temperature",
    explanation:
      "The colour hierarchy is coherent. A more saturated alternative would be a stylistic choice, not a correction.",
  },
  recreationMixes: [
    {
      target: "Cool blue-grey water",
      pigments: ["Ultramarine", "Burnt Sienna"],
      startingRatio: "2:1",
      use: "Dilute for the quiet middle-value water; test the neutral on scrap.",
    },
    {
      target: "Warm tower light",
      pigments: ["Yellow Ochre", "Burnt Sienna"],
      startingRatio: "3:1",
      use: "Keep the wash light and reserve a small untouched paper shape.",
    },
  ],
});
