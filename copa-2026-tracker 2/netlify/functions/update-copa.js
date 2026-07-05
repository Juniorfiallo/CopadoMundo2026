const ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260719";
const ESPN_SUMMARY_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=";
const COMMUNITY_GAMES_URL = "https://worldcup26.ir/get/games";
const COMMUNITY_TEAMS_URL = "https://worldcup26.ir/get/teams";

const OFFICIAL_SCORERS = Object.freeze([
  {name:"Kylian Mbappé",team:"FRA",goals:6,image:"assets/scorer-kylian-mbappe.jpg"},
  {name:"Lionel Messi",team:"ARG",goals:6,image:"assets/scorer-lionel-messi.jpg"},
  {name:"Erling Haaland",team:"NOR",goals:5,image:"assets/scorer-erling-haaland.jpg"},
  {name:"Harry Kane",team:"ENG",goals:5,image:"assets/scorer-harry-kane.jpg"},
  {name:"Ismaïla Sarr",team:"SEN",goals:4,image:"assets/scorer-ismaila-sarr.jpg"},
  {name:"Mikel Oyarzabal",team:"ESP",goals:4,image:"assets/scorer-mikel-oyarzabal.jpg"},
  {name:"Ousmane Dembélé",team:"FRA",goals:4,image:"assets/scorer-ousmane-dembele.jpg"},
  {name:"Vinícius Júnior",team:"BRA",goals:4,image:"assets/scorer-vinicius-junior.jpg"},
  {name:"Brian Brobbey",team:"NED",goals:3},
  {name:"Cody Gakpo",team:"NED",goals:3},
  {name:"Cristiano Ronaldo",team:"POR",goals:3,image:"assets/scorer-cristiano-ronaldo.jpg"},
  {name:"Deniz Undav",team:"GER",goals:3,image:"assets/scorer-deniz-undav.jpg"},
  {name:"Elijah Just",team:"NZL",goals:3},
  {name:"Folarin Balogun",team:"USA",goals:3,image:"assets/scorer-folarin-balogun.jpg"},
  {name:"Ismael Saibari",team:"MAR",goals:3,image:"assets/scorer-ismael-saibari.jpg"},
  {name:"Johan Manzambi",team:"SUI",goals:3,image:"assets/scorer-johan-manzambi.jpg"},
  {name:"Jonathan David",team:"CAN",goals:3,image:"assets/scorer-jonathan-david.jpg"},
  {name:"Julián Quiñones",team:"MEX",goals:3,image:"assets/scorer-julian-quinones.jpg"},
  {name:"Kai Havertz",team:"GER",goals:3},
  {name:"Matheus Cunha",team:"BRA",goals:3,image:"assets/scorer-matheus-cunha.jpg"},
  {name:"Yoane Wissa",team:"COD",goals:3}
]);

const TEAM_CODE_ALIASES = Object.freeze({
  "NETHERLANDS":"NED", "HOL":"NED", "UNITED STATES":"USA", "US":"USA",
  "SOUTH AFRICA":"RSA", "KOREA REPUBLIC":"KOR", "COTE D IVOIRE":"CIV",
  "CÔTE D'IVOIRE":"CIV", "CAPE VERDE":"CPV", "SAUDI ARABIA":"KSA",
  "IRAN":"IRN", "DR CONGO":"COD", "CONGO DR":"COD", "CZECHIA":"CZE",
  "BOSNIA AND HERZEGOVINA":"BIH", "NEW ZEALAND":"NZL"
});

function jsonResponse(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}

async function fetchJson(url, timeout = 18000) {
  const response = await fetch(url, {
    headers: {Accept:"application/json", "User-Agent":"Copa-2026-Painel-Premium/6.5"},
    cache: "no-store",
    signal: AbortSignal.timeout(timeout)
  });
  if (!response.ok) throw new Error(`${new URL(url).hostname} respondeu ${response.status}`);
  return response.json();
}

function cleanCode(value) {
  const raw = String(value || "").trim().toUpperCase();
  return TEAM_CODE_ALIASES[raw] || raw;
}

function numberValue(value) {
  const raw = typeof value === "object" && value !== null
    ? (value.value ?? value.displayValue ?? value.score ?? null)
    : value;
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
}

function minuteValue(value) {
  const text = String(value || "").trim().replace(/[’']/g, "");
  const match = text.match(/(\d{1,3}(?:\+\d{1,2})?)/);
  return match ? match[1] : "";
}

function uniqueEvents(events) {
  const map = new Map();
  events.forEach((event, index) => {
    if (!event?.player || !event?.team) return;
    const key = `${event.team}|${event.player}|${event.minute}|${event.type}`;
    if (!map.has(key)) map.set(key, {...event, id:event.id || `goal-${index}`});
  });
  return [...map.values()];
}

function parseEspnGoalDetails(source, teamIdMap = new Map()) {
  const arrays = [
    source?.header?.competitions?.[0]?.details,
    source?.competitions?.[0]?.details,
    source?.details,
    source?.plays
  ].filter(Array.isArray);
  const events = [];
  arrays.flat().forEach((item, index) => {
    const typeText = String(item?.type?.text || item?.type?.name || item?.text || item?.shortText || "").toLowerCase();
    const isShootout = /shootout|penalty shoot/.test(typeText);
    const isGoal = item?.scoringPlay === true || /goal|penalty/.test(typeText);
    if (!isGoal || isShootout) return;
    const athlete = item?.participants?.[0]?.athlete || item?.athletes?.[0]?.athlete || item?.athlete || item?.participants?.[0];
    const player = String(athlete?.displayName || athlete?.fullName || athlete?.shortName || item?.player?.displayName || "").trim();
    const teamCode = cleanCode(item?.team?.abbreviation || item?.team?.shortDisplayName || teamIdMap.get(String(item?.team?.id || "")) || "");
    if (!player || !teamCode) return;
    events.push({
      id: `espn-${index}-${teamCode}`,
      team: teamCode,
      player,
      minute: minuteValue(item?.clock?.displayValue || item?.time?.displayValue || item?.period?.displayValue),
      type: /penalty/.test(typeText) ? "penalty" : "goal"
    });
  });
  return uniqueEvents(events);
}

function parseEspnEvent(event, summary = null) {
  const competition = event?.competitions?.[0] || summary?.header?.competitions?.[0] || {};
  const competitors = competition?.competitors || [];
  const home = competitors.find(item => item.homeAway === "home") || competitors[0];
  const away = competitors.find(item => item.homeAway === "away") || competitors[1];
  if (!home || !away) return null;
  const homeCode = cleanCode(home?.team?.abbreviation || home?.team?.shortDisplayName || home?.team?.displayName);
  const awayCode = cleanCode(away?.team?.abbreviation || away?.team?.shortDisplayName || away?.team?.displayName);
  const status = event?.status?.type || competition?.status?.type || {};
  const completed = Boolean(status.completed || String(status.name || status.description || "").toLowerCase().includes("final"));
  const started = completed || !["STATUS_SCHEDULED", "scheduled", "pre"].includes(String(status.name || status.state || ""));
  const teamIdMap = new Map(competitors.map(item => [String(item?.team?.id || ""), cleanCode(item?.team?.abbreviation || item?.team?.displayName)]));
  const goalEvents = uniqueEvents([
    ...parseEspnGoalDetails(event, teamIdMap),
    ...parseEspnGoalDetails(summary, teamIdMap)
  ]);
  const homeScore = started ? numberValue(home?.score) : null;
  const awayScore = started ? numberValue(away?.score) : null;
  const homePenalty = numberValue(home?.shootoutScore || home?.score?.shootout);
  const awayPenalty = numberValue(away?.shootoutScore || away?.score?.shootout);
  const homeGoals = goalEvents.filter(item => item.team === homeCode).length;
  const awayGoals = goalEvents.filter(item => item.team === awayCode).length;
  return {
    number: null,
    eventId: event?.id || null,
    date: event?.date || competition?.date || "",
    homeCode,
    awayCode,
    homeScore,
    awayScore,
    homePenalty,
    awayPenalty,
    finished: completed,
    started,
    goalEvents,
    goalEventsComplete: homeScore !== null && awayScore !== null && homeGoals === homeScore && awayGoals === awayScore
  };
}

async function fetchEspnData() {
  const payload = await fetchJson(ESPN_SCOREBOARD_URL);
  const events = Array.isArray(payload?.events) ? payload.events : [];
  if (!events.length) throw new Error("A ESPN não retornou partidas.");
  const recentCompleted = events
    .filter(event => event?.status?.type?.completed)
    .sort((a,b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 12);
  const summaries = new Map();
  const results = await Promise.allSettled(recentCompleted.map(event => fetchJson(`${ESPN_SUMMARY_URL}${encodeURIComponent(event.id)}`, 12000)));
  results.forEach((result, index) => {
    if (result.status === "fulfilled") summaries.set(String(recentCompleted[index].id), result.value);
  });
  const matches = events.map(event => parseEspnEvent(event, summaries.get(String(event.id)))).filter(Boolean);
  return {provider:"ESPN World Cup JSON", matches};
}

function extractArray(payload, names = []) {
  if (Array.isArray(payload)) return payload;
  for (const name of names) if (Array.isArray(payload?.[name])) return payload[name];
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.response)) return payload.response;
  return [];
}

function parseCommunityScorers(value, teamCode, matchNumber) {
  if (!value) return [];
  const source = Array.isArray(value) ? value : String(value).replace(/^[{[]|[}\]]$/g, "").split(/\s*[,;|]\s*/);
  return source.flatMap((item, index) => {
    if (typeof item === "object" && item !== null) {
      const player = String(item.player || item.name || item.scorer || "").trim();
      if (!player) return [];
      return [{id:`community-${matchNumber}-${index}`,team:teamCode,player,minute:minuteValue(item.minute || item.time),type:/pen/i.test(String(item.type || ""))?"penalty":"goal"}];
    }
    const text = String(item || "").replace(/^['"]|['"]$/g, "").trim();
    const player = text.replace(/\(?\d{1,3}(?:\+\d{1,2})?['’]?\)?/g, "").trim();
    if (!player || player.split(/\s+/).length < 2) return [];
    return [{id:`community-${matchNumber}-${index}`,team:teamCode,player,minute:minuteValue(text),type:/pen/i.test(text)?"penalty":"goal"}];
  });
}

async function fetchCommunityData() {
  const [gamesPayload, teamsPayload] = await Promise.all([fetchJson(COMMUNITY_GAMES_URL), fetchJson(COMMUNITY_TEAMS_URL)]);
  const games = extractArray(gamesPayload,["games","matches","results"]);
  const teams = extractArray(teamsPayload,["teams","results"]);
  const teamMap = new Map(teams.map(item => [String(item.id ?? item._id ?? item.team_id), cleanCode(item.fifa_code || item.code || item.abbreviation)]));
  const matches = games.map(item => {
    const number = Number(item.id ?? item.match_id ?? item.number);
    const homeCode = cleanCode(item.home_code || item.home_fifa_code || teamMap.get(String(item.home_team_id ?? item.home_team?.id)));
    const awayCode = cleanCode(item.away_code || item.away_fifa_code || teamMap.get(String(item.away_team_id ?? item.away_team?.id)));
    const statusText = String(item.status || item.time_elapsed || "").toLowerCase();
    const finished = item.finished === true || /finished|complete|ended|ft/.test(statusText);
    const started = finished || !/notstarted|scheduled|upcoming/.test(statusText);
    const homeScore = started ? numberValue(item.home_score ?? item.home_goals ?? item.score?.home) : null;
    const awayScore = started ? numberValue(item.away_score ?? item.away_goals ?? item.score?.away) : null;
    const goalEvents = uniqueEvents([
      ...parseCommunityScorers(item.home_scorers ?? item.home_scorer, homeCode, number),
      ...parseCommunityScorers(item.away_scorers ?? item.away_scorer, awayCode, number)
    ]);
    return {
      number, date:item.date || "", homeCode, awayCode, homeScore, awayScore,
      homePenalty:numberValue(item.home_penalty_score ?? item.home_penalties),
      awayPenalty:numberValue(item.away_penalty_score ?? item.away_penalties),
      finished, started, goalEvents,
      goalEventsComplete: homeScore !== null && awayScore !== null && goalEvents.filter(event=>event.team===homeCode).length === homeScore && goalEvents.filter(event=>event.team===awayCode).length === awayScore
    };
  }).filter(item => item.homeCode && item.awayCode);
  if (!matches.length) throw new Error("A fonte comunitária não retornou partidas.");
  return {provider:"WorldCup26 Community API", matches};
}

exports.handler = async () => {
  const failures = [];
  let liveData = null;
  try {
    liveData = await fetchEspnData();
  } catch (error) {
    failures.push(`ESPN: ${error.message}`);
  }
  if (!liveData) {
    try {
      liveData = await fetchCommunityData();
    } catch (error) {
      failures.push(`Comunidade: ${error.message}`);
    }
  }
  return jsonResponse({
    ok:true,
    provider:liveData?.provider || "Snapshot verificado FIFA/ESPN",
    updatedAt:new Date().toISOString(),
    degraded:!liveData,
    warnings:failures,
    matches:liveData?.matches || [],
    scorers:OFFICIAL_SCORERS
  });
};
