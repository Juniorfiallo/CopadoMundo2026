const DEFAULT_GAMES_URL = "https://worldcup26.ir/get/games";
const DEFAULT_TEAMS_URL = "https://worldcup26.ir/get/teams";

const MANUAL_SCORER_OVERRIDES = Object.freeze({
  "83|POR": [
    { player: "Cristiano Ronaldo", minute: "", type: "penalty" },
    { player: "Gonçalo Ramos", minute: "90+4", type: "goal" }
  ]
});

const SCORER_NAME_ALIASES = Object.freeze({
  "k mbappe": "Kylian Mbappé",
  "kylian mbappe": "Kylian Mbappé",
  "l messi": "Lionel Messi",
  "lionel messi": "Lionel Messi",
  "e haaland": "Erling Haaland",
  "erling haaland": "Erling Haaland",
  "h kane": "Harry Kane",
  "harry kane": "Harry Kane",
  "o dembele": "Ousmane Dembélé",
  "ousmane dembele": "Ousmane Dembélé",
  "v junior": "Vinícius Júnior",
  "vinicius jr": "Vinícius Júnior",
  "vinicius junior": "Vinícius Júnior",
  "i sarr": "Ismaïla Sarr",
  "ismaila sarr": "Ismaïla Sarr",
  "d undav": "Deniz Undav",
  "deniz undav": "Deniz Undav",
  "j manzambi": "Johan Manzambi",
  "johan manzambi": "Johan Manzambi",
  "j quinones": "Julián Quiñones",
  "julian quinones": "Julián Quiñones",
  "m oyarzabal": "Mikel Oyarzabal",
  "mikel oyarzabal": "Mikel Oyarzabal",
  "gvnchalv ramvs": "Gonçalo Ramos",
  "goncalo ramos": "Gonçalo Ramos",
  "c ronaldo": "Cristiano Ronaldo",
  "cristiano ronaldo": "Cristiano Ronaldo"
});

function extractArray(payload, names = []) {
  if (Array.isArray(payload)) return payload;
  for (const name of names) {
    if (Array.isArray(payload?.[name])) return payload[name];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.response)) return payload.response;
  return [];
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (String(value).toLowerCase() === "null") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.trunc(number) : null;
}

function isTrue(value) {
  return value === true || value === 1 || ["true", "finished", "ft", "ended", "complete", "completed"].includes(String(value || "").toLowerCase());
}

function firstValue(object, keys) {
  for (const key of keys) {
    const value = key.split(".").reduce((current, part) => current?.[part], object);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function cleanTeamCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeNameKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function canonicalPlayerName(value) {
  const raw = String(value ?? "").trim();
  if (!raw || /[{}\[\]]/.test(raw) || /[;,|]/.test(raw) || /["“”]{2,}/.test(raw)) return "";
  const cleaned = raw
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/\s*\+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return SCORER_NAME_ALIASES[normalizeNameKey(cleaned)] || cleaned;
}

function isCompletePlayerName(value) {
  const name = String(value || "").trim();
  if (!name || name.length > 70 || /[{}\[\],;|]/.test(name)) return false;
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length < 2 || parts.length > 7) return false;
  if (parts.some(part => /^[\p{L}]\.?$/u.test(part))) return false;
  return parts.every(part => /^[\p{L}][\p{L}\p{M}'’.-]*$/u.test(part));
}

function explodeScorerValue(value) {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap(explodeScorerValue);
  if (typeof value === "object") {
    const direct = value.player ?? value.name ?? value.scorer ?? value.player_name;
    if (direct !== undefined && direct !== null) return [{...value, __playerValue: direct}];
    return Object.values(value).flatMap(explodeScorerValue);
  }

  const source = String(value).trim();
  if (!source || source.toLowerCase() === "null") return [];
  if (/^[\[{]/.test(source)) {
    try {
      const parsed = JSON.parse(source);
      if (parsed !== source) return explodeScorerValue(parsed);
    } catch (_) { /* PostgreSQL arrays are handled below. */ }
  }

  const quoted = [...source.matchAll(/"((?:\\.|[^"])*)"/g)]
    .map(match => match[1].replace(/\\"/g, '"').trim())
    .filter(Boolean);
  if (quoted.length) return quoted;

  const unwrapped = source.replace(/^\s*[{}\[\]]\s*|\s*[{}\[\]]\s*$/g, "").trim();
  if (!unwrapped) return [];
  if (/[;|]/.test(unwrapped)) return unwrapped.split(/\s*[;|]\s*/).filter(Boolean);
  if (source.startsWith("{") && unwrapped.includes(",")) return unwrapped.split(/\s*,\s*/).filter(Boolean);
  return [unwrapped];
}

function parseScorerToken(item, teamCode, matchNumber, index) {
  const rawValue = typeof item === "object" && item !== null
    ? (item.__playerValue ?? item.player ?? item.name ?? item.scorer ?? item.player_name)
    : item;
  const source = String(rawValue ?? "").trim();
  if (!source) return [];

  const minutes = [...source.matchAll(/(\d{1,3}(?:\+\d{1,2})?)\s*['’]?/g)].map(match => match[1]);
  const player = canonicalPlayerName(source
    .replace(/\(?\d{1,3}(?:\+\d{1,2})?\s*['’]?\)?/g, "")
    .replace(/[:\-–]+$/g, "")
    .replace(/\s*\+\s*$/g, "")
    .trim());
  if (!isCompletePlayerName(player)) return [];

  const objectMinute = typeof item === "object" && item !== null
    ? String(item.minute ?? item.time ?? item.elapsed ?? "").trim()
    : "";
  const eventMinutes = minutes.length ? minutes : [objectMinute];
  const type = typeof item === "object" && item !== null ? (item.type || "goal") : "goal";
  return eventMinutes.map((minute, minuteIndex) => ({
    id: `remote-${matchNumber}-${teamCode}-${index}-${minuteIndex}`,
    team: teamCode,
    player,
    minute: String(minute || "").trim(),
    type
  }));
}

function parseScorers(value, teamCode, matchNumber) {
  return explodeScorerValue(value)
    .flatMap((item, index) => parseScorerToken(item, teamCode, matchNumber, index));
}

function goalEventsAreComplete(events, homeCode, awayCode, homeScore, awayScore) {
  if (homeScore === null || awayScore === null) return false;
  const homeCount = events.filter(event => event.team === homeCode).length;
  const awayCount = events.filter(event => event.team === awayCode).length;
  return homeCount === homeScore && awayCount === awayScore;
}

async function fetchJson(url, headers) {
  const response = await fetch(url, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(18000)
  });
  if (!response.ok) throw new Error(`${url} respondeu ${response.status}`);
  return response.json();
}

exports.handler = async () => {
  const gamesUrl = process.env.WORLD_CUP_GAMES_URL || DEFAULT_GAMES_URL;
  const teamsUrl = process.env.WORLD_CUP_TEAMS_URL || DEFAULT_TEAMS_URL;
  const provider = process.env.WORLD_CUP_PROVIDER_NAME || "WorldCup26 Community API";
  const headers = { Accept: "application/json", "User-Agent": "Copa-2026-Painel-Premium/6.2" };
  const token = process.env.WORLD_CUP_API_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const [gamesPayload, teamsPayload] = await Promise.all([
      fetchJson(gamesUrl, headers),
      fetchJson(teamsUrl, headers)
    ]);

    const games = extractArray(gamesPayload, ["games", "matches", "results"]);
    const teams = extractArray(teamsPayload, ["teams", "results"]);
    const teamMap = new Map();

    teams.forEach(item => {
      const id = String(item.id ?? item._id ?? item.team_id ?? "");
      const code = cleanTeamCode(item.fifa_code || item.code || item.abbreviation || item.short_code);
      if (id && code) teamMap.set(id, code);
    });

    const matches = games.map(item => {
      const number = Number(item.id ?? item.match_id ?? item.number ?? item.match_number);
      const homeTeamId = firstValue(item, ["home_team_id", "home_team.id", "teams.home.id"]);
      const awayTeamId = firstValue(item, ["away_team_id", "away_team.id", "teams.away.id"]);
      const homeCode = cleanTeamCode(firstValue(item, ["home_code", "home_fifa_code", "home_team.fifa_code", "teams.home.code"]) || teamMap.get(String(homeTeamId)));
      const awayCode = cleanTeamCode(firstValue(item, ["away_code", "away_fifa_code", "away_team.fifa_code", "teams.away.code"]) || teamMap.get(String(awayTeamId)));
      const statusRaw = String(firstValue(item, ["time_elapsed", "status", "state", "match_status"]) || "").toLowerCase();
      const finished = isTrue(item.finished) || isTrue(statusRaw);
      const started = finished || !["", "notstarted", "scheduled", "upcoming", "not_started"].includes(statusRaw);
      const homeScore = started ? normalizeNumber(firstValue(item, ["home_score", "home_goals", "score.home", "scores.home"])) : null;
      const awayScore = started ? normalizeNumber(firstValue(item, ["away_score", "away_goals", "score.away", "scores.away"])) : null;
      const homePenalty = normalizeNumber(firstValue(item, ["home_penalty_score", "home_penalties", "penalties.home", "score.penalties.home"]));
      const awayPenalty = normalizeNumber(firstValue(item, ["away_penalty_score", "away_penalties", "penalties.away", "score.penalties.away"]));
      const homeScorers = firstValue(item, ["home_scorers", "home_scorer", "scorers.home", "goals.home"]);
      const awayScorers = firstValue(item, ["away_scorers", "away_scorer", "scorers.away", "goals.away"]);
      const goalEvents = [
        ...parseScorers(homeScorers, homeCode, number),
        ...parseScorers(awayScorers, awayCode, number),
        ...(MANUAL_SCORER_OVERRIDES[`${number}|${homeCode}`] || []).map((item, idx) => ({ id: `manual-${number}-${homeCode}-${idx}`, team: homeCode, player: item.player, minute: item.minute, type: item.type })),
        ...(MANUAL_SCORER_OVERRIDES[`${number}|${awayCode}`] || []).map((item, idx) => ({ id: `manual-${number}-${awayCode}-${idx}`, team: awayCode, player: item.player, minute: item.minute, type: item.type }))
      ];

      return {
        number,
        homeCode,
        awayCode,
        homeScore,
        awayScore,
        homePenalty,
        awayPenalty,
        finished,
        started,
        status: statusRaw,
        goalEvents,
        goalEventsComplete: goalEventsAreComplete(goalEvents, homeCode, awayCode, homeScore, awayScore)
      };
    }).filter(match => match.number >= 1 && match.number <= 104);

    if (!matches.length) throw new Error("Nenhuma partida válida foi encontrada na fonte configurada.");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        ok: true,
        provider,
        updatedAt: new Date().toISOString(),
        source: { gamesUrl, teamsUrl },
        matches
      })
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        ok: false,
        error: error.message,
        hint: "Confirme as URLs da API no Netlify ou troque para um provedor esportivo com cobertura de placares, eventos e artilharia."
      })
    };
  }
};
