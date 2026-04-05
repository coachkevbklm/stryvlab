# genesis ipt — repo prêt à intégrer (v1.1.0)

- questions: 253 (modules CSV) + 20 neurotype = **273**
- mapping: `lib/genesis/mapping/questions_to_axes.json|csv`
- api: `app/api/genesis/analyze/route.ts`

## install
- Next.js App Router
- Zod
- Jest/Vitest (tests fournis)

## run
Appelle POST `/api/genesis/analyze` avec:
```json
{
  "mode": "ipt",
  "answers": {
    "Q_MET_01": 7,
    "Q_STRESS_02": 4
  }
}
```

## notes calibration
Cette v1.1.0 est **opérationnelle** avec heuristiques.
Pour passer en scoring “verrouillé empirique”:
1) remplace `direction` question-par-question
2) ajuste weights (role/axis)
3) bump version => v1.2.0

Généré le 2026-01-08.
