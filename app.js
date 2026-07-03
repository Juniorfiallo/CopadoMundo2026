(() => {
  "use strict";

  const STORAGE_KEY = "copa2026-tracker-v1";
  const baseData = window.COPA_DATA;
  const clone = (value) => typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

  const REMOTE_SCORER_PREFIX = "remote-scorer-";
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

  function canonicalPlayerName(value) {
    const raw = String(value ?? "").trim();
    if (!raw || /[{}\[\]]/.test(raw) || /[;,|]/.test(raw) || /["“”]{2,}/.test(raw)) return "";
    const cleaned = raw
      .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
      .replace(/\s*\+\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned) return "";
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

  function scorerKey(name, teamCode) {
    return `${normalizeNameKey(name)}|${String(teamCode || "").toUpperCase()}`;
  }

  function normalizeScorers(items) {
    const merged = new Map();
    const add = (item, index, fromSeed = false) => {
      const name = canonicalPlayerName(item?.name);
      const teamCode = String(item?.team || "").toUpperCase();
      if (!isCompletePlayerName(name) || !team(teamCode)) return;
      const key = scorerKey(name, teamCode);
      const candidate = {
        id: item?.id || `scorer-${teamCode || "team"}-${index + 1}`,
        name,
        team: teamCode,
        goals: safeNumber(item?.goals) ?? 0,
        image: item?.image || null
      };
      const current = merged.get(key);
      if (!current) {
        merged.set(key, candidate);
        return;
      }
      if (!fromSeed) {
        current.id = candidate.id;
        current.goals = candidate.goals;
        current.image = candidate.image || current.image;
      } else if (!current.image && candidate.image) {
        current.image = candidate.image;
      }
    };

    (baseData.topScorers || []).forEach((item, index) => add(item, index, true));
    (Array.isArray(items) ? items : []).forEach((item, index) => add(item, index, false));
    return [...merged.values()];
  }

  function normalizeGoalEvents(items) {
    const source = items && typeof items === "object" ? items : {};
    return Object.fromEntries(Object.entries(source).map(([matchId, events]) => [
      matchId,
      (Array.isArray(events) ? events : []).map((event, index) => {
        const player = canonicalPlayerName(event?.player);
        const teamCode = String(event?.team || "").toUpperCase();
        if (!isCompletePlayerName(player) || !team(teamCode)) return null;
        return {
          id: event.id || `goal-${matchId}-${index + 1}`,
          team: teamCode,
          player,
          minute: String(event.minute || "").trim(),
          type: event.type || "goal"
        };
      }).filter(Boolean)
    ]));
  }

  const state = {
    groupMatches: clone(baseData.groupMatches),
    knockoutMatches: clone(baseData.knockoutMatches),
    scorers: normalizeScorers(baseData.topScorers || []),
    goalEvents: normalizeGoalEvents(baseData.goalEvents || {})
  };

  applyManualMatchEventOverrides();

  let wasmWinner = null;
  let bracketZoom = Number(localStorage.getItem("copa2026-bracket-zoom-v2")) || 1;
  let bracketFitScale = 1;
  let scorerCarouselIndex = 0;
  let scorerCarouselTimer = null;
  let currentGoalMatchId = null;
  let deferredInstallPrompt = null;
  let syncingBracketScroll = false;
  const BRACKET_ZOOM_MIN = 0.4;
  const BRACKET_ZOOM_MAX = 2.5;
  const SCORER_CAROUSEL_INTERVAL = 5200;
  const LIVE_UPDATE_ENDPOINT = "/.netlify/functions/update-copa";
  const COMMUNITY_GAMES_URL = "https://worldcup26.ir/get/games";
  const COMMUNITY_TEAMS_URL = "https://worldcup26.ir/get/teams";

  const stageNames = {
    GROUP: "Fase de grupos",
    R32: "16-avos / Rodada de 32",
    R16: "Oitavas de final",
    QF: "Quartas de final",
    SF: "Semifinal",
    THIRD: "Terceiro lugar",
    FINAL: "Final"
  };

  const groupColors = {
    A:"#0b9b37", B:"#ef3c25", C:"#e5c300", D:"#075fd4", E:"#ff7100", F:"#31aa34",
    G:"#6755c7", H:"#20a79b", I:"#7a2ac6", J:"#dca46a", K:"#d7144e", L:"#9d1717"
  };

  const bracketSides = {
    left: {
      outer: ["m73","m75","m74","m77","m83","m84","m81","m82"],
      r16: ["m89","m90","m93","m94"],
      qf: ["m97","m98"],
      sf: ["m101"]
    },
    right: {
      sf: ["m102"],
      qf: ["m99","m100"],
      r16: ["m91","m92","m95","m96"],
      outer: ["m76","m78","m79","m80","m86","m88","m85","m87"]
    }
  };

  const scorerImageMap = {
    "ousmane dembele": "assets/scorer-ousmane-dembele.jpg",
    "deniz undav": "assets/scorer-deniz-undav.jpg",
    "erling haaland": "assets/scorer-erling-haaland.jpg",
    "harry kane": "assets/scorer-harry-kane.jpg",
    "ismaila sarr": "assets/scorer-ismaila-sarr.jpg",
    "johan manzambi": "assets/scorer-johan-manzambi.jpg",
    "julian quinones": "assets/scorer-julian-quinones.jpg",
    "mikel oyarzabal": "assets/scorer-mikel-oyarzabal.jpg",
    "kylian mbappe": "assets/scorer-kylian-mbappe.jpg",
    "lionel messi": "assets/scorer-lionel-messi.jpg",
    "vinicius junior": "assets/scorer-vinicius-junior.jpg"
  };

  function team(code) {
    return code ? baseData.teams[code] : null;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeNameKey(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function scorerImageFor(item) {
    return item?.image || scorerImageMap[normalizeNameKey(item?.name)] || null;
  }

  function sortedScorers() {
    return [...state.scorers].sort((a, b) =>
      (b.goals ?? 0) - (a.goals ?? 0)
      || String(a.name).localeCompare(String(b.name), "pt-BR")
    );
  }

  function carouselScorers() {
    const activeTeams = getActiveTeamCodes();
    const withImages = sortedScorers().map((item, index) => ({ item, index })).filter(({ item }) => scorerImageFor(item));
    return withImages.sort((a, b) =>
      Number(activeTeams.has(b.item.team)) - Number(activeTeams.has(a.item.team))
      || (b.item.goals ?? 0) - (a.item.goals ?? 0)
      || a.index - b.index
    ).map(({ item }) => item).slice(0, 10);
  }

  function safeNumber(value) {
    if (value === "" || value === null || typeof value === "undefined") return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
  }

  function formatDate(iso, includeWeekday = true) {
    if (!iso) return "Data a definir";
    const [year, month, day] = iso.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "2-digit",
      ...(includeWeekday ? { weekday: "short" } : {})
    }).format(date).replace(".", "");
  }

  function dateTimeValue(match) {
    return `${match.date || "9999-12-31"}T${match.time || "23:59"}`;
  }

  function matchIsComplete(match) {
    if (match.hg === null || match.ag === null) return false;
    if (match.stage === "GROUP") return true;
    if (match.hg !== match.ag) return true;
    return match.hp !== null && match.ap !== null && match.hp !== match.ap;
  }

  function jsDetermineWinner(hg, ag, hp, ap) {
    if (hg > ag) return 1;
    if (ag > hg) return 2;
    if (hp === null || ap === null || hp === ap) return 0;
    return hp > ap ? 1 : 2;
  }

  function determineWinnerSide(match) {
    if (!match || !match.home || !match.away || match.hg === null || match.ag === null) return 0;
    const hp = match.hp === null ? -1 : match.hp;
    const ap = match.ap === null ? -1 : match.ap;
    if (wasmWinner) {
      try { return wasmWinner(match.hg, match.ag, hp, ap); } catch (_) { /* fallback below */ }
    }
    return jsDetermineWinner(match.hg, match.ag, match.hp, match.ap);
  }

  function getWinner(match) {
    const side = determineWinnerSide(match);
    return side === 1 ? match.home : side === 2 ? match.away : null;
  }

  function getLoser(match) {
    const side = determineWinnerSide(match);
    return side === 1 ? match.away : side === 2 ? match.home : null;
  }

  function knockoutMap() {
    return new Map(state.knockoutMatches.map(match => [match.id, match]));
  }

  function clearMatchResult(match) {
    match.hg = null;
    match.ag = null;
    match.hp = null;
    match.ap = null;
    state.goalEvents[match.id] = [];
    delete match.note;
  }

  function propagateBracket() {
    const map = knockoutMap();
    for (const match of state.knockoutMatches) {
      let nextHome = match.home;
      let nextAway = match.away;

      if (match.fromHome) nextHome = getWinner(map.get(match.fromHome));
      if (match.fromAway) nextAway = getWinner(map.get(match.fromAway));
      if (match.loserHome) nextHome = getLoser(map.get(match.loserHome));
      if (match.loserAway) nextAway = getLoser(map.get(match.loserAway));

      const homeChanged = match.home !== nextHome;
      const awayChanged = match.away !== nextAway;
      if (homeChanged || awayChanged) {
        const hadParticipants = Boolean(match.home || match.away);
        match.home = nextHome || null;
        match.away = nextAway || null;
        if (hadParticipants) clearMatchResult(match);
      }
    }
  }

  function savedStructureIsCompatible(saved) {
    if (!Array.isArray(saved?.groupMatches) || !Array.isArray(saved?.knockoutMatches)) return true;
    const groupMap = new Map(saved.groupMatches.map(match => [match.id, match]));
    const knockoutMapSaved = new Map(saved.knockoutMatches.map(match => [match.id, match]));

    const groupStructureOk = baseData.groupMatches.every(baseMatch => {
      const stored = groupMap.get(baseMatch.id);
      return !stored || (
        stored.group === baseMatch.group
        && stored.home === baseMatch.home
        && stored.away === baseMatch.away
      );
    });

    const fixedKnockoutStructureOk = baseData.knockoutMatches
      .filter(match => Number(match.id.slice(1)) <= 88)
      .every(baseMatch => {
        const stored = knockoutMapSaved.get(baseMatch.id);
        return !stored || (stored.home === baseMatch.home && stored.away === baseMatch.away);
      });

    return groupStructureOk && fixedKnockoutStructureOk;
  }

  function restoreMatchesFromSaved(saved) {
    const groupMap = new Map((saved.groupMatches || []).map(match => [match.id, match]));
    const knockoutMapSaved = new Map((saved.knockoutMatches || []).map(match => [match.id, match]));

    state.groupMatches = baseData.groupMatches.map(baseMatch => {
      const stored = groupMap.get(baseMatch.id) || {};
      return {
        ...clone(baseMatch),
        hg: stored.hg === undefined ? baseMatch.hg : safeNumber(stored.hg),
        ag: stored.ag === undefined ? baseMatch.ag : safeNumber(stored.ag)
      };
    });

    state.knockoutMatches = baseData.knockoutMatches.map(baseMatch => {
      const stored = knockoutMapSaved.get(baseMatch.id) || {};
      return {
        ...clone(baseMatch),
        hg: stored.hg === undefined ? baseMatch.hg : safeNumber(stored.hg),
        ag: stored.ag === undefined ? baseMatch.ag : safeNumber(stored.ag),
        hp: stored.hp === undefined ? baseMatch.hp : safeNumber(stored.hp),
        ap: stored.ap === undefined ? baseMatch.ap : safeNumber(stored.ap),
        ...(stored.note ? { note: String(stored.note) } : {})
      };
    });
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (!savedStructureIsCompatible(saved)) {
        console.warn("Dados locais incompatíveis foram reparados automaticamente.");
        localStorage.removeItem(STORAGE_KEY);
        state.groupMatches = clone(baseData.groupMatches);
        state.knockoutMatches = clone(baseData.knockoutMatches);
        state.scorers = normalizeScorers(baseData.topScorers || []);
        state.goalEvents = normalizeGoalEvents(baseData.goalEvents || {});
      applyManualMatchEventOverrides();
        return;
      }

      restoreMatchesFromSaved(saved);
      const isLegacyScorerData = Number(saved.version || 0) < 6.2;
      if (Array.isArray(saved.scorers)) {
        const scorerSource = isLegacyScorerData
          ? saved.scorers.filter(item => !String(item?.id || "").startsWith(REMOTE_SCORER_PREFIX))
          : saved.scorers;
        state.scorers = normalizeScorers(scorerSource);
      }
      if (saved.goalEvents && typeof saved.goalEvents === "object") {
        state.goalEvents = isLegacyScorerData
          ? normalizeGoalEvents(baseData.goalEvents || {})
          : normalizeGoalEvents(saved.goalEvents);
      }
      if (isLegacyScorerData) {
        updateScorersFromGoalEvents();
        saveState();
        console.warn("A artilharia e os eventos antigos foram higienizados automaticamente para remover agregados inválidos.");
      }
    } catch (error) {
      console.warn("Não foi possível carregar o backup local.", error);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 6.2,
      savedAt: new Date().toISOString(),
      groupMatches: state.groupMatches,
      knockoutMatches: state.knockoutMatches,
      scorers: state.scorers,
      goalEvents: state.goalEvents
    }));
    const now = new Intl.DateTimeFormat("pt-BR", { hour:"2-digit", minute:"2-digit", second:"2-digit" }).format(new Date());
    document.getElementById("saveStatus").textContent = `Salvo às ${now}`;
  }

  function teamLabel(code, pending = "Aguardando vencedor") {
    const item = team(code);
    if (!item) return `<span class="team-label"><span class="flag">◌</span><span class="name">${pending}</span></span>`;
    return `<span class="team-label"><span class="flag">${item.flag}</span><span class="name">${item.name}</span></span>`;
  }

  function scoreInput(match, field, kind, disabled = false, extraClass = "score-input") {
    const value = match[field] === null ? "" : match[field];
    return `<input class="${extraClass}" type="number" min="0" max="30" inputmode="numeric" value="${value}"
      aria-label="${field}" data-kind="${kind}" data-id="${match.id}" data-field="${field}" ${disabled ? "disabled" : ""} />`;
  }

  function calculateStandings(group) {
    const rows = new Map(baseData.groups[group].map(code => [code, {
      code, j:0, v:0, e:0, d:0, gp:0, gc:0, sg:0, pts:0
    }]));

    state.groupMatches.filter(match => match.group === group).forEach(match => {
      if (match.hg === null || match.ag === null) return;
      const home = rows.get(match.home);
      const away = rows.get(match.away);
      if (!home || !away) {
        console.warn(`Partida ${match.id} ignorada na tabela do Grupo ${group}: participantes incompatíveis.`);
        return;
      }
      home.j++; away.j++;
      home.gp += match.hg; home.gc += match.ag;
      away.gp += match.ag; away.gc += match.hg;
      if (match.hg > match.ag) { home.v++; away.d++; home.pts += 3; }
      else if (match.ag > match.hg) { away.v++; home.d++; away.pts += 3; }
      else { home.e++; away.e++; home.pts++; away.pts++; }
    });

    rows.forEach(row => row.sg = row.gp - row.gc);
    return [...rows.values()].sort((a,b) =>
      b.pts - a.pts || b.sg - a.sg || b.gp - a.gp || team(a.code).name.localeCompare(team(b.code).name, "pt-BR")
    );
  }

  function renderStandings(group) {
    const standings = calculateStandings(group);
    return `<div class="standings-wrap"><table class="standings">
      <thead><tr><th>#</th><th>Seleção</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th></tr></thead>
      <tbody>${standings.map((row,index) => `<tr class="${index < 2 ? "qualifier" : index === 2 ? "third" : ""}">
        <td class="pos">${index+1}</td><td>${teamLabel(row.code)}</td><td>${row.j}</td><td>${row.v}</td><td>${row.e}</td><td>${row.d}</td>
        <td>${row.gp}</td><td>${row.gc}</td><td>${row.sg > 0 ? "+" : ""}${row.sg}</td><td><strong>${row.pts}</strong></td>
      </tr>`).join("")}</tbody>
    </table></div>`;
  }

  function renderGroupMatch(match) {
    return `<div class="group-match">
      <div class="group-match__date">${formatDate(match.date)} • Grupo ${match.group}</div>
      <div class="score-line">
        ${teamLabel(match.home)}
        ${scoreInput(match,"hg","group")}
        <span class="score-sep">×</span>
        ${scoreInput(match,"ag","group")}
        ${teamLabel(match.away)}
      </div>
    </div>`;
  }

  function renderGroups() {
    const container = document.getElementById("groupsGrid");
    container.innerHTML = Object.keys(baseData.groups).map(group => {
      const matches = state.groupMatches.filter(match => match.group === group).sort((a,b) => a.date.localeCompare(b.date));
      return `<article class="group-card" style="--group-color:${groupColors[group]}">
        <header class="group-card__head"><span class="group-letter">${group}</span><div><h3>Grupo ${group}</h3><small>6 partidas</small></div></header>
        ${renderStandings(group)}
        <div class="group-matches">${matches.map(renderGroupMatch).join("")}</div>
      </article>`;
    }).join("");
  }

  function renderPenalties(match, kind) {
    const tied = match.hg !== null && match.ag !== null && match.hg === match.ag && match.home && match.away;
    if (!tied) return "";
    const homeName = team(match.home).name;
    const awayName = team(match.away).name;
    return `<div class="penalties">
      <label><span>Pênaltis ${homeName}</span>${scoreInput(match,"hp",kind,false,"penalty-input")}</label>
      <span class="score-sep">×</span>
      <label>${scoreInput(match,"ap",kind,false,"penalty-input")}<span>${awayName}</span></label>
    </div>`;
  }

  function goalMinuteValue(minute) {
    const value = String(minute || "0");
    const [base, extra] = value.split("+").map(part => Number(part.replace(/\D/g, "")) || 0);
    return base + extra / 100;
  }

  function goalEventsFor(matchId, teamCode) {
    return (state.goalEvents[matchId] || [])
      .filter(event => event.team === teamCode)
      .sort((a, b) => goalMinuteValue(a.minute) - goalMinuteValue(b.minute));
  }

  function applyManualMatchEventOverrides() {
    Object.entries(MANUAL_MATCH_EVENT_OVERRIDES).forEach(([matchId, events]) => {
      const normalized = normalizeGoalEvents({ [matchId]: events })[matchId] || [];
      const existing = Array.isArray(state.goalEvents[matchId]) ? state.goalEvents[matchId] : [];
      const preserved = existing.filter(event => !normalized.some(item => scorerKey(item.player, item.team) === scorerKey(event.player, event.team) && String(item.minute || "") === String(event.minute || "")));
      state.goalEvents[matchId] = normalizeGoalEvents({ [matchId]: [...preserved, ...normalized] })[matchId] || [];
    });
  }

  function renderGoalTooltip(match, teamCode) {
    if (!teamCode) return "";
    const events = goalEventsFor(match.id, teamCode);
    const score = teamCode === match.home ? match.hg : match.ag;
    const selection = team(teamCode);
    const content = events.length
      ? `<ul>${events.map(event => `<li><span>⚽ ${escapeHtml(event.player)}${event.type === "penalty" ? " (pên.)" : ""}</span>${event.minute ? `<strong>${escapeHtml(event.minute)}'</strong>` : ""}</li>`).join("")}</ul>`
      : `<p>${score === 0 ? "Não marcou gols nesta partida." : "Autores dos gols ainda não cadastrados."}</p>`;
    const shootout = match.hg !== null && match.ag !== null && match.hg === match.ag && match.hp !== null && match.ap !== null
      ? `<small>Decisão nos pênaltis: ${match.hp} × ${match.ap}</small>`
      : "";
    return `<div class="goal-tooltip" role="tooltip">
      <div class="goal-tooltip__title"><span>${selection?.flag || "⚽"}</span><strong>${escapeHtml(selection?.name || teamCode)}</strong></div>
      ${content}
      <small>${events.length} ${events.length === 1 ? "gol cadastrado" : "gols cadastrados"}</small>
      ${shootout}
    </div>`;
  }

  function renderKnockoutCard(match) {
    const winner = getWinner(match);
    const loser = getLoser(match);
    const disabled = !match.home || !match.away;
    const homeClass = !match.home ? "is-pending" : winner === match.home ? "is-winner" : loser === match.home ? "is-loser" : "";
    const awayClass = !match.away ? "is-pending" : winner === match.away ? "is-winner" : loser === match.away ? "is-loser" : "";
    const canEditGoals = Boolean(match.home && match.away);
    return `<article class="knockout-card" data-match-card="${match.id}">
      <div class="knockout-card__meta">
        <span>${match.id.toUpperCase()}</span>
        <div class="knockout-card__meta-actions">
          <span>${formatDate(match.date)} • ${match.time || "a definir"}</span>
          <button class="goal-editor-button" type="button" data-goal-editor="${match.id}" ${canEditGoals ? "" : "disabled"} aria-label="Editar autores dos gols da partida ${match.id.toUpperCase()}">⚽</button>
        </div>
      </div>
      <div class="ko-team-row has-goal-tooltip ${homeClass}" ${match.home ? `tabindex="0" data-goal-match="${match.id}" data-goal-team="${match.home}"` : ""}>${teamLabel(match.home)}${scoreInput(match,"hg","knockout",disabled)}${renderGoalTooltip(match, match.home)}</div>
      <div class="ko-team-row has-goal-tooltip ${awayClass}" ${match.away ? `tabindex="0" data-goal-match="${match.id}" data-goal-team="${match.away}"` : ""}>${teamLabel(match.away)}${scoreInput(match,"ag","knockout",disabled)}${renderGoalTooltip(match, match.away)}</div>
      ${renderPenalties(match,"knockout")}
      ${match.note ? `<div class="ko-note">${match.note}</div>` : ""}
    </article>`;
  }

  function renderRoundColumn(title, ids, extraClass = "") {
    const map = knockoutMap();
    return `<section class="round-column">
      <div class="round-title">${title}</div>
      <div class="round-match-stack ${extraClass}">${ids.map(id => renderKnockoutCard(map.get(id))).join("")}</div>
    </section>`;
  }

  function renderBracket() {
    const map = knockoutMap();
    const final = map.get("m104");
    const championCode = getWinner(final);
    const championText = championCode ? `${team(championCode).flag} ${team(championCode).name}` : "Campeão a definir";
    const finalistText = final.home && final.away ? `${team(final.home).name} × ${team(final.away).name}` : "Final aguardando classificados";

    document.getElementById("bracket").innerHTML = `<div class="bracket-zoom-canvas"><div class="bracket-premium">
      <div class="bracket-half bracket-half--left">
        ${renderRoundColumn("16-avos", bracketSides.left.outer, "round-column--space-r32")}
        ${renderRoundColumn("Oitavas", bracketSides.left.r16, "round-column--space-r16")}
        ${renderRoundColumn("Quartas", bracketSides.left.qf, "round-column--space-qf")}
        ${renderRoundColumn("Semifinal", bracketSides.left.sf, "round-column--space-sf")}
      </div>
      <div class="bracket-center">
        <div class="final-showcase">
          <div class="final-showcase__head">
            <p class="eyebrow">CENTRO DA CHAVE</p>
            <h3>Grande final</h3>
            <p>${formatDate(final.date)} • ${final.time}</p>
          </div>
          <div class="final-showcase__body">
            ${renderKnockoutCard(final)}
            <img class="final-logo" src="assets/logo-oficial.png" alt="Logo da Copa do Mundo 2026" />
            <div class="champion-card">
              <h4>Campeão</h4>
              <div class="champion-card__name">🏆 <span>${championText}</span></div>
              <div class="champion-card__sub">${championCode ? "Título definido automaticamente a partir do placar da final." : finalistText}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="bracket-half bracket-half--right">
        ${renderRoundColumn("Semifinal", bracketSides.right.sf, "round-column--space-sf")}
        ${renderRoundColumn("Quartas", bracketSides.right.qf, "round-column--space-qf")}
        ${renderRoundColumn("Oitavas", bracketSides.right.r16, "round-column--space-r16")}
        ${renderRoundColumn("16-avos", bracketSides.right.outer, "round-column--space-r32")}
      </div>
    </div></div>`;

    requestAnimationFrame(applyBracketZoom);
    const third = map.get("m103");
    document.getElementById("thirdPlace").innerHTML = `<h3>Disputa pelo terceiro lugar</h3>${renderKnockoutCard(third)}`;
  }

  function clampZoom(value) {
    return Math.min(BRACKET_ZOOM_MAX, Math.max(BRACKET_ZOOM_MIN, Number(value) || 1));
  }

  function calculateBracketFitScale() {
    const viewport = document.getElementById("bracket");
    const board = document.querySelector(".bracket-premium");
    if (!viewport || !board || viewport.clientWidth === 0 || board.offsetWidth === 0) return bracketFitScale || 1;
    const availableWidth = Math.max(1, viewport.clientWidth - 48);
    const availableHeight = Math.max(1, viewport.clientHeight - 48);
    bracketFitScale = Math.min(availableWidth / board.offsetWidth, availableHeight / board.offsetHeight);
    return bracketFitScale;
  }

  function updateBracketScrollTrack() {
    const viewport = document.getElementById("bracket");
    const canvas = document.querySelector(".bracket-zoom-canvas");
    const topScroll = document.getElementById("bracketHScroll");
    const track = document.getElementById("bracketHScrollTrack");
    if (!viewport || !canvas || !topScroll || !track) return;
    track.style.width = `${Math.max(viewport.clientWidth, canvas.offsetWidth)}px`;
    if (!syncingBracketScroll) {
      syncingBracketScroll = true;
      topScroll.scrollLeft = viewport.scrollLeft;
      requestAnimationFrame(() => { syncingBracketScroll = false; });
    }
  }

  function centerBracketViewport(behavior = "auto") {
    const viewport = document.getElementById("bracket");
    const canvas = document.querySelector(".bracket-zoom-canvas");
    if (!viewport || !canvas) return;
    const left = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
    const top = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2);
    viewport.scrollTo({ left, top, behavior });
    requestAnimationFrame(updateBracketScrollTrack);
  }

  function applyBracketZoom(recenter = true) {
    const viewport = document.getElementById("bracket");
    const board = document.querySelector(".bracket-premium");
    const canvas = document.querySelector(".bracket-zoom-canvas");
    if (!viewport || !board || !canvas || board.offsetWidth === 0 || viewport.clientWidth === 0) return;
    bracketZoom = clampZoom(bracketZoom);
    calculateBracketFitScale();
    const actualScale = bracketFitScale * bracketZoom;
    const scaledWidth = Math.ceil(board.offsetWidth * actualScale);
    const scaledHeight = Math.ceil(board.offsetHeight * actualScale);
    const canvasWidth = Math.max(viewport.clientWidth, scaledWidth + 48);
    const canvasHeight = Math.max(viewport.clientHeight, scaledHeight + 48);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    board.style.transform = `scale(${actualScale})`;
    board.style.left = `${Math.max(24, (canvasWidth - scaledWidth) / 2)}px`;
    board.style.top = `${Math.max(24, (canvasHeight - scaledHeight) / 2)}px`;
    const percent = Math.round(bracketZoom * 100);
    const label = document.getElementById("zoomLabel");
    const range = document.getElementById("bracketZoomRange");
    if (label) label.textContent = `${percent}%`;
    if (range) range.value = String(percent);
    localStorage.setItem("copa2026-bracket-zoom-v2", String(bracketZoom));
    updateBracketScrollTrack();
    if (recenter) requestAnimationFrame(() => requestAnimationFrame(() => centerBracketViewport("auto")));
  }

  function setBracketZoom(value, recenter = true) {
    bracketZoom = clampZoom(value);
    applyBracketZoom(recenter);
  }

  function fitBracketZoom() {
    setBracketZoom(1, true);
  }

  function knockoutMatchNumber(match) {
    const raw = String(match?.id || "").replace(/\D/g, "");
    return Number(raw) || 0;
  }

  function printableScore(match) {
    if (!match || match.hg === null || match.ag === null) return "—";
    const homePen = match.hg === match.ag && match.hp !== null ? ` (${match.hp})` : "";
    const awayPen = match.hg === match.ag && match.ap !== null ? ` (${match.ap})` : "";
    return `${match.hg}${homePen} × ${match.ag}${awayPen}`;
  }

  function renderPosterMatch(match) {
    const home = team(match.home);
    const away = team(match.away);
    return `<article class="poster-match">
      <div class="poster-match__meta"><span>M${knockoutMatchNumber(match)}</span><span>${formatDate(match.date)} • ${match.time || "a definir"}</span></div>
      <div class="poster-team"><span>${home?.flag || "◌"}</span><strong>${escapeHtml(home?.name || "Aguardando vencedor")}</strong><b>${match.hg ?? "–"}${match.hg === match.ag && match.hp !== null ? ` (${match.hp})` : ""}</b></div>
      <div class="poster-team"><span>${away?.flag || "◌"}</span><strong>${escapeHtml(away?.name || "Aguardando vencedor")}</strong><b>${match.ag ?? "–"}${match.hg === match.ag && match.ap !== null ? ` (${match.ap})` : ""}</b></div>
    </article>`;
  }

  function renderPrintPoster() {
    const poster = document.getElementById("printPoster");
    if (!poster) return;
    const stages = [
      ["16-avos", "R32"],
      ["Oitavas", "R16"],
      ["Quartas", "QF"],
      ["Semifinais", "SF"],
      ["Terceiro lugar", "THIRD"],
      ["Final", "FINAL"]
    ];
    const final = state.knockoutMatches.find(match => match.stage === "FINAL");
    const champion = getWinner(final);
    poster.innerHTML = `<div class="poster-shell">
      <header class="poster-header">
        <img src="assets/logo-oficial.png" alt="Logo Copa 2026" />
        <div><p>WE ARE 26</p><h1>FIFA WORLD CUP 2026</h1><span>Mata-mata completo • placares, bandeiras e campeão</span></div>
        <img src="assets/bola-oficial.png" alt="Bola oficial" />
      </header>
      <div class="poster-stage-grid">
        ${stages.map(([title, stage]) => `<section class="poster-stage poster-stage--${stage.toLowerCase()}"><h2>${title}</h2><div>${state.knockoutMatches.filter(match => match.stage === stage).sort((a,b) => knockoutMatchNumber(a)-knockoutMatchNumber(b)).map(renderPosterMatch).join("")}</div></section>`).join("")}
      </div>
      <footer class="poster-footer">
        <img src="assets/we-are-26.png" alt="We Are 26" />
        <div><small>CAMPEÃO</small><strong>${champion ? `${team(champion)?.flag || ""} ${escapeHtml(team(champion)?.name || champion)}` : "A definir"}</strong><span>Atualizado em ${new Intl.DateTimeFormat("pt-BR", {dateStyle:"medium", timeStyle:"short"}).format(new Date())}</span></div>
        <div class="poster-footer__brand">🏆 COPA 2026</div>
      </footer>
    </div>`;
  }

  function printBracketPoster(format) {
    renderPrintPoster();
    const normalized = format === "A3" ? "A3" : "A4";
    let pageStyle = document.getElementById("dynamicPrintPageStyle");
    if (!pageStyle) {
      pageStyle = document.createElement("style");
      pageStyle.id = "dynamicPrintPageStyle";
      document.head.appendChild(pageStyle);
    }
    pageStyle.textContent = `@page { size: ${normalized} landscape; margin: 7mm; }`;
    document.body.dataset.printFormat = normalized.toLowerCase();
    document.getElementById("printPoster")?.setAttribute("aria-hidden", "false");
    window.setTimeout(() => window.print(), 120);
  }

  function extractRemoteArray(payload, names = []) {
    if (Array.isArray(payload)) return payload;
    for (const name of names) if (Array.isArray(payload?.[name])) return payload[name];
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.response)) return payload.response;
    return [];
  }

  function truthyRemote(value) {
    return value === true || value === 1 || ["true","finished","ft","ended","complete","completed"].includes(String(value || "").toLowerCase());
  }

  function normalizeRemoteScore(value) {
    if (value === null || value === undefined || value === "" || String(value).toLowerCase() === "null") return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
  }

  function explodeRemoteScorerValue(value) {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value.flatMap(explodeRemoteScorerValue);
    if (typeof value === "object") {
      const direct = value.player ?? value.name ?? value.scorer ?? value.player_name;
      if (direct !== undefined && direct !== null) return [{...value, __playerValue: direct}];
      return Object.values(value).flatMap(explodeRemoteScorerValue);
    }

    const source = String(value).trim();
    if (!source || source.toLowerCase() === "null") return [];

    if (/^[\[{]/.test(source)) {
      try {
        const parsed = JSON.parse(source);
        if (parsed !== source) return explodeRemoteScorerValue(parsed);
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

  function parseRemoteScorerToken(item, teamCode, matchId, index) {
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
    const eventType = typeof item === "object" && item !== null ? (item.type || "goal") : "goal";
    const objectMinute = typeof item === "object" && item !== null
      ? String(item.minute ?? item.time ?? item.elapsed ?? "").trim()
      : "";
    const eventMinutes = minutes.length ? minutes : [objectMinute];
    return eventMinutes.map((minute, minuteIndex) => ({
      id: `remote-${matchId}-${teamCode}-${index}-${minuteIndex}`,
      team: teamCode,
      player,
      minute: String(minute || "").trim(),
      type: eventType
    }));
  }

  function parseRemoteScorers(value, teamCode, matchId) {
    return explodeRemoteScorerValue(value)
      .flatMap((item, index) => parseRemoteScorerToken(item, teamCode, matchId, index));
  }

  function remoteGoalEventsAreComplete(events, homeCode, awayCode, homeScore, awayScore) {
    if (homeScore === null || awayScore === null) return false;
    const homeCount = events.filter(event => event.team === homeCode).length;
    const awayCount = events.filter(event => event.team === awayCode).length;
    return homeCount === homeScore && awayCount === awayScore;
  }

  async function fetchCommunityDataDirect() {
    const [gamesResponse, teamsResponse] = await Promise.all([
      fetch(COMMUNITY_GAMES_URL, {cache:"no-store"}),
      fetch(COMMUNITY_TEAMS_URL, {cache:"no-store"})
    ]);
    if (!gamesResponse.ok || !teamsResponse.ok) throw new Error("A fonte comunitária não respondeu.");
    const gamesPayload = await gamesResponse.json();
    const teamsPayload = await teamsResponse.json();
    const teams = extractRemoteArray(teamsPayload, ["teams","results"]);
    const games = extractRemoteArray(gamesPayload, ["games","matches","results"]);
    const teamMap = new Map(teams.map(item => [String(item.id ?? item._id ?? item.team_id), String(item.fifa_code || item.code || item.abbreviation || "").toUpperCase()]));
    const matches = games.map(item => {
      const number = Number(item.id ?? item.match_id ?? item.number);
      const homeCode = String(item.home_code || item.home_fifa_code || teamMap.get(String(item.home_team_id ?? item.home_team?.id)) || "").toUpperCase();
      const awayCode = String(item.away_code || item.away_fifa_code || teamMap.get(String(item.away_team_id ?? item.away_team?.id)) || "").toUpperCase();
      const finished = truthyRemote(item.finished) || truthyRemote(item.status) || String(item.time_elapsed || "").toLowerCase() === "finished";
      const started = finished || !["notstarted","scheduled","upcoming",""] .includes(String(item.time_elapsed || item.status || "").toLowerCase());
      const homeScore = started ? normalizeRemoteScore(item.home_score ?? item.home_goals ?? item.score?.home) : null;
      const awayScore = started ? normalizeRemoteScore(item.away_score ?? item.away_goals ?? item.score?.away) : null;
      const goalEvents = [
        ...parseRemoteScorers(item.home_scorers ?? item.home_scorer, homeCode, number),
        ...parseRemoteScorers(item.away_scorers ?? item.away_scorer, awayCode, number)
      ];
      const goalEventsComplete = remoteGoalEventsAreComplete(goalEvents, homeCode, awayCode, homeScore, awayScore);
      return {number, homeCode, awayCode, homeScore, awayScore, homePenalty:normalizeRemoteScore(item.home_penalty_score ?? item.home_penalties), awayPenalty:normalizeRemoteScore(item.away_penalty_score ?? item.away_penalties), finished, started, goalEvents, goalEventsComplete};
    }).filter(item => item.number >= 1 && item.number <= 104);
    return {ok:true, provider:"WorldCup26 Community API", updatedAt:new Date().toISOString(), matches};
  }

  function updateScorersFromGoalEvents() {
    const counts = new Map();
    Object.values(state.goalEvents).flat().forEach(event => {
      const player = canonicalPlayerName(event?.player);
      const teamCode = String(event?.team || "").toUpperCase();
      if (!isCompletePlayerName(player) || !team(teamCode)) return;
      const key = scorerKey(player, teamCode);
      const entry = counts.get(key) || {name: player, team: teamCode, goals: 0};
      entry.goals += 1;
      counts.set(key, entry);
    });

    applyManualMatchEventOverrides();

    const preserved = normalizeScorers(state.scorers.filter(item => !String(item.id || "").startsWith(REMOTE_SCORER_PREFIX)));
    const existing = new Map(preserved.map(item => [scorerKey(item.name, item.team), item]));

    counts.forEach((entry, key) => {
      const current = existing.get(key);
      if (current) {
        current.goals = Math.max(safeNumber(current.goals) ?? 0, entry.goals);
        return;
      }
      const scorer = {
        id: `${REMOTE_SCORER_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...entry,
        image: null
      };
      preserved.push(scorer);
      existing.set(key, scorer);
    });

    state.scorers = normalizeScorers(preserved);
  }

  function findRemoteMatchTarget(remote) {
    const number = Number(remote.number);
    const collection = number <= 72 ? state.groupMatches : state.knockoutMatches;
    const homeCode = String(remote.homeCode || "").toUpperCase();
    const awayCode = String(remote.awayCode || "").toUpperCase();
    const hasValidPair = Boolean(homeCode && awayCode && team(homeCode) && team(awayCode));

    if (hasValidPair) {
      const exact = collection.find(match => match.home === homeCode && match.away === awayCode);
      if (exact) return { local: exact, reversed: false };
      const reversed = collection.find(match => match.home === awayCode && match.away === homeCode);
      if (reversed) return { local: reversed, reversed: true };
    }

    // Nunca associa fase de grupos apenas pelo número: fontes diferentes podem
    // ordenar as 72 partidas de maneiras distintas.
    if (number <= 72) return null;

    const numbered = collection.find(match => match.id === `m${number}`);
    if (!numbered || !hasValidPair) return null;

    // Para fases ainda não montadas, aceita o número somente quando os dois
    // participantes ainda estão vazios. As fases anteriores são processadas
    // antes, então normalmente o pareamento exato já terá sido encontrado.
    if (!numbered.home && !numbered.away && number > 88) {
      numbered.home = homeCode;
      numbered.away = awayCode;
      return { local: numbered, reversed: false };
    }

    return null;
  }

  function applyRemoteMatch(remote) {
    const target = findRemoteMatchTarget(remote);
    if (!target) return { matched: 0, changed: 0 };

    const { local, reversed } = target;
    let changed = 0;
    if (remote.started || remote.finished) {
      const remoteHomeScore = normalizeRemoteScore(remote.homeScore);
      const remoteAwayScore = normalizeRemoteScore(remote.awayScore);
      const hg = reversed ? remoteAwayScore : remoteHomeScore;
      const ag = reversed ? remoteHomeScore : remoteAwayScore;

      if (hg !== null && ag !== null) {
        if (local.hg !== hg || local.ag !== ag) changed += 1;
        local.hg = hg;
        local.ag = ag;
      }

      if (local.stage && local.stage !== "GROUP") {
        const remoteHomePenalty = normalizeRemoteScore(remote.homePenalty);
        const remoteAwayPenalty = normalizeRemoteScore(remote.awayPenalty);
        local.hp = reversed ? remoteAwayPenalty : remoteHomePenalty;
        local.ap = reversed ? remoteHomePenalty : remoteAwayPenalty;
      }
    }

    if (remote.goalEventsComplete === true && Array.isArray(remote.goalEvents)) {
      state.goalEvents[local.id] = normalizeGoalEvents({
        [local.id]: remote.goalEvents.map((event, index) => ({
          id: event.id || `remote-${local.id}-${index}`,
          team: event.team || null,
          player: event.player || "",
          minute: String(event.minute || ""),
          type: event.type || "goal"
        }))
      })[local.id] || [];
    }

    return { matched: 1, changed };
  }

  function applyRemoteUpdate(payload) {
    const matches = Array.isArray(payload?.matches) ? payload.matches : [];
    if (!matches.length) throw new Error("A fonte não retornou partidas utilizáveis.");

    const ranges = [[1,72],[73,88],[89,96],[97,100],[101,102],[103,104]];
    let changed = 0;
    let matched = 0;

    ranges.forEach(([min, max]) => {
      matches
        .filter(remote => Number(remote.number) >= min && Number(remote.number) <= max)
        .forEach(remote => {
          const result = applyRemoteMatch(remote);
          changed += result.changed;
          matched += result.matched;
        });
      propagateBracket();
    });

    if (!matched) {
      throw new Error("A fonte respondeu, mas os confrontos não coincidiram com a tabela do aplicativo.");
    }

    updateScorersFromGoalEvents();
    saveState();
    renderAll();
    return { changed, matched, skipped: Math.max(0, matches.length - matched) };
  }

  async function updateLiveData() {
    const button = document.getElementById("updateDataBtn");
    const status = document.getElementById("updateStatus");
    if (button) button.disabled = true;
    if (status) status.innerHTML = `<span class="update-status__spinner"></span> Buscando resultados, gols e artilharia...`;
    try {
      let payload;
      if (location.protocol !== "file:") {
        try {
          const response = await fetch(LIVE_UPDATE_ENDPOINT, {cache:"no-store", headers:{"Accept":"application/json"}});
          if (!response.ok) throw new Error(`Servidor de atualização: ${response.status}`);
          payload = await response.json();
        } catch (serverError) {
          console.warn("Função Netlify indisponível; tentando fonte direta.", serverError);
          payload = await fetchCommunityDataDirect();
        }
      } else {
        payload = await fetchCommunityDataDirect();
      }
      const result = applyRemoteUpdate(payload);
      const time = new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
      if (status) status.innerHTML = `<strong>Atualizado às ${time}</strong> • ${result.changed} placar(es) alterado(s) • ${result.matched} partida(s) conferida(s) • fonte: ${escapeHtml(payload.provider || "API configurada")}`;
    } catch (error) {
      console.error(error);
      if (status) status.innerHTML = `<strong>Não foi possível atualizar.</strong> ${escapeHtml(error.message)} ${location.protocol === "file:" ? "Publique a pasta no Netlify para usar a função automática com mais estabilidade." : ""}`;
    } finally {
      if (button) button.disabled = false;
    }
  }

  function renderGoalDialog() {
    const dialog = document.getElementById("goalDialog");
    const match = state.knockoutMatches.find(item => item.id === currentGoalMatchId);
    if (!dialog || !match) return;
    document.getElementById("goalDialogMatch").textContent = `${stageNames[match.stage]} • ${team(match.home)?.name || "A definir"} × ${team(match.away)?.name || "A definir"}`;
    const teamSelect = document.getElementById("goalTeam");
    teamSelect.innerHTML = [match.home, match.away].filter(Boolean).map(code => `<option value="${code}">${team(code)?.flag || "⚽"} ${escapeHtml(team(code)?.name || code)}</option>`).join("");
    const events = (state.goalEvents[match.id] || []).sort((a, b) => goalMinuteValue(a.minute) - goalMinuteValue(b.minute));
    document.getElementById("goalEventList").innerHTML = events.length ? events.map(event => `<article class="goal-event-row">
      <div><span>${team(event.team)?.flag || "⚽"}</span><strong>${escapeHtml(event.player)}</strong><small>${escapeHtml(team(event.team)?.name || event.team)}</small></div>
      <span class="goal-event-minute">${escapeHtml(event.minute)}'</span>
      <button type="button" data-remove-goal-event="${escapeHtml(event.id)}" aria-label="Remover gol de ${escapeHtml(event.player)}">×</button>
    </article>`).join("") : `<div class="empty-state">Nenhum autor de gol cadastrado para esta partida.</div>`;
  }

  function openGoalDialog(matchId) {
    currentGoalMatchId = matchId;
    renderGoalDialog();
    const dialog = document.getElementById("goalDialog");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function addGoalEvent() {
    const match = state.knockoutMatches.find(item => item.id === currentGoalMatchId);
    if (!match) return;
    const teamCode = document.getElementById("goalTeam").value;
    const player = document.getElementById("goalPlayer").value.trim();
    const minute = document.getElementById("goalMinute").value.trim().replace(/[^0-9+]/g, "");
    if (!teamCode || !player || !minute || ![match.home, match.away].includes(teamCode)) return;
    if (!state.goalEvents[match.id]) state.goalEvents[match.id] = [];
    state.goalEvents[match.id].push({
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      team: teamCode,
      player,
      minute,
      type: "goal"
    });
    document.getElementById("goalPlayer").value = "";
    document.getElementById("goalMinute").value = "";
    saveState();
    renderGoalDialog();
    renderBracket();
  }

  function removeGoalEvent(eventId) {
    if (!currentGoalMatchId || !state.goalEvents[currentGoalMatchId]) return;
    state.goalEvents[currentGoalMatchId] = state.goalEvents[currentGoalMatchId].filter(event => event.id !== eventId);
    saveState();
    renderGoalDialog();
    renderBracket();
  }

  function allMatches() {
    return [
      ...state.groupMatches.map(match => ({ ...match, stage:"GROUP" })),
      ...state.knockoutMatches
    ].sort((a,b) => dateTimeValue(a).localeCompare(dateTimeValue(b)));
  }

  function renderMatchListRow(match) {
    const kind = match.stage === "GROUP" ? "group" : "knockout";
    const disabled = kind === "knockout" && (!match.home || !match.away);
    const groupSuffix = match.stage === "GROUP" ? ` • Grupo ${match.group}` : "";
    const tied = kind === "knockout" && match.hg !== null && match.ag !== null && match.hg === match.ag && match.home && match.away;
    return `<article class="match-list-row">
      <div class="match-list-row__date">${formatDate(match.date)}${match.time ? ` • ${match.time}` : ""}</div>
      <span class="stage-pill">${stageNames[match.stage]}${groupSuffix}</span>
      ${teamLabel(match.home)}
      ${teamLabel(match.away)}
      <div class="match-list-score">${scoreInput(match,"hg",kind,disabled)}<span class="score-sep">×</span>${scoreInput(match,"ag",kind,disabled)}</div>
      ${tied ? `<div class="match-list-pen"><span>Pênaltis:</span>${scoreInput(match,"hp",kind,false,"penalty-input")}<span>×</span>${scoreInput(match,"ap",kind,false,"penalty-input")}</div>` : ""}
    </article>`;
  }

  function renderMatchesList() {
    const search = document.getElementById("matchSearch").value.trim().toLocaleLowerCase("pt-BR");
    const stage = document.getElementById("stageFilter").value;
    const filtered = allMatches().filter(match => {
      if (stage !== "all" && match.stage !== stage) return false;
      if (!search) return true;
      const home = team(match.home)?.name || "aguardando vencedor";
      const away = team(match.away)?.name || "aguardando vencedor";
      return `${home} ${away} ${match.group || ""}`.toLocaleLowerCase("pt-BR").includes(search);
    });
    document.getElementById("matchesList").innerHTML = filtered.length
      ? filtered.map(renderMatchListRow).join("")
      : `<div class="empty-state">Nenhuma partida encontrada com esses filtros.</div>`;
  }

  function getActiveTeamCodes() {
    const active = new Set();
    state.knockoutMatches
      .filter(match => !matchIsComplete(match))
      .forEach(match => {
        if (match.home) active.add(match.home);
        if (match.away) active.add(match.away);
      });
    return active;
  }

  function sourceParticipantText(match, side) {
    const directCode = side === "home" ? match.home : match.away;
    if (directCode) return team(directCode)?.name || directCode;

    const winnerSource = side === "home" ? match.fromHome : match.fromAway;
    const loserSource = side === "home" ? match.loserHome : match.loserAway;
    const sourceId = winnerSource || loserSource;
    const prefix = loserSource ? "Perdedor" : "Vencedor";
    if (!sourceId) return "Seleção a definir";

    const source = knockoutMap().get(sourceId);
    if (source?.home && source?.away) {
      return `${prefix} de ${team(source.home)?.name || source.home} × ${team(source.away)?.name || source.away}`;
    }
    return `${prefix} do jogo ${sourceId.toUpperCase()}`;
  }

  function renderScheduleParticipant(match, side) {
    const code = side === "home" ? match.home : match.away;
    if (code) {
      const item = team(code);
      return `<div class="schedule-participant is-confirmed"><span class="flag">${item?.flag || "⚽"}</span><strong>${escapeHtml(item?.name || code)}</strong></div>`;
    }
    return `<div class="schedule-participant is-possible"><span class="schedule-orbit">◌</span><span>${escapeHtml(sourceParticipantText(match, side))}</span></div>`;
  }

  function renderDynamicCalendar() {
    const remaining = state.knockoutMatches
      .filter(match => !matchIsComplete(match))
      .sort((a, b) => dateTimeValue(a).localeCompare(dateTimeValue(b)));

    if (!remaining.length) {
      return `<div class="calendar-complete"><span>🏆</span><strong>Todos os jogos foram concluídos.</strong><p>O calendário está completo e o campeão já pode ser consultado no centro da chave.</p></div>`;
    }

    const grouped = new Map();
    remaining.forEach(match => {
      if (!grouped.has(match.date)) grouped.set(match.date, []);
      grouped.get(match.date).push(match);
    });

    return `<div class="dynamic-calendar">${[...grouped.entries()].map(([date, matches]) => `
      <section class="calendar-day">
        <header class="calendar-day__head"><span>${formatDate(date)}</span><small>${matches.length} ${matches.length === 1 ? "jogo" : "jogos"}</small></header>
        <div class="calendar-day__matches">${matches.map(match => {
          const confirmed = Boolean(match.home && match.away);
          return `<article class="calendar-match ${confirmed ? "is-confirmed" : "is-possible"}">
            <div class="calendar-match__meta">
              <span class="stage-pill">${stageNames[match.stage]}</span>
              <strong>${match.time || "Horário a definir"}</strong>
            </div>
            <div class="calendar-match__teams">
              ${renderScheduleParticipant(match, "home")}
              <span class="calendar-versus">×</span>
              ${renderScheduleParticipant(match, "away")}
            </div>
            <div class="calendar-match__status">${confirmed ? "Confronto confirmado" : "Confronto possível — será atualizado automaticamente"}</div>
          </article>`;
        }).join("")}</div>
      </section>`).join("")}</div>`;
  }

  function renderTopScorers() {
    const activeTeams = getActiveTeamCodes();
    const topTen = sortedScorers().slice(0, 10);
    const rows = topTen.map((item, index) => {
      const selection = team(item.team);
      const active = activeTeams.has(item.team);
      return `<article class="scorer-row ${index === 0 ? "scorer-row--leader" : ""} ${active ? "is-active" : "is-locked"}">
        <div class="scorer-rank">${index + 1}</div>
        <div class="scorer-info">
          <div class="scorer-name"><span class="flag">${selection?.flag || "⚽"}</span><span>${escapeHtml(item.name)}</span></div>
          <div class="scorer-team">${escapeHtml(selection ? selection.name : item.team || "Sem seleção")} • ${active ? "em disputa" : "eliminado / bloqueado"}</div>
        </div>
        <div class="scorer-goals"><span>Gols</span><strong>${item.goals ?? 0}</strong></div>
      </article>`;
    }).join("");
    document.getElementById("topScorers").innerHTML = rows || `<div class="empty-state">Nenhum artilheiro cadastrado.</div>`;
  }

  function renderScorerCarousel() {
    const container = document.getElementById("scorerCarousel");
    if (!container) return;
    const topTen = carouselScorers();
    if (!topTen.length) {
      container.innerHTML = `<div class="empty-state">Nenhum artilheiro cadastrado para o carrossel.</div>`;
      return;
    }
    scorerCarouselIndex = ((scorerCarouselIndex % topTen.length) + topTen.length) % topTen.length;
    container.innerHTML = `
      <div class="scorer-carousel__heading">
        <div><p class="eyebrow">GALERIA DOS ARTILHEIROS</p><h4>Os destaques da Copa</h4></div>
        <span>${topTen.length} jogadores</span>
      </div>
      <div class="scorer-carousel__viewport">
        ${topTen.map((item, index) => {
          const selection = team(item.team);
          const image = scorerImageFor(item);
          const imageMarkup = image
            ? `<img src="${image}" alt="${escapeHtml(item.name)}" loading="${index < 2 ? "eager" : "lazy"}" />`
            : `<div class="scorer-carousel__placeholder"><span>${selection?.flag || "⚽"}</span><strong>${escapeHtml(item.name)}</strong></div>`;
          return `<article class="scorer-carousel__slide ${index === scorerCarouselIndex ? "is-active" : ""}" data-carousel-slide="${index}" aria-hidden="${index === scorerCarouselIndex ? "false" : "true"}">
            <div class="scorer-carousel__frame">
              <div class="scorer-carousel__rank">#${index + 1}</div>
              ${imageMarkup}
              <div class="scorer-carousel__overlay">
                <div class="scorer-carousel__team"><span>${selection?.flag || "⚽"}</span>${escapeHtml(selection?.name || item.team || "Seleção")}</div>
                <h5>${escapeHtml(item.name)}</h5>
                <div class="scorer-carousel__goals"><strong>${item.goals ?? 0}</strong><span>${(item.goals ?? 0) === 1 ? "gol" : "gols"}</span></div>
              </div>
            </div>
          </article>`;
        }).join("")}
        <button class="scorer-carousel__nav scorer-carousel__nav--prev" type="button" data-carousel-dir="-1" aria-label="Artilheiro anterior">‹</button>
        <button class="scorer-carousel__nav scorer-carousel__nav--next" type="button" data-carousel-dir="1" aria-label="Próximo artilheiro">›</button>
      </div>
      <div class="scorer-carousel__dots">${topTen.map((_, index) => `<button type="button" class="${index === scorerCarouselIndex ? "is-active" : ""}" data-carousel-dot="${index}" aria-label="Exibir artilheiro ${index + 1}"></button>`).join("")}</div>`;
  }

  function showScorerCarouselSlide(index) {
    const slides = [...document.querySelectorAll("[data-carousel-slide]")];
    if (!slides.length) return;
    scorerCarouselIndex = ((Number(index) % slides.length) + slides.length) % slides.length;
    slides.forEach((slide, itemIndex) => {
      const active = itemIndex === scorerCarouselIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });
    document.querySelectorAll("[data-carousel-dot]").forEach((dot, itemIndex) => dot.classList.toggle("is-active", itemIndex === scorerCarouselIndex));
  }

  function startScorerCarousel() {
    window.clearInterval(scorerCarouselTimer);
    scorerCarouselTimer = window.setInterval(() => showScorerCarouselSlide(scorerCarouselIndex + 1), SCORER_CAROUSEL_INTERVAL);
  }

  function handleScorerCarouselClick(event) {
    const directionButton = event.target.closest("[data-carousel-dir]");
    const dotButton = event.target.closest("[data-carousel-dot]");
    if (directionButton) {
      showScorerCarouselSlide(scorerCarouselIndex + Number(directionButton.dataset.carouselDir));
      startScorerCarousel();
    }
    if (dotButton) {
      showScorerCarouselSlide(Number(dotButton.dataset.carouselDot));
      startScorerCarousel();
    }
  }

  function renderScorerEditor() {
    const activeTeams = getActiveTeamCodes();
    const select = document.getElementById("scorerTeam");
    const nameInput = document.getElementById("scorerName");
    const goalsInput = document.getElementById("scorerGoals");
    const submit = document.querySelector("#scorerForm button[type='submit']");
    const options = [...activeTeams]
      .sort((a, b) => team(a).name.localeCompare(team(b).name, "pt-BR"))
      .map(code => `<option value="${code}">${team(code).flag} ${escapeHtml(team(code).name)}</option>`)
      .join("");

    select.innerHTML = options || `<option value="">Nenhuma seleção ativa</option>`;
    const formDisabled = activeTeams.size === 0;
    select.disabled = formDisabled;
    nameInput.disabled = formDisabled;
    goalsInput.disabled = formDisabled;
    submit.disabled = formDisabled;

    const editorRows = [...state.scorers].sort((a, b) => {
      const activeDiff = Number(activeTeams.has(b.team)) - Number(activeTeams.has(a.team));
      return activeDiff || (b.goals ?? 0) - (a.goals ?? 0) || a.name.localeCompare(b.name, "pt-BR");
    }).map(item => {
      const selection = team(item.team);
      const active = activeTeams.has(item.team);
      return `<article class="scorer-editor-row ${active ? "is-editable" : "is-locked"}">
        <div class="scorer-editor-team"><span>${selection?.flag || "⚽"}</span><strong>${escapeHtml(selection?.name || item.team || "Sem seleção")}</strong></div>
        <label><span>Jogador</span><input class="scorer-name-input" data-scorer-id="${escapeHtml(item.id)}" value="${escapeHtml(item.name)}" maxlength="60" ${active ? "" : "disabled"} /></label>
        <label><span>Gols</span><input class="scorer-goals-input" data-scorer-id="${escapeHtml(item.id)}" type="number" min="0" max="30" value="${item.goals ?? 0}" inputmode="numeric" ${active ? "" : "disabled"} /></label>
        <span class="scorer-state ${active ? "is-active" : "is-locked"}">${active ? "Editável" : "Bloqueado"}</span>
        <button class="scorer-remove" type="button" data-remove-scorer="${escapeHtml(item.id)}" ${active ? "" : "disabled"} aria-label="Remover ${escapeHtml(item.name)}">×</button>
      </article>`;
    }).join("");

    document.getElementById("scorerEditor").innerHTML = editorRows || `<div class="empty-state">Adicione o primeiro jogador usando o formulário acima.</div>`;
  }

  function renderChampionSummary(championCode, leader) {
    const leaderData = sortedScorers()[0];
    const leaderTeam = leaderData ? team(leaderData.team) : null;
    document.getElementById("championSummary").innerHTML = `
      <div class="champion-summary">
        <p class="eyebrow">DESTAQUES DO PAINEL</p>
        <h3 class="champion-summary__title">Campeão ao centro e artilharia atualizável</h3>
        <p class="champion-summary__lead">O chaveamento organiza os confrontos por lados até o centro. A artilharia pode ser atualizada manualmente e bloqueia automaticamente jogadores de seleções eliminadas.</p>
        <div class="champion-status">⚽ Líder da artilharia: <strong>${leaderData ? `${leaderTeam?.flag || ""} ${escapeHtml(leaderData.name)} (${leaderData.goals})` : "A definir"}</strong></div>
        <div class="champion-badge">🏆 ${championCode ? `${team(championCode).flag} ${team(championCode).name}` : "Campeão ainda não definido"}</div>
        <p class="champion-summary__lead">${leader ? `Melhor campanha na fase de grupos: ${team(leader.code).flag} ${team(leader.code).name} com ${leader.pts} pts e saldo ${leader.sg > 0 ? "+" : ""}${leader.sg}.` : "A fase de grupos ainda está em andamento."}</p>
      </div>`;
  }

  function renderDashboard() {
    const groupCompleted = state.groupMatches.filter(match => match.hg !== null && match.ag !== null).length;
    const koCompleted = state.knockoutMatches.filter(matchIsComplete).length;
    const totalGoals = state.groupMatches.reduce((sum,m) => sum + (m.hg ?? 0) + (m.ag ?? 0), 0)
      + state.knockoutMatches.reduce((sum,m) => sum + (m.hg ?? 0) + (m.ag ?? 0), 0);
    const final = state.knockoutMatches.find(match => match.id === "m104");
    const championCode = getWinner(final);
    const leader = [...Object.keys(baseData.groups).flatMap(group => calculateStandings(group))]
      .sort((a,b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp)[0];
    const topScorer = sortedScorers()[0];
    const topScorerTeam = topScorer ? team(topScorer.team) : null;

    const stats = [
      ["Jogos concluídos", `${groupCompleted + koCompleted}/104`, `${groupCompleted} na fase de grupos`],
      ["Gols registrados", totalGoals, "Pênaltis não entram nesta soma"],
      ["Mata-mata definido", `${koCompleted}/32`, "Resultados com vencedor confirmado"],
      ["Artilheiro atual", topScorer ? `${topScorerTeam?.flag || ""} ${escapeHtml(topScorer.name)}` : "—", topScorer ? `${topScorer.goals} gols` : "Golden Boot"],
      ["Campeão", championCode ? `${team(championCode).flag} ${team(championCode).name}` : "A definir", championCode ? "Título confirmado" : "Final em 19/07", true]
    ];

    document.getElementById("stats").innerHTML = stats.map(([label,value,small,accent]) => `<article class="stat-card ${accent ? "stat-card--accent" : ""}">
      <span>${label}</span><strong>${value}</strong><small>${small}</small>
    </article>`).join("");

    document.getElementById("nextMatches").innerHTML = `
      <div class="panel-header">
        <div><p class="eyebrow">AGENDA AUTOMÁTICA</p><h3>Próximas partidas</h3></div>
        <span class="mini-note">Horários preservados</span>
      </div>
      <p class="calendar-intro">Conforme os resultados são preenchidos, os classificados entram automaticamente nos jogos futuros nos respectivos dias e horários.</p>
      ${renderDynamicCalendar()}`;

    renderChampionSummary(championCode, leader);
    renderTopScorers();
    renderScorerCarousel();
    renderScorerEditor();
  }

  function renderAll() {
    propagateBracket();
    renderDashboard();
    renderGroups();
    renderBracket();
    renderMatchesList();
  }

  function findMatch(kind, id) {
    return (kind === "group" ? state.groupMatches : state.knockoutMatches).find(match => match.id === id);
  }

  function handleScorerChange(event) {
    const goalsInput = event.target.closest(".scorer-goals-input");
    const nameInput = event.target.closest(".scorer-name-input");
    const input = goalsInput || nameInput;
    if (!input) return;

    const scorer = state.scorers.find(item => item.id === input.dataset.scorerId);
    if (!scorer || !getActiveTeamCodes().has(scorer.team)) return;

    if (goalsInput) scorer.goals = safeNumber(goalsInput.value) ?? 0;
    if (nameInput) scorer.name = nameInput.value.trim() || scorer.name;
    saveState();
    renderDashboard();
  }

  function handleScorerSubmit(event) {
    if (event.target.id !== "scorerForm") return;
    event.preventDefault();
    const teamCode = document.getElementById("scorerTeam").value;
    const name = document.getElementById("scorerName").value.trim();
    const goals = safeNumber(document.getElementById("scorerGoals").value) ?? 0;
    if (!teamCode || !name || !getActiveTeamCodes().has(teamCode)) return;

    state.scorers.push({
      id: `scorer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      team: teamCode,
      goals
    });
    event.target.reset();
    document.getElementById("scorerGoals").value = "0";
    saveState();
    renderDashboard();
  }

  function handleScorerRemove(event) {
    const button = event.target.closest("[data-remove-scorer]");
    if (!button) return;
    const scorer = state.scorers.find(item => item.id === button.dataset.removeScorer);
    if (!scorer || !getActiveTeamCodes().has(scorer.team)) return;
    state.scorers = state.scorers.filter(item => item.id !== scorer.id);
    saveState();
    renderDashboard();
  }

  function handleGoalEditorClick(event) {
    const button = event.target.closest("[data-goal-editor]");
    if (!button) return;
    openGoalDialog(button.dataset.goalEditor);
  }

  function handleGoalEventRemove(event) {
    const button = event.target.closest("[data-remove-goal-event]");
    if (!button) return;
    removeGoalEvent(button.dataset.removeGoalEvent);
  }

  function handleTeamTooltipClick(event) {
    const row = event.target.closest(".ko-team-row.has-goal-tooltip[data-goal-team]");
    if (!row || event.target.closest("input, button")) return;
    if (window.matchMedia?.("(hover: none)").matches) {
      openGoalDialog(row.dataset.goalMatch);
      return;
    }
    document.querySelectorAll(".ko-team-row.is-tooltip-open").forEach(item => {
      if (item !== row) item.classList.remove("is-tooltip-open");
    });
    row.classList.toggle("is-tooltip-open");
  }


  function updateResponsiveViewport() {
    const viewportHeight = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;
    document.documentElement.style.setProperty("--app-viewport-height", `${Math.round(viewportHeight)}px`);
    document.documentElement.classList.toggle("is-phone-layout", window.matchMedia("(max-width: 700px)").matches);
    document.documentElement.classList.toggle("is-tablet-layout", window.matchMedia("(min-width: 701px) and (max-width: 1180px)").matches);
  }

  function refreshResponsiveBracket() {
    updateResponsiveViewport();
    if (!document.getElementById("chave")?.classList.contains("is-active")) return;
    requestAnimationFrame(() => {
      applyBracketZoom(false);
      requestAnimationFrame(() => centerBracketViewport("auto"));
    });
  }

  function setupPwaInstall() {
    const installButton = document.getElementById("installAppBtn");
    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      installButton.hidden = false;
    });
    installButton.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installButton.hidden = true;
    });
    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      installButton.hidden = true;
    });
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("service-worker.js").catch(error => console.warn("Service Worker indisponível", error));
    }
  }

  function bindBracketGestures() {
    const viewport = document.getElementById("bracket");
    let pinchStartDistance = null;
    let pinchStartZoom = bracketZoom;
    viewport.addEventListener("wheel", event => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setBracketZoom(bracketZoom + (event.deltaY < 0 ? 0.05 : -0.05));
    }, { passive: false });
    viewport.addEventListener("touchstart", event => {
      if (event.touches.length !== 2) return;
      pinchStartDistance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
      pinchStartZoom = bracketZoom;
    }, { passive: true });
    viewport.addEventListener("touchmove", event => {
      if (event.touches.length !== 2 || !pinchStartDistance) return;
      event.preventDefault();
      const distance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
      setBracketZoom(pinchStartZoom * (distance / pinchStartDistance));
    }, { passive: false });
    viewport.addEventListener("touchend", () => { pinchStartDistance = null; }, { passive: true });
  }

  function handleScoreInput(event) {
    const input = event.target.closest(".score-input, .penalty-input");
    if (!input) return;
    const match = findMatch(input.dataset.kind, input.dataset.id);
    if (!match) return;
    match[input.dataset.field] = safeNumber(input.value);

    if ((input.dataset.field === "hg" || input.dataset.field === "ag") && match.hg !== null && match.ag !== null && match.hg !== match.ag) {
      match.hp = null;
      match.ap = null;
    }
    propagateBracket();
    saveState();
    renderAll();
  }

  function switchTab(tabId) {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.toggle("is-active", tab.dataset.tab === tabId));
    document.querySelectorAll(".page").forEach(page => page.classList.toggle("is-active", page.id === tabId));
    history.replaceState(null, "", `#${tabId}`);
    window.scrollTo({ top: document.querySelector(".tabs").offsetTop, behavior:"smooth" });
    if (tabId === "chave") {
      requestAnimationFrame(() => {
        calculateBracketFitScale();
        applyBracketZoom(true);
      });
    }
  }

  function exportBackup() {
    const payload = {
      app: "Copa 2026 — Painel Premium",
      version: 6.2,
      exportedAt: new Date().toISOString(),
      groupMatches: state.groupMatches,
      knockoutMatches: state.knockoutMatches,
      scorers: state.scorers,
      goalEvents: state.goalEvents
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `copa-2026-backup-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(file) {
    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported.groupMatches) || !Array.isArray(imported.knockoutMatches)) {
        throw new Error("Estrutura de backup inválida.");
      }
      if (!savedStructureIsCompatible(imported)) {
        throw new Error("O backup contém confrontos incompatíveis com esta versão do calendário.");
      }
      restoreMatchesFromSaved(imported);
      state.scorers = Array.isArray(imported.scorers) ? normalizeScorers(imported.scorers) : normalizeScorers(baseData.topScorers || []);
      state.goalEvents = imported.goalEvents && typeof imported.goalEvents === "object" ? normalizeGoalEvents(imported.goalEvents) : normalizeGoalEvents(baseData.goalEvents || {});
      propagateBracket();
      saveState();
      renderAll();
      alert("Backup importado com sucesso.");
    } catch (error) {
      alert(`Não foi possível importar o arquivo: ${error.message}`);
    }
  }

  async function loadWasmEngine() {
    const badge = document.getElementById("engineBadge");
    try {
      const response = await fetch("assets/bracket_engine.wasm");
      if (!response.ok) throw new Error("WASM indisponível");
      const bytes = await response.arrayBuffer();
      const { instance } = await WebAssembly.instantiate(bytes, {});
      if (typeof instance.exports.determine_winner !== "function") throw new Error("Função C++ não encontrada");
      wasmWinner = instance.exports.determine_winner;
      badge.textContent = "Motor C++ / WebAssembly ativo";
    } catch (_) {
      badge.textContent = "Motor JavaScript ativo";
      badge.title = "Ao abrir pelo Netlify ou por um servidor local, o módulo C++/WebAssembly é carregado automaticamente.";
    }
  }

  function bindEvents() {
    document.addEventListener("change", handleScoreInput);
    document.addEventListener("change", handleScorerChange);
    document.addEventListener("submit", handleScorerSubmit);
    document.addEventListener("click", handleScorerRemove);
    document.addEventListener("click", handleGoalEditorClick);
    document.addEventListener("click", handleGoalEventRemove);
    document.addEventListener("click", handleTeamTooltipClick);
    document.addEventListener("click", handleScorerCarouselClick);
    document.getElementById("addGoalEventBtn").addEventListener("click", addGoalEvent);
    document.getElementById("zoomOutBtn").addEventListener("click", () => setBracketZoom(bracketZoom - 0.05));
    document.getElementById("zoomInBtn").addEventListener("click", () => setBracketZoom(bracketZoom + 0.05));
    document.getElementById("zoomResetBtn").addEventListener("click", () => setBracketZoom(1));
    document.getElementById("zoomFitBtn").addEventListener("click", () => { fitBracketZoom(); centerBracketViewport("smooth"); });
    document.getElementById("printA4Btn").addEventListener("click", () => printBracketPoster("A4"));
    document.getElementById("printA3Btn").addEventListener("click", () => printBracketPoster("A3"));
    document.getElementById("updateDataBtn").addEventListener("click", updateLiveData);
    document.getElementById("bracketZoomRange").addEventListener("input", event => setBracketZoom(Number(event.target.value) / 100));
    const bracketViewport = document.getElementById("bracket");
    const bracketTopScroll = document.getElementById("bracketHScroll");
    bracketViewport?.addEventListener("scroll", () => {
      if (syncingBracketScroll || !bracketTopScroll) return;
      syncingBracketScroll = true;
      bracketTopScroll.scrollLeft = bracketViewport.scrollLeft;
      requestAnimationFrame(() => { syncingBracketScroll = false; });
    }, {passive:true});
    bracketTopScroll?.addEventListener("scroll", () => {
      if (syncingBracketScroll || !bracketViewport) return;
      syncingBracketScroll = true;
      bracketViewport.scrollLeft = bracketTopScroll.scrollLeft;
      requestAnimationFrame(() => { syncingBracketScroll = false; });
    }, {passive:true});
    window.addEventListener("afterprint", () => {
      document.body.removeAttribute("data-print-format");
      document.getElementById("printPoster")?.setAttribute("aria-hidden", "true");
    });
    const carousel = document.getElementById("scorerCarousel");
    carousel?.addEventListener("mouseenter", () => window.clearInterval(scorerCarouselTimer));
    carousel?.addEventListener("mouseleave", startScorerCarousel);
    window.addEventListener("resize", refreshResponsiveBracket, { passive: true });
    window.addEventListener("orientationchange", () => window.setTimeout(refreshResponsiveBracket, 180), { passive: true });
    window.visualViewport?.addEventListener("resize", updateResponsiveViewport, { passive: true });
    document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => switchTab(tab.dataset.tab)));
    document.querySelectorAll(".jump").forEach(button => button.addEventListener("click", () => switchTab(button.dataset.go)));
    document.getElementById("matchSearch").addEventListener("input", renderMatchesList);
    document.getElementById("stageFilter").addEventListener("change", renderMatchesList);
    document.getElementById("exportBtn").addEventListener("click", exportBackup);
    document.getElementById("importInput").addEventListener("change", event => {
      const [file] = event.target.files;
      if (file) importBackup(file);
      event.target.value = "";
    });
    document.getElementById("resetBtn").addEventListener("click", () => {
      if (!confirm("Restaurar todos os resultados para os dados iniciais? Seu progresso salvo será substituído.")) return;
      state.groupMatches = clone(baseData.groupMatches);
      state.knockoutMatches = clone(baseData.knockoutMatches);
      state.scorers = normalizeScorers(baseData.topScorers || []);
      state.goalEvents = normalizeGoalEvents(baseData.goalEvents || {});
      applyManualMatchEventOverrides();
      localStorage.removeItem(STORAGE_KEY);
      propagateBracket();
      saveState();
      renderAll();
    });
  }

  function init() {
    updateResponsiveViewport();
    document.getElementById("dataNote").textContent = baseData.meta.note;
    document.getElementById("sourceLabel").textContent = baseData.meta.sourceLabel;
    loadSaved();
    propagateBracket();
    bindEvents();
    bindBracketGestures();
    setupPwaInstall();
    renderAll();
    startScorerCarousel();
    loadWasmEngine();

    const hash = location.hash.replace("#", "");
    if (["painel","grupos","chave","jogos"].includes(hash)) switchTab(hash);
  }

  init();
})();
