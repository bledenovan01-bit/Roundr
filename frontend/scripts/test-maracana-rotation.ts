// Tests rotation Maracana — Phase 4 (règles Lovable). Exécuté par run-domain-tests.cjs.
const assert = require("node:assert/strict");
import { initMaracana, rotate } from "../src/domain/maracana";
import type { Match } from "../src/domain/types";

const noMatches: Match[] = [];

// --- 3 équipes : le vainqueur reste, le perdant sort (inchangé) ---------------
{
  const st = initMaracana(["A", "B", "C"]); // onField [A,B], waiting [C]
  const r = rotate(st, "A", noMatches);
  assert.deepStrictEqual(r.state.onField, ["A", "C"], "3éq: A reste, C entre");
  assert.deepStrictEqual(r.out, ["B"]);
  console.log("✓ 3 équipes : vainqueur reste / perdant sort");
  // nul à 3 : la plus ancienne présence sort (ici A et B à égalité -> ordre initial => A sort)
  const rn = rotate(st, null, noMatches);
  assert.deepStrictEqual(rn.out, ["A"], "3éq nul: A (plus ancien) sort");
}

// --- 4 équipes, rotation CLASSIQUE : les deux sortent -------------------------
{
  const st = initMaracana(["A", "B", "C", "D"]); // onField [A,B], waiting [C,D]
  const r = rotate(st, "A", noMatches, { rotation: "classic" });
  assert.deepStrictEqual(r.out.sort(), ["A", "B"], "4éq classique: A et B sortent");
  assert.deepStrictEqual(r.in.sort(), ["C", "D"], "4éq classique: C et D entrent");
  console.log("✓ 4 équipes classique : les deux sortent, les deux suivants entrent");
}

// --- 4 équipes, GAGNANT RESTE : vainqueur reste, perdant sort, suivant entre --
{
  const st = initMaracana(["A", "B", "C", "D"]); // onField [A,B], waiting [C,D]
  const r = rotate(st, "A", noMatches, { rotation: "winnerStays" });
  assert.deepStrictEqual(r.state.onField, ["A", "C"], "4éq gagnant reste: A reste, C entre");
  assert.deepStrictEqual(r.out, ["B"], "4éq gagnant reste: B sort");
  assert.deepStrictEqual(r.state.waiting, ["D", "B"], "4éq gagnant reste: file [D,B]");
  console.log("✓ 4 équipes gagnant reste : vainqueur reste, perdant sort, suivant entre");
}

// --- 4 équipes, GAGNANT RESTE, nul "une équipe sort" -------------------------
{
  const st = initMaracana(["A", "B", "C", "D"]);
  const r = rotate(st, null, noMatches, { rotation: "winnerStays", drawRule4: "oneLeaves" });
  assert.strictEqual(r.out.length, 1, "nul oneLeaves: une seule équipe sort");
  assert.strictEqual(r.in.length, 1, "nul oneLeaves: une seule équipe entre");
  assert.deepStrictEqual(r.out, ["A"], "nul oneLeaves: A (plus ancien) sort");
  console.log("✓ 4 équipes gagnant reste, nul : une équipe sort (départage)");
}

// --- 4 équipes, GAGNANT RESTE, nul "les deux sortent" ------------------------
{
  const st = initMaracana(["A", "B", "C", "D"]);
  const r = rotate(st, null, noMatches, { rotation: "winnerStays", drawRule4: "bothLeave" });
  assert.deepStrictEqual(r.out.sort(), ["A", "B"], "nul bothLeave: A et B sortent");
  assert.deepStrictEqual(r.in.sort(), ["C", "D"], "nul bothLeave: C et D entrent");
  console.log("✓ 4 équipes gagnant reste, nul : les deux sortent");
}

console.log("Maracana rotation scenarios passed");
