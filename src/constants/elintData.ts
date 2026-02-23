export const EMITTER_DATABASE = [
  { type: 'SAM RADAR', classification: 'HQ-9', band: 'S-BAND', bearing: '045°', range: '320km', sector: 'LAC' },
  { type: 'FIRE CONTROL', classification: 'TYPE-305A', band: 'C-BAND', bearing: '012°', range: '180km', sector: 'LOC' },
  { type: 'EW JAMMER', classification: 'UNIDENT', band: 'X-BAND', bearing: '270°', range: '90km', sector: 'MARITIME' },
  { type: 'SEARCH RADAR', classification: 'YLC-8B', band: 'UHF', bearing: '030°', range: '400km', sector: 'NE' },
];

export const EMITTER_TYPE_COLORS: Record<string, string> = {
  'SAM RADAR': '#FF3333',
  'FIRE CONTROL': '#FF6633',
  'EW JAMMER': '#FFA500',
  'SEARCH RADAR': '#4488FF',
};
