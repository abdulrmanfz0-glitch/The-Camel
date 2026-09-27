/* which organs each disease involves, and how the body shows it (never gory: tints, spots, cysts) */
const DIS_MAP = {
  surra: { org: ['blood', 'spleen', 'vessels', 'lymph'], vis: [['spleen', 'swell'], ['vessels', 'inflam']] },
  mange: { org: ['skin', 'coat'], vis: [['skin', 'mange', [1, 2, 0, 4, 14, 5, 15, 13]]] },
  camelpox: { org: ['skin', 'mouth', 'eyes', 'lymph'], vis: [['skin', 'pox', [11, 10, 1, 2, 4, 14]], ['lymph', 'swell']] },
  brucellosis: { org: ['uterus', 'udder', 'lymph'], vis: [['uterus', 'inflam'], ['udder', 'inflam'], ['lymph', 'swell']] },
  mers: { org: ['nose', 'trachea'], vis: [['nose', 'inflam'], ['trachea', 'inflam']] },
  parasites: { org: ['c3', 'intestine', 'colon', 'blood'], vis: [['c3', 'inflam'], ['intestine', 'inflam'], ['colon', 'inflam']] },
  ticks: { org: ['skin', 'ears', 'udder', 'blood'], vis: [['skin', 'ticks', [9, 12, 8, 13, 5, 15]]] },
  mastitis: { org: ['udder'], vis: [['udder', 'inflam'], ['skin', 'redden', [9]]], cam: { t: [-.3, 1.1, 0], r: .5, az: .45, el: .03 } },
  calfDiarrhea: { org: ['intestine', 'colon'], vis: [['intestine', 'inflam'], ['colon', 'inflam']] },
  respiratory: { org: ['lungs', 'trachea', 'nose'], vis: [['lungs', 'patchy'], ['trachea', 'inflam'], ['nose', 'inflam']] },
  foot: { org: ['pads'], vis: [['skin', 'foot', [6, 16, 7, 17]]], cam: { t: [.68, .12, .2], r: .45, az: .9, el: .35 } },
  dental: { org: ['teeth', 'mouth'], vis: [['teeth', 'inflam']] },
  heatStress: { org: ['brain', 'heart', 'skin'], vis: [['brain', 'inflam'], ['heart', 'inflam']] },
  poison: { org: ['c1', 'liver', 'heart', 'kidneys'], vis: [['c1', 'inflam'], ['liver', 'inflam'], ['heart', 'inflam'], ['kidneys', 'inflam']] },
  rabies: { org: ['brain'], vis: [['brain', 'inflam']] },
  ringworm: { org: ['skin', 'coat'], vis: [['skin', 'ringworm', [1, 2, 0, 4, 14, 13]]] },
  nasalBot: { org: ['nose', 'larynx'], vis: [['nose', 'larvae'], ['larynx', 'inflam']] },
  hydatid: { org: ['lungs', 'liver'], vis: [['lungs', 'cysts'], ['liver', 'cysts']], cam: { t: [.2, 1.45, 0], r: .7, az: .3, el: .15 } },
  cla: { org: ['lymph', 'skin', 'lungs'], vis: [['lymph', 'abscess']], cam: { t: [.74, 1.46, 0], r: .55, az: .55, el: .08 } },
  enterotox: { org: ['intestine', 'c3'], vis: [['intestine', 'inflam'], ['c3', 'inflam']] },
  impaction: { org: ['c1', 'c2', 'colon'], vis: [['c1', 'mass'], ['c2', 'inflam']], cam: { t: [-.12, 1.26, .05], r: .6, az: .5, el: .12 } },
};

export { DIS_MAP };
