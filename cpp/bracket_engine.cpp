// Motor mínimo de desempate para uso no navegador via WebAssembly.
// Retorno: 1 = mandante, 2 = visitante, 0 = resultado ainda indefinido.
extern "C" int determine_winner(int home_goals, int away_goals, int home_penalties, int away_penalties) {
    if (home_goals > away_goals) return 1;
    if (away_goals > home_goals) return 2;

    // Valores negativos significam que os pênaltis ainda não foram informados.
    if (home_penalties < 0 || away_penalties < 0 || home_penalties == away_penalties) return 0;
    return home_penalties > away_penalties ? 1 : 2;
}
