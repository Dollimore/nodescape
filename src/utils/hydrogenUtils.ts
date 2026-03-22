export interface ElectrolyzerSpec {
  type: 'PEM' | 'ALK' | 'SOEC';
  powerInput: number;      // MW
  efficiency: number;      // % (LHV basis)
  waterConsumption: number; // liters per kg H2
  outputPressure: number;  // bar
  stackLife: number;       // hours
}

export interface H2ProductionResult {
  h2OutputKgPerHour: number;
  h2OutputTonnesPerDay: number;
  electricityPerKg: number;  // kWh/kg
  waterPerDay: number;       // m3/day
  co2Avoided: number;        // tonnes CO2/day (vs SMR)
  levelizedCost: number;     // $/kg estimate
}

/** Calculate hydrogen production from electrolyzer specs */
export function calculateH2Production(spec: ElectrolyzerSpec): H2ProductionResult {
  // H2 LHV = 33.33 kWh/kg
  const h2LHV = 33.33;
  const effectiveEfficiency = spec.efficiency / 100;
  const electricityPerKg = h2LHV / effectiveEfficiency;
  const h2OutputKgPerHour = (spec.powerInput * 1000) / electricityPerKg;
  const h2OutputTonnesPerDay = (h2OutputKgPerHour * 24) / 1000;
  const waterPerDay = (h2OutputKgPerHour * spec.waterConsumption * 24) / 1000;

  // CO2 avoided vs steam methane reforming (~10 kg CO2/kg H2)
  const co2Avoided = h2OutputTonnesPerDay * 10;

  // Rough LCOH estimate (simplified)
  const capexPerKW = spec.type === 'PEM' ? 1200 : spec.type === 'ALK' ? 800 : 2500;
  const annualH2 = h2OutputTonnesPerDay * 365 * 1000; // kg/year
  const annualElectricity = spec.powerInput * 8000; // MWh (assuming 8000h/year)
  const electricityCostPerMWh = 40; // $/MWh assumed
  const capexAnnualized = (capexPerKW * spec.powerInput * 1000) / (20 * annualH2); // 20 year life
  const opexPerKg = (annualElectricity * electricityCostPerMWh) / annualH2;
  const levelizedCost = capexAnnualized + opexPerKg;

  return {
    h2OutputKgPerHour,
    h2OutputTonnesPerDay,
    electricityPerKg,
    waterPerDay,
    co2Avoided,
    levelizedCost: Math.round(levelizedCost * 100) / 100,
  };
}

/** Generate hydrogen production summary sections */
export function h2ProductionSections(result: H2ProductionResult): Array<{ heading: string; content: string }> {
  return [
    { heading: 'H2 Output', content: `${result.h2OutputTonnesPerDay.toFixed(1)} tonnes/day (${result.h2OutputKgPerHour.toFixed(0)} kg/hr)` },
    { heading: 'Electricity', content: `${result.electricityPerKg.toFixed(1)} kWh/kg H2` },
    { heading: 'Water Usage', content: `${result.waterPerDay.toFixed(0)} m3/day` },
    { heading: 'CO2 Avoided', content: `${result.co2Avoided.toFixed(0)} tonnes CO2/day vs SMR` },
    { heading: 'Est. LCOH', content: `$${result.levelizedCost}/kg H2` },
  ];
}

