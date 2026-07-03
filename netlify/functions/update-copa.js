const DEFAULT_GAMES_URL = "https://worldcup26.ir/get/games";
const DEFAULT_TEAMS_URL = "https://worldcup26.ir/get/teams";

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

function parseScorerString(value, teamCode, matchNumber) {
  if (!value || String(value).toLowerCase() === "null") return [];
  const source = String(value).trim();
  if (!source) return [];

  const pieces = source.split(/\s*[;|]\s*/).flatMap(piece => {
    if ((piece.match(/\d{1,3}(?:\+\d{1,2})?/g) || []).length <= 1) return [piece];
    const name = piece.split(/[:(]/)[0].trim();
    const minutes = piece.match(/\d{1,3}(?:\+\d{1,2})?/g) || [];
    return minutes.map(minute => `${name} ${minute}`);
  });

  return pieces.map((piece, index) => {
    const minuteMatch = piece.match(/(\d{1,3}(?:\+\d{1,2})?)\s*['’]?/);
    const minute = minuteMatch?.[1] || "";
    const player = piece
      .replace(/\(?\d{1,3}(?:\+\d{1,2})?\s*['’]?\)?/g, "")
      .replace(/[:\-–]+$/g, "")
      .trim();
    if (!player) return null;
    return {
      id: `remote-${matchNumber}-${teamCode}-${index}`,
      team: teamCode,
      player,
      minute,
      type: "goal"
    };
  }).filter(Boolean);
}

function parseScorers(value, teamCode, matchNumber) {
  if (!value || String(value).toLowerCase() === "null") return [];
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      if (typeof item === "string") return parseScorerString(item, teamCode, `${matchNumber}-${index}`)[0] || null;
      const player = item?.player || item?.name || item?.scorer || item?.player_name;
      if (!player) return null;
      return {
        id: item.id || `remote-${matchNumber}-${teamCode}-${index}`,
        team: teamCode,
        player: String(player),
        minute: String(item.minute ?? item.time ?? item.elapsed ?? ""),
        type: item.type || "goal"
      };
    }).filter(Boolean);
  }
  return parseScorerString(value, teamCode, matchNumber);
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
  const headers = { Accept: "application/json", "User-Agent": "Copa-2026-Painel-Premium/6.0" };
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
        goalEvents: [
          ...parseScorers(homeScorers, homeCode, number),
          ...parseScorers(awayScorers, awayCode, number)
        ]
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
