/** hardware-components.ts
 *  Official Bluefors LDsl System architecture & quantum hardware educational atlas.
 *  Contains the 10 core stages and components of the Bluefors LDsl cryostat:
 *  1. Vacuum enclosure and radiation shields
 *  2. Room Temperature Flange (~300 K)
 *  3. Pulse Tube Cryocooler (50 K & 4 K)
 *  4. 50K Flange
 *  5. 4K Flange
 *  6. Still Flange (0.6–0.9 K)
 *  7. Cold Plate (100–120 mK)
 *  8. Dilution Unit (<10 mK dilution process)
 *  9. Mixing Chamber Flange (<10 mK)
 *  10. Experimental Space (<10 mK)
 *
 *  Source reference: Bluefors LDsl 3D System (ldsl-system.bluefors.com)
 */

export type HardwareCategory = "Cooling" | "Control" | "QPU" | "Readout" | "Structure";

export type ExplodeGroup =
  | "outerShell"
  | "radiationShields"
  | "upperCryogenic"
  | "lowerCryogenic"
  | "controlWiring"
  | "readoutChain"
  | "qpuAssembly"
  | "supportStructure";

export interface CameraTarget {
  /** Normalized focus point in model space [x, y, z] */
  position: [number, number, number];
  /** Distance from target */
  distance: number;
}

export interface HardwareReference {
  title: string;
  source: string;
  url: string;
}

export interface HardwareComponent {
  id: string;
  name: string;
  shortName: string;
  category: HardwareCategory;
  /** Display temperature label */
  temperature?: string;
  shortDescription: string;
  fullDescription: string;
  purpose: string;
  whyItMatters: string;
  quantumConnection: string;
  location: string;
  material: string;
  meshNames: string[];
  explodeGroup: ExplodeGroup;
  cameraTarget: CameraTarget;
  references: HardwareReference[];
}

export const HARDWARE_COMPONENTS: HardwareComponent[] = [
  {
    id: "vacuum-enclosure-and-radiation-shields",
    name: "Vacuum enclosure and radiation shields",
    shortName: "Vacuum & Shields",
    category: "Structure",
    temperature: "300 K to 4 K",
    shortDescription: "Reduces heat transfer through conduction and convection by creating a vacuum-sealed enclosure and reflective thermal barriers.",
    fullDescription: "The vacuum can that surrounds the cryostat is designed to reduce heat transfer through conduction and convection by creating a vacuum-sealed enclosure around the cryogenic environment. By removing the air or gas molecules that facilitate heat conduction and convection, the vacuum can ensures that the only mode of heat transfer left is thermal radiation (photons).\n\nRadiation shields are designed to mitigate this heat transfer by reflecting and dissipating the thermal radiation originating from the warmer outer layers. Typically made of materials with high thermal conductivity and reflectivity, such as gold-plated copper or polished aluminum, these shields act as thermal barriers, capturing and redirecting the infrared radiation to prevent it from reaching the coldest stages of the cryostat.",
    purpose: "Eliminates gas convection and blocks thermal blackbody radiation from the ambient room environment.",
    whyItMatters: "Thermal radiation scales as T⁴. Without multilayer radiation shields and high vacuum (<10⁻⁶ mbar), room-temperature radiation would instantly overload the dilution refrigerator.",
    quantumConnection: "Guarantees the ultra-isolated thermal and magnetic environment essential to preserve fragile qubit quantum states.",
    location: "Outermost cylindrical enclosure and nested intermediate stage shields",
    material: "Aluminum / stainless steel vacuum vessel, gold-plated OFHC copper radiation shields",
    meshNames: ["OuterVacuumCan", "Shield50K", "Shield4K", "MuMetalShield"],
    explodeGroup: "outerShell",
    cameraTarget: { position: [0, 0.3, 0], distance: 5.6 },
    references: [
      { title: "Bluefors LDsl Cryostat System", source: "Bluefors", url: "https://ldsl-system.bluefors.com" },
    ],
  },
  {
    id: "room-temperature-flange",
    name: "Room Temperature Flange",
    shortName: "Room Temp Flange",
    category: "Structure",
    temperature: "~300 K",
    shortDescription: "Interface between the laboratory environment and the closed, ultra-low-temperature environment inside the cryostat.",
    fullDescription: "The Room Temperature Flange is the interface between the laboratory environment and the closed, ultra-low-temperature environment inside the cryostat.\n\nThe entire dilution refrigerator is mechanically suspended from this flange, which also accommodates all electrical wiring, microwave lines, and gas-handling connections required for operation.",
    purpose: "Provides primary mechanical suspension for the cryostat and anchors all RF, DC, and gas feedthrough interfaces.",
    whyItMatters: "Accommodates tall feedthrough towers, multi-pin RF connector arrays, pumping lines, and pulse tube cold heads.",
    quantumConnection: "The entry point for microwave drive and readout lines connecting classical room-temperature control electronics to the quantum processor.",
    location: "Topmost plate of the cryostat assembly at ambient laboratory temperature (~300 K)",
    material: "Precision-machined anodized aluminum / stainless steel with gold-plated RF connector blocks",
    meshNames: ["RoomTemperatureFlange", "FeedthroughTower", "PulseTubeMotor", "PumpingPort"],
    explodeGroup: "upperCryogenic",
    cameraTarget: { position: [0, 2.7, 0], distance: 2.8 },
    references: [
      { title: "Bluefors LDsl Cryostat System", source: "Bluefors", url: "https://ldsl-system.bluefors.com" },
    ],
  },
  {
    id: "pulse-tube-cryocooler",
    name: "Pulse Tube Cryocooler",
    shortName: "Pulse Tube",
    category: "Cooling",
    temperature: "50 K & 4 K Stages",
    shortDescription: "Precools the cryostat to a temperature at which the helium3-helium4 mixture can condense.",
    fullDescription: "Before the dilution process can operate, the cryostat must be precooled to a temperature at which the helium3-helium4 mixture can condense.\n\nThis is done using a two-stage pulse tube cryocooler. The first cooling stage provides cooling power at approximately 50 K, while the second stage cools the system to a bit below 4 K.\n\nThermal coupling between the pulse tube and the cryostat stages is achieved using flexible copper heat links, which provide high thermal conductivity while mechanically decoupling vibrations.",
    purpose: "Initial closed-cycle helium gas precooling from 300 K down to ~4 K without liquid cryogens.",
    whyItMatters: "Eliminates liquid helium consumption and uses flexible braided copper links to isolate mechanical compressor vibrations from qubits.",
    quantumConnection: "Removes over 98% of total thermal enthalpy, enabling dilution cooling to reach sub-10 mK temperatures.",
    location: "Mounted through top flange with cold heads extending to 50 K and 4 K stages",
    material: "Stainless steel regenerator tubes, rare-earth matrix, high-purity braided copper thermal links",
    meshNames: ["PulseTubeMotor", "PulseTube1stStage", "PulseTube2ndStage", "PTHeatLink50K", "PTHeatLink4K"],
    explodeGroup: "upperCryogenic",
    cameraTarget: { position: [0.5, 1.8, 0.1], distance: 2.5 },
    references: [
      { title: "Bluefors LDsl Cryostat System", source: "Bluefors", url: "https://ldsl-system.bluefors.com" },
    ],
  },
  {
    id: "50k-flange",
    name: "50K Flange",
    shortName: "50K Flange",
    category: "Cooling",
    temperature: "~50 K",
    shortDescription: "The first cold stage cooled by the pulse tube cryocooler to intercept room-temperature heat loads.",
    fullDescription: "The 50K flange is the first cold stage cooled by the pulse tube cryocooler. Its primary role is to intercept heat coming from room temperature and to cool radiation shields, wiring, and structural components before they reach colder stages.",
    purpose: "Primary thermal intercept stage absorbing conductive heat from cables and radiative heat from the vacuum can.",
    whyItMatters: "Reduces thermal conduction down cables and structural support rods by a factor of 6 before reaching the 4 K stage.",
    quantumConnection: "Initial heat sinking for all coaxial control lines and semi-rigid cables routing to the quantum chip.",
    location: "First suspended horizontal plate below the room-temperature flange",
    material: "Gold-plated OFHC copper with high thermal conductivity",
    meshNames: ["Stage50K", "Stage50KRim", "Shield50K"],
    explodeGroup: "upperCryogenic",
    cameraTarget: { position: [0, 1.95, 0], distance: 2.5 },
    references: [
      { title: "Bluefors LDsl Cryostat System", source: "Bluefors", url: "https://ldsl-system.bluefors.com" },
    ],
  },
  {
    id: "4k-flange",
    name: "4K Flange",
    shortName: "4K Flange",
    category: "Cooling",
    temperature: "~4 K",
    shortDescription: "Brings system temperature to approximately 4 K where the helium3-helium4 mixture can condense.",
    fullDescription: "In a cryogen-free dilution refrigerator, initial cooling is provided by a pulse tube cryocooler. Its second cooling stage brings the temperature of the 4K flange to approximately 4K, a temperature at which helium3-helium4 mixture can be condensed.\n\nThis condensed helium forms the working fluid required for evaporative cooling in the still and, ultimately, for the dilution process that enables millikelvin temperatures.",
    purpose: "Thermalizes the system at ~4 K, condenses the circulating helium mixture, and houses cryogenic low-noise amplifiers.",
    whyItMatters: "At 4 K, HEMT amplifiers provide ultra-low-noise amplification of faint quantum readout signals with minimal thermal back-action.",
    quantumConnection: "Anchors microwave attenuators (-20 dB) and HEMT amplifiers that boost single-photon level qubit readout signals.",
    location: "Second cold plate, thermally anchored to the second stage of the pulse tube",
    material: "Gold-plated OFHC copper, with gold-plated microwave amplifier housings",
    meshNames: ["Stage4K", "Stage4KRim", "HEMTChassis", "Shield4K"],
    explodeGroup: "upperCryogenic",
    cameraTarget: { position: [0, 1.25, 0], distance: 2.4 },
    references: [
      { title: "Bluefors LDsl Cryostat System", source: "Bluefors", url: "https://ldsl-system.bluefors.com" },
    ],
  },
  {
    id: "still-flange",
    name: "Still Flange",
    shortName: "Still Flange",
    category: "Cooling",
    temperature: "0.6–0.9 K",
    shortDescription: "Joule-Thomson expansion and preferential evaporation of helium-3 drives continuous circulation.",
    fullDescription: "At the Still Flange, after being precooled by heat exchangers, the incoming helium mixture experiences Joule–Thomson expansion, leading to partial condensation and the formation of liquid in a region known as the still. The still is typically at a temperature of around 0.6–0.9 K.\n\nWithin the still, evaporative cooling occurs predominantly through the preferential evaporation of helium3. This evaporation removes heat from the liquid and surrounding structures, providing cooling power throughout the dilution circuit.",
    purpose: "Evaporates pure ³He vapor under vacuum to power continuous dilution refrigeration circulation.",
    whyItMatters: "Features a distinctive clearance cutout, distillation still pot, and coiled helical capillary tubing.",
    quantumConnection: "Maintains the continuous flow cycle that extracts heat from the lower mixing chamber stages.",
    location: "Intermediate cryogenic stage below the 4 K plate, suspended via titanium support rods",
    material: "Gold-plated OFHC copper, stainless steel still body, coiled capillary heat exchangers",
    meshNames: ["StillStage", "StillRim", "StillVessel", "PumpingColumn", "StillCoil"],
    explodeGroup: "lowerCryogenic",
    cameraTarget: { position: [0, 0.50, 0], distance: 2.3 },
    references: [
      { title: "Bluefors LDsl Cryostat System", source: "Bluefors", url: "https://ldsl-system.bluefors.com" },
    ],
  },
  {
    id: "cold-plate",
    name: "Cold Plate",
    shortName: "Cold Plate",
    category: "Cooling",
    temperature: "100–120 mK",
    shortDescription: "Intermediate thermalization stage providing thermal anchoring for wiring before the mixing chamber.",
    fullDescription: "The cold plate is an intermediate thermalization stage located between the still flange and the mixing chamber, typically operating at a temperature of around 100–120mK.\n\nIts primary role is to intercept heat loads and provide thermal anchoring for wiring and components before they reach the mixing chamber.",
    purpose: "Intermediate thermal buffer intercepting heat before it can reach the sensitive mixing chamber.",
    whyItMatters: "Houses the continuous Joule-Thomson heat exchanger coil and sintered step heat exchangers.",
    quantumConnection: "Thermalizes microwave attenuators (-10 dB to -20 dB) to strip remaining thermal photon noise from qubit control lines.",
    location: "Positioned directly between Still stage and Mixing Chamber stage",
    material: "Gold-plated OFHC copper plate with silver-sintered heat exchangers",
    meshNames: ["ColdPlate", "ColdPlateRim", "JTSilverCoil", "ColdPlateHEX"],
    explodeGroup: "lowerCryogenic",
    cameraTarget: { position: [0, -0.15, 0], distance: 2.2 },
    references: [
      { title: "Bluefors LDsl Cryostat System", source: "Bluefors", url: "https://ldsl-system.bluefors.com" },
    ],
  },
  {
    id: "dilution-unit",
    name: "Dilution Unit",
    shortName: "Dilution Unit",
    category: "Cooling",
    temperature: "<10 mK Process",
    shortDescription: "Uses ³He-⁴He phase separation and quantum osmotic crossing to reach millikelvin temperatures.",
    fullDescription: "The dilution unit provides the cooling required to reach the ultra-low temperatures enabled by the cryostat.\n\nA dilution refrigerator uses the properties of He3-He4 mixture to generate cooling at millikelvin temperatures.\n\nBelow approximately 0.87K, a He3-He4 mixture separates into two phases: a He3-rich concentrated phase and a He3-poor dilute phase. Cooling is produced when He3 atoms cross from the concentrated phase into the dilute phase in the mixing chamber. This process requires energy, which is absorbed as heat from the surrounding environment, thereby providing cooling.",
    purpose: "Produces millikelvin cooling power through continuous endothermic crossing of ³He across the phase boundary.",
    whyItMatters: "Includes the condensing lines, continuous heat exchanger coil, stepped heat exchanger stack, and phase mixing volume.",
    quantumConnection: "The thermodynamic engine that enables superconducting qubits to enter their quantum ground states.",
    location: "Spans the Still, Cold Plate, and Mixing Chamber stages along the central plumbing axis",
    material: "High-surface-area silver sinters, specialized capillary tubing, brass/copper dilution components",
    meshNames: ["DilutionUnitStack", "DilutionCoil", "DilutionBase", "MXCBody"],
    explodeGroup: "lowerCryogenic",
    cameraTarget: { position: [0.15, -0.35, 0.1], distance: 2.2 },
    references: [
      { title: "Bluefors LDsl Cryostat System", source: "Bluefors", url: "https://ldsl-system.bluefors.com" },
    ],
  },
  {
    id: "mixing-chamber-flange",
    name: "Mixing Chamber Flange (<10 mK)",
    shortName: "Mixing Chamber",
    category: "Cooling",
    temperature: "<10 mK",
    shortDescription: "The coldest thermalization point in the fridge where experimental devices are mounted.",
    fullDescription: "The Mixing Chamber Flange is the coldest thermalization point in the fridge and is where the experimental device (such as a qubit chip or other ultra-low-temperature experiment) is mounted to ensure direct thermal contact with the dilution cooling.",
    purpose: "Provides the ultra-low-temperature base mounting surface in direct thermal contact with the mixing chamber liquid.",
    whyItMatters: "Operates continuously below 10 millikelvin, anchored with copper thermal straps and high-conductivity mounting brackets.",
    quantumConnection: "Thermalizes the sample package and qubit chip so thermal excitations kBT are far lower than qubit energy ℏω₀₁ (~5 GHz ↔ 240 mK).",
    location: "Lowest primary horizontal plate of the cryogenic chandelier",
    material: "Gold-plated OFHC copper with high residual resistivity ratio (RRR > 100)",
    meshNames: ["MXCPlate", "MXCRim", "MXCBody", "ColdFinger"],
    explodeGroup: "lowerCryogenic",
    cameraTarget: { position: [0, -0.85, 0], distance: 2.0 },
    references: [
      { title: "Bluefors LDsl Cryostat System", source: "Bluefors", url: "https://ldsl-system.bluefors.com" },
    ],
  },
  {
    id: "experimental-space",
    name: "Experimental Space",
    shortName: "Experimental Space",
    category: "QPU",
    temperature: "<10 mK",
    shortDescription: "Gold perforated mounting breadboard plate and payload environment under the Mixing Chamber Flange.",
    fullDescription: "Experiments (or payloads) are attached directly to the underside of the the Mixing Chamber Flange, in a stable environment under 10 millikelvin.\n\nExperiments are carried out via control and readout lines that enter the cryostat at the Room Temperature Flange, and reach the experiment via ports that travel the interior length of the cryostat.\n\nAll wiring and components must be rigorously tested to perform in ultra-low temperature environments.",
    purpose: "Accommodates quantum processors, traveling wave parametric amplifiers (TWPAs), filters, and cryogenic microwave payloads.",
    whyItMatters: "Distinguished by the signature gold perforated breadboard plate with regular matrix holes and microwave shielding cavity.",
    quantumConnection: "The active location of transmon qubits, fluxoniums, microwave resonators, and quantum state measurements.",
    location: "Underside of the Mixing Chamber Flange inside the innermost mu-metal shielding",
    material: "Gold-plated OFHC copper perforated breadboard plate, sapphire qubit die, superconducting niobium microwave cavity",
    meshNames: ["ExpBreadboardPlate", "QPUCavity", "QPULid", "QubitChipDie", "ResonatorBusLine"],
    explodeGroup: "qpuAssembly",
    cameraTarget: { position: [0, -1.35, 0], distance: 2.0 },
    references: [
      { title: "Bluefors LDsl Cryostat System", source: "Bluefors", url: "https://ldsl-system.bluefors.com" },
    ],
  },
];

/** Alias map to resolve legacy/alternate IDs to canonical Bluefors LDsl component IDs */
export const COMPONENT_ALIASES: Record<string, string> = {
  "outer-vacuum-can": "vacuum-enclosure-and-radiation-shields",
  "radiation-shields": "vacuum-enclosure-and-radiation-shields",
  "room-temp-flange": "room-temperature-flange",
  "pulse-tube": "pulse-tube-cryocooler",
  "stage-50k": "50k-flange",
  "stage-4k": "4k-flange",
  "hemt-amplifier": "4k-flange",
  "still-stage": "still-flange",
  "mixing-chamber": "mixing-chamber-flange",
  "qpu-package": "experimental-space",
  "control-lines": "experimental-space",
  "readout-lines": "experimental-space",
  "attenuators-filters": "cold-plate",
  "support-structure": "room-temperature-flange",
};

/** Lookup by id with alias support */
export function getComponent(id: string): HardwareComponent | undefined {
  const canonicalId = COMPONENT_ALIASES[id] ?? id;
  return HARDWARE_COMPONENTS.find((c) => c.id === canonicalId);
}

/** Filter by category */
export function getByCategory(category: HardwareCategory): HardwareComponent[] {
  return HARDWARE_COMPONENTS.filter((c) => c.category === category);
}

/** Search components by name, shortName, or description */
export function searchComponents(query: string): HardwareComponent[] {
  if (!query.trim()) return HARDWARE_COMPONENTS;
  const q = query.toLowerCase();
  return HARDWARE_COMPONENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.shortName.toLowerCase().includes(q) ||
      c.shortDescription.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
  );
}

export const CATEGORY_COLORS: Record<HardwareCategory, string> = {
  Cooling: "#0284c7",
  Control: "#ea580c",
  QPU: "#8b5cf6",
  Readout: "#10b981",
  Structure: "#64748b",
};

export const EXPLODE_GROUPS: ExplodeGroup[] = [
  "outerShell",
  "radiationShields",
  "upperCryogenic",
  "lowerCryogenic",
  "controlWiring",
  "readoutChain",
  "qpuAssembly",
  "supportStructure",
];
