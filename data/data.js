window.COPA_DATA = {
  meta: {
    title: "Copa do Mundo 2026 — Placar & Chaveamento",
    seededThrough: "10/07/2026",
    note: "",
    sourceLabel: "Artilharia validada com a página oficial de estatísticas da FIFA e fontes de apoio; dados locais antigos são bloqueados automaticamente."
  },
  teams: {
    MEX:{name:"México",flag:"🇲🇽"}, RSA:{name:"África do Sul",flag:"🇿🇦"}, KOR:{name:"Coreia do Sul",flag:"🇰🇷"}, CZE:{name:"Tchéquia",flag:"🇨🇿"},
    CAN:{name:"Canadá",flag:"🇨🇦"}, BIH:{name:"Bósnia e Herzegovina",flag:"🇧🇦"}, QAT:{name:"Catar",flag:"🇶🇦"}, SUI:{name:"Suíça",flag:"🇨🇭"},
    BRA:{name:"Brasil",flag:"🇧🇷"}, MAR:{name:"Marrocos",flag:"🇲🇦"}, HAI:{name:"Haiti",flag:"🇭🇹"}, SCO:{name:"Escócia",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿"},
    USA:{name:"Estados Unidos",flag:"🇺🇸"}, PAR:{name:"Paraguai",flag:"🇵🇾"}, AUS:{name:"Austrália",flag:"🇦🇺"}, TUR:{name:"Turquia",flag:"🇹🇷"},
    GER:{name:"Alemanha",flag:"🇩🇪"}, CUW:{name:"Curaçao",flag:"🇨🇼"}, CIV:{name:"Costa do Marfim",flag:"🇨🇮"}, ECU:{name:"Equador",flag:"🇪🇨"},
    NED:{name:"Países Baixos",flag:"🇳🇱"}, JPN:{name:"Japão",flag:"🇯🇵"}, SWE:{name:"Suécia",flag:"🇸🇪"}, TUN:{name:"Tunísia",flag:"🇹🇳"},
    EGY:{name:"Egito",flag:"🇪🇬"}, BEL:{name:"Bélgica",flag:"🇧🇪"}, IRN:{name:"Irã",flag:"🇮🇷"}, NZL:{name:"Nova Zelândia",flag:"🇳🇿"},
    ESP:{name:"Espanha",flag:"🇪🇸"}, CPV:{name:"Cabo Verde",flag:"🇨🇻"}, KSA:{name:"Arábia Saudita",flag:"🇸🇦"}, URU:{name:"Uruguai",flag:"🇺🇾"},
    FRA:{name:"França",flag:"🇫🇷"}, SEN:{name:"Senegal",flag:"🇸🇳"}, IRQ:{name:"Iraque",flag:"🇮🇶"}, NOR:{name:"Noruega",flag:"🇳🇴"},
    ARG:{name:"Argentina",flag:"🇦🇷"}, ALG:{name:"Argélia",flag:"🇩🇿"}, AUT:{name:"Áustria",flag:"🇦🇹"}, JOR:{name:"Jordânia",flag:"🇯🇴"},
    POR:{name:"Portugal",flag:"🇵🇹"}, COD:{name:"RD Congo",flag:"🇨🇩"}, COL:{name:"Colômbia",flag:"🇨🇴"}, UZB:{name:"Uzbequistão",flag:"🇺🇿"},
    ENG:{name:"Inglaterra",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"}, CRO:{name:"Croácia",flag:"🇭🇷"}, GHA:{name:"Gana",flag:"🇬🇭"}, PAN:{name:"Panamá",flag:"🇵🇦"}
  },

  topScorers: [
    {name:"Kylian Mbappé", team:"FRA", goals:8, assists:2, image:"assets/scorer-kylian-mbappe.jpg"},
    {name:"Lionel Messi", team:"ARG", goals:8, assists:3, image:"assets/scorer-lionel-messi.jpg"},
    {name:"Erling Haaland", team:"NOR", goals:7, assists:1, image:"assets/scorer-erling-haaland.jpg"},
    {name:"Harry Kane", team:"ENG", goals:6, assists:2, image:"assets/scorer-harry-kane.jpg"},
    {name:"Ismaïla Sarr", team:"SEN", goals:4, assists:1, image:"assets/scorer-ismaila-sarr.jpg"},
    {name:"Julián Quiñones", team:"MEX", goals:4, assists:1, image:"assets/scorer-julian-quinones.jpg"},
    {name:"Mikel Oyarzabal", team:"ESP", goals:4, assists:1, image:"assets/scorer-mikel-oyarzabal.jpg"},
    {name:"Ousmane Dembélé", team:"FRA", goals:4, assists:2, image:"assets/scorer-ousmane-dembele.jpg"},
    {name:"Vinícius Júnior", team:"BRA", goals:4, assists:1, image:"assets/scorer-vinicius-junior.jpg"},
    {name:"Brian Brobbey", team:"NED", goals:3, assists:0, image:"https://sassets.knvb.nl/sites/onsoranje.nl/files/players/ac1404b1a1ac6bcfd2b3b71febcf03d8.png"},
    {name:"Cody Gakpo", team:"NED", goals:3, assists:1, image:"https://cdn-img.staticzz.com/img/planteis/new/41/21/11084121_cody_gakpo_20240608073739.jpg"},
    {name:"Cristiano Ronaldo", team:"POR", goals:3, assists:1, image:"assets/scorer-cristiano-ronaldo.jpg"},
    {name:"Deniz Undav", team:"GER", goals:3, assists:0, image:"assets/scorer-deniz-undav.jpg"},
    {name:"Folarin Balogun", team:"USA", goals:3, assists:1, image:"assets/scorer-folarin-balogun.jpg"},
    {name:"Ismael Saibari", team:"MAR", goals:3, assists:1, image:"assets/scorer-ismael-saibari.jpg"},
    {name:"Johan Manzambi", team:"SUI", goals:3, assists:0, image:"assets/scorer-johan-manzambi.jpg"},
    {name:"Jonathan David", team:"CAN", goals:3, assists:1, image:"assets/scorer-jonathan-david.jpg"},
    {name:"Matheus Cunha", team:"BRA", goals:3, assists:0, image:"assets/scorer-matheus-cunha.jpg"},
    {name:"Elijah Just", team:"NZL", goals:3, assists:0},
    {name:"Kai Havertz", team:"GER", goals:3, assists:1},
    {name:"Yoane Wissa", team:"COD", goals:3, assists:1}
  ],
  goalEvents: {
    m73: [
      {team:"CAN", player:"Stephen Eustáquio", minute:"90+2"}
    ],
    m74: [
      {team:"PAR", player:"Julio Enciso", minute:"42"},
      {team:"GER", player:"Kai Havertz", minute:"54"}
    ],
    m75: [
      {team:"NED", player:"Cody Gakpo", minute:"72"},
      {team:"MAR", player:"Issa Diop", minute:"90+1"}
    ],
    m76: [
      {team:"JPN", player:"Kaishu Sano", minute:"29"},
      {team:"BRA", player:"Casemiro", minute:"55"},
      {team:"BRA", player:"Gabriel Martinelli", minute:"90+6"}
    ],
    m77: [
      {team:"FRA", player:"Kylian Mbappé", minute:"45"},
      {team:"FRA", player:"Bradley Barcola", minute:"53"},
      {team:"FRA", player:"Kylian Mbappé", minute:"74"}
    ],
    m78: [
      {team:"NOR", player:"Antonio Nusa", minute:"39"},
      {team:"CIV", player:"Amad Diallo", minute:"74"},
      {team:"NOR", player:"Erling Haaland", minute:"86"}
    ],
    m79: [
      {team:"MEX", player:"Julián Quiñones", minute:"22"},
      {team:"MEX", player:"Raúl Jiménez", minute:"31"}
    ],
    m80: [
      {team:"COD", player:"Brian Cipenga", minute:"7"},
      {team:"ENG", player:"Harry Kane", minute:"75"},
      {team:"ENG", player:"Harry Kane", minute:"86"}
    ],
    m81: [
      {team:"USA", player:"Folarin Balogun", minute:"45"},
      {team:"USA", player:"Malik Tillman", minute:"82"}
    ],
    m82: [
      {team:"SEN", player:"Habib Diarra", minute:"24"},
      {team:"SEN", player:"Ismaïla Sarr", minute:"51"},
      {team:"BEL", player:"Romelu Lukaku", minute:"86"},
      {team:"BEL", player:"Youri Tielemans", minute:"89"},
      {team:"BEL", player:"Youri Tielemans", minute:"120+5", type:"penalty"}
    ],
    m83: [
      {team:"CRO", player:"Ivan Perišić", minute:"53"},
      {team:"POR", player:"Cristiano Ronaldo", minute:"68", type:"penalty"},
      {team:"POR", player:"Gonçalo Ramos", minute:"90+4"}
    ],
    m84: [
      {team:"ESP", player:"Mikel Oyarzabal", minute:"36"},
      {team:"ESP", player:"Pedro Porro", minute:"66"},
      {team:"ESP", player:"Mikel Oyarzabal", minute:"89"}
    ],
    m85: [
      {team:"SUI", player:"Breel Embolo", minute:"10"},
      {team:"SUI", player:"Dan Ndoye", minute:"46"}
    ],
    m89: [
      {team:"MAR", player:"Azzedine Ounahi", minute:"50"},
      {team:"MAR", player:"Azzedine Ounahi", minute:"82"},
      {team:"MAR", player:"Soufiane Rahimi", minute:"90+8"}
    ],
    m90: [
      {team:"FRA", player:"Kylian Mbappé", minute:"70", type:"penalty"}
    ]
  },

  groups: {
    A:["MEX","RSA","KOR","CZE"], B:["CAN","BIH","QAT","SUI"], C:["BRA","MAR","HAI","SCO"], D:["USA","PAR","AUS","TUR"],
    E:["GER","CUW","CIV","ECU"], F:["NED","JPN","SWE","TUN"], G:["EGY","BEL","IRN","NZL"], H:["ESP","CPV","KSA","URU"],
    I:["FRA","SEN","IRQ","NOR"], J:["ARG","ALG","AUT","JOR"], K:["POR","COD","COL","UZB"], L:["ENG","CRO","GHA","PAN"]
  },
  groupMatches: [
    {id:"g01",group:"A",date:"2026-06-11",home:"MEX",away:"RSA",hg:2,ag:0},
    {id:"g02",group:"A",date:"2026-06-12",home:"KOR",away:"CZE",hg:2,ag:1},
    {id:"g03",group:"B",date:"2026-06-12",home:"CAN",away:"BIH",hg:1,ag:1},
    {id:"g04",group:"D",date:"2026-06-13",home:"USA",away:"PAR",hg:4,ag:1},
    {id:"g05",group:"B",date:"2026-06-13",home:"QAT",away:"SUI",hg:1,ag:1},
    {id:"g06",group:"C",date:"2026-06-13",home:"BRA",away:"MAR",hg:1,ag:1},
    {id:"g07",group:"C",date:"2026-06-14",home:"HAI",away:"SCO",hg:0,ag:1},
    {id:"g08",group:"D",date:"2026-06-14",home:"AUS",away:"TUR",hg:2,ag:0},
    {id:"g09",group:"E",date:"2026-06-14",home:"GER",away:"CUW",hg:7,ag:1},
    {id:"g10",group:"F",date:"2026-06-14",home:"NED",away:"JPN",hg:2,ag:2},
    {id:"g11",group:"E",date:"2026-06-15",home:"CIV",away:"ECU",hg:1,ag:0},
    {id:"g12",group:"F",date:"2026-06-15",home:"SWE",away:"TUN",hg:5,ag:1},
    {id:"g13",group:"H",date:"2026-06-15",home:"ESP",away:"CPV",hg:0,ag:0},
    {id:"g14",group:"G",date:"2026-06-15",home:"EGY",away:"BEL",hg:1,ag:1},
    {id:"g15",group:"H",date:"2026-06-15",home:"KSA",away:"URU",hg:1,ag:1},
    {id:"g16",group:"G",date:"2026-06-16",home:"IRN",away:"NZL",hg:2,ag:2},
    {id:"g17",group:"I",date:"2026-06-16",home:"FRA",away:"SEN",hg:3,ag:1},
    {id:"g18",group:"I",date:"2026-06-16",home:"IRQ",away:"NOR",hg:1,ag:4},
    {id:"g19",group:"J",date:"2026-06-17",home:"ARG",away:"ALG",hg:3,ag:0},
    {id:"g20",group:"J",date:"2026-06-17",home:"AUT",away:"JOR",hg:3,ag:1},
    {id:"g21",group:"K",date:"2026-06-17",home:"POR",away:"COD",hg:1,ag:1},
    {id:"g22",group:"L",date:"2026-06-17",home:"ENG",away:"CRO",hg:4,ag:2},
    {id:"g23",group:"L",date:"2026-06-17",home:"GHA",away:"PAN",hg:1,ag:0},
    {id:"g24",group:"K",date:"2026-06-17",home:"COL",away:"UZB",hg:3,ag:1},
    {id:"g25",group:"A",date:"2026-06-18",home:"CZE",away:"RSA",hg:1,ag:1},
    {id:"g26",group:"B",date:"2026-06-18",home:"SUI",away:"BIH",hg:4,ag:1},
    {id:"g27",group:"B",date:"2026-06-18",home:"CAN",away:"QAT",hg:6,ag:0},
    {id:"g28",group:"A",date:"2026-06-18",home:"MEX",away:"KOR",hg:1,ag:0},
    {id:"g29",group:"D",date:"2026-06-19",home:"USA",away:"AUS",hg:2,ag:0},
    {id:"g30",group:"C",date:"2026-06-19",home:"SCO",away:"MAR",hg:0,ag:1},
    {id:"g31",group:"C",date:"2026-06-19",home:"BRA",away:"HAI",hg:3,ag:0},
    {id:"g32",group:"D",date:"2026-06-19",home:"TUR",away:"PAR",hg:0,ag:1},
    {id:"g33",group:"F",date:"2026-06-20",home:"NED",away:"SWE",hg:5,ag:1},
    {id:"g34",group:"E",date:"2026-06-20",home:"GER",away:"CIV",hg:2,ag:1},
    {id:"g35",group:"E",date:"2026-06-20",home:"ECU",away:"CUW",hg:0,ag:0},
    {id:"g36",group:"F",date:"2026-06-20",home:"TUN",away:"JPN",hg:0,ag:4},
    {id:"g37",group:"H",date:"2026-06-21",home:"ESP",away:"KSA",hg:4,ag:0},
    {id:"g38",group:"G",date:"2026-06-21",home:"BEL",away:"IRN",hg:0,ag:0},
    {id:"g39",group:"H",date:"2026-06-21",home:"URU",away:"CPV",hg:2,ag:2},
    {id:"g40",group:"G",date:"2026-06-21",home:"NZL",away:"EGY",hg:1,ag:3},
    {id:"g41",group:"J",date:"2026-06-22",home:"ARG",away:"AUT",hg:2,ag:0},
    {id:"g42",group:"I",date:"2026-06-22",home:"FRA",away:"IRQ",hg:3,ag:0},
    {id:"g43",group:"I",date:"2026-06-22",home:"NOR",away:"SEN",hg:3,ag:2},
    {id:"g44",group:"J",date:"2026-06-22",home:"JOR",away:"ALG",hg:1,ag:2},
    {id:"g45",group:"K",date:"2026-06-23",home:"POR",away:"UZB",hg:5,ag:0},
    {id:"g46",group:"L",date:"2026-06-23",home:"ENG",away:"GHA",hg:0,ag:0},
    {id:"g47",group:"L",date:"2026-06-23",home:"CRO",away:"PAN",hg:1,ag:0},
    {id:"g48",group:"K",date:"2026-06-23",home:"COL",away:"COD",hg:1,ag:0},
    {id:"g49",group:"B",date:"2026-06-24",home:"BIH",away:"QAT",hg:3,ag:1},
    {id:"g50",group:"B",date:"2026-06-24",home:"SUI",away:"CAN",hg:2,ag:1},
    {id:"g51",group:"C",date:"2026-06-24",home:"MAR",away:"HAI",hg:4,ag:2},
    {id:"g52",group:"C",date:"2026-06-24",home:"SCO",away:"BRA",hg:0,ag:3},
    {id:"g53",group:"A",date:"2026-06-25",home:"RSA",away:"KOR",hg:1,ag:0},
    {id:"g54",group:"A",date:"2026-06-25",home:"CZE",away:"MEX",hg:0,ag:3},
    {id:"g55",group:"E",date:"2026-06-25",home:"CUW",away:"CIV",hg:0,ag:2},
    {id:"g56",group:"E",date:"2026-06-25",home:"ECU",away:"GER",hg:2,ag:1},
    {id:"g57",group:"F",date:"2026-06-25",home:"JPN",away:"SWE",hg:1,ag:1},
    {id:"g58",group:"F",date:"2026-06-25",home:"TUN",away:"NED",hg:1,ag:3},
    {id:"g59",group:"D",date:"2026-06-25",home:"TUR",away:"USA",hg:3,ag:2},
    {id:"g60",group:"D",date:"2026-06-25",home:"PAR",away:"AUS",hg:0,ag:0},
    {id:"g61",group:"I",date:"2026-06-26",home:"NOR",away:"FRA",hg:1,ag:4},
    {id:"g62",group:"I",date:"2026-06-26",home:"SEN",away:"IRQ",hg:5,ag:0},
    {id:"g63",group:"H",date:"2026-06-26",home:"CPV",away:"KSA",hg:0,ag:0},
    {id:"g64",group:"H",date:"2026-06-26",home:"URU",away:"ESP",hg:0,ag:1},
    {id:"g65",group:"G",date:"2026-06-26",home:"NZL",away:"BEL",hg:1,ag:5},
    {id:"g66",group:"G",date:"2026-06-26",home:"EGY",away:"IRN",hg:1,ag:1},
    {id:"g67",group:"L",date:"2026-06-27",home:"PAN",away:"ENG",hg:0,ag:2},
    {id:"g68",group:"L",date:"2026-06-27",home:"CRO",away:"GHA",hg:2,ag:1},
    {id:"g69",group:"K",date:"2026-06-27",home:"COL",away:"POR",hg:0,ag:0},
    {id:"g70",group:"K",date:"2026-06-27",home:"COD",away:"UZB",hg:3,ag:1},
    {id:"g71",group:"J",date:"2026-06-27",home:"ALG",away:"AUT",hg:3,ag:3},
    {id:"g72",group:"J",date:"2026-06-27",home:"JOR",away:"ARG",hg:1,ag:3}
  ],
  knockoutMatches: [
    {id:"m73",stage:"R32",date:"2026-06-28",time:"16:00",home:"RSA",away:"CAN",hg:0,ag:1,hp:null,ap:null},
    {id:"m74",stage:"R32",date:"2026-06-29",time:"17:30",home:"GER",away:"PAR",hg:1,ag:1,hp:3,ap:4},
    {id:"m75",stage:"R32",date:"2026-06-29",time:"22:00",home:"NED",away:"MAR",hg:1,ag:1,hp:2,ap:3},
    {id:"m76",stage:"R32",date:"2026-06-29",time:"14:00",home:"BRA",away:"JPN",hg:2,ag:1,hp:null,ap:null},
    {id:"m77",stage:"R32",date:"2026-06-30",time:"18:00",home:"FRA",away:"SWE",hg:3,ag:0,hp:null,ap:null},
    {id:"m78",stage:"R32",date:"2026-06-30",time:"14:00",home:"CIV",away:"NOR",hg:1,ag:2,hp:null,ap:null},
    {id:"m79",stage:"R32",date:"2026-06-30",time:"22:00",home:"MEX",away:"ECU",hg:2,ag:0,hp:null,ap:null},
    {id:"m80",stage:"R32",date:"2026-07-01",time:"13:00",home:"ENG",away:"COD",hg:2,ag:1,hp:null,ap:null},
    {id:"m81",stage:"R32",date:"2026-07-01",time:"21:00",home:"USA",away:"BIH",hg:2,ag:0,hp:null,ap:null},
    {id:"m82",stage:"R32",date:"2026-07-01",time:"17:00",home:"BEL",away:"SEN",hg:3,ag:2,hp:null,ap:null,note:"Após prorrogação"},
    {id:"m83",stage:"R32",date:"2026-07-02",time:"20:00",home:"POR",away:"CRO",hg:2,ag:1,hp:null,ap:null},
    {id:"m84",stage:"R32",date:"2026-07-02",time:"16:00",home:"ESP",away:"AUT",hg:3,ag:0,hp:null,ap:null},
    {id:"m85",stage:"R32",date:"2026-07-03",time:"00:00",home:"SUI",away:"ALG",hg:2,ag:0,hp:null,ap:null},
    {id:"m86",stage:"R32",date:"2026-07-03",time:"19:00",home:"ARG",away:"CPV",hg:null,ag:null,hp:null,ap:null},
    {id:"m87",stage:"R32",date:"2026-07-03",time:"22:30",home:"COL",away:"GHA",hg:null,ag:null,hp:null,ap:null},
    {id:"m88",stage:"R32",date:"2026-07-03",time:"15:00",home:"AUS",away:"EGY",hg:null,ag:null,hp:null,ap:null},

    {id:"m89",stage:"R16",date:"2026-07-04",time:"14:00",fromHome:"m73",fromAway:"m75",home:"CAN",away:"MAR",hg:0,ag:3,hp:null,ap:null},
    {id:"m90",stage:"R16",date:"2026-07-04",time:"18:00",fromHome:"m74",fromAway:"m77",home:"PAR",away:"FRA",hg:0,ag:1,hp:null,ap:null},
    {id:"m91",stage:"R16",date:"2026-07-05",time:"17:00",fromHome:"m76",fromAway:"m78",home:null,away:null,hg:null,ag:null,hp:null,ap:null},
    {id:"m92",stage:"R16",date:"2026-07-05",time:"21:00",fromHome:"m79",fromAway:"m80",home:null,away:null,hg:null,ag:null,hp:null,ap:null},
    {id:"m93",stage:"R16",date:"2026-07-06",time:"16:00",fromHome:"m83",fromAway:"m84",home:null,away:null,hg:null,ag:null,hp:null,ap:null},
    {id:"m94",stage:"R16",date:"2026-07-06",time:"21:00",fromHome:"m81",fromAway:"m82",home:null,away:null,hg:null,ag:null,hp:null,ap:null},
    {id:"m95",stage:"R16",date:"2026-07-07",time:"13:00",fromHome:"m86",fromAway:"m88",home:null,away:null,hg:null,ag:null,hp:null,ap:null},
    {id:"m96",stage:"R16",date:"2026-07-07",time:"17:00",fromHome:"m85",fromAway:"m87",home:null,away:null,hg:null,ag:null,hp:null,ap:null},

    {id:"m97",stage:"QF",date:"2026-07-09",time:"17:00",fromHome:"m89",fromAway:"m90",home:null,away:null,hg:null,ag:null,hp:null,ap:null},
    {id:"m98",stage:"QF",date:"2026-07-10",time:"16:00",fromHome:"m93",fromAway:"m94",home:null,away:null,hg:null,ag:null,hp:null,ap:null},
    {id:"m99",stage:"QF",date:"2026-07-11",time:"18:00",fromHome:"m91",fromAway:"m92",home:null,away:null,hg:null,ag:null,hp:null,ap:null},
    {id:"m100",stage:"QF",date:"2026-07-11",time:"22:00",fromHome:"m95",fromAway:"m96",home:null,away:null,hg:null,ag:null,hp:null,ap:null},

    {id:"m101",stage:"SF",date:"2026-07-14",time:"16:00",fromHome:"m97",fromAway:"m98",home:null,away:null,hg:null,ag:null,hp:null,ap:null},
    {id:"m102",stage:"SF",date:"2026-07-15",time:"16:00",fromHome:"m99",fromAway:"m100",home:null,away:null,hg:null,ag:null,hp:null,ap:null},
    {id:"m103",stage:"THIRD",date:"2026-07-18",time:"18:00",loserHome:"m101",loserAway:"m102",home:null,away:null,hg:null,ag:null,hp:null,ap:null},
    {id:"m104",stage:"FINAL",date:"2026-07-19",time:"16:00",fromHome:"m101",fromAway:"m102",home:null,away:null,hg:null,ag:null,hp:null,ap:null}
  ]
};
