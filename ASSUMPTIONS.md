# ENERFLUX — Modeling Assumptions

Every constant below is an **illustrative engineering default**, not a researched
physical value. They are labeled so an evaluator can see where a modeling choice
was made. All live in `src/engine/constants.ts` unless noted.

## Flagged inconsistencies in the brief (and how they were resolved)

1. **SOC formula units.** `SOC += P·η·Δt/capacity` yields a 0–1 fraction, but SOC
   is displayed on 0–100. Resolved by scaling ×100: `ΔSOC% = 100·P·η·Δt_h/capacity`
   (`model.ts → socDeltaPct`).
2. **SOH scale collision.** Health score `0.4·SOH` needs SOH on 0–100 to sit
   alongside the other 0–100 sub-scores, but `degCost = base·(2−SOH)` needs SOH on
   0–1 (else it goes negative). Resolved: SOH is stored on **0–1**, scaled ×100
   only inside `healthScore`. Degradation cost uses the raw 0–1 value.
3. **Power-balance closure.** With no free variable the Section-2 equation cannot
   close each tick. Resolved: solar→battery→grid are dispatched to meet EV demand,
   `P_losses = 4% × EV-delivered throughput`, and **grid import/export absorbs the
   residual** so the equation closes exactly. When islanded (grid down), batteries
   source the loss term. Any tiny leftover is surfaced as `balanceResidual`.
4. **Priority term sign.** `(1 − SOC/targetSOC)` goes negative once an EV passes
   its target; clamped to 0.

## Time & clock
- 1 tick = 30 sim-seconds at 1× (`SIM_STEP_SECONDS`), driver fires every 500 ms.
  Speed 1/2/5/10× multiplies sim-seconds per tick. Chosen so SOC visibly moves
  during a live demo without being unreadably fast.
- Sim clock starts at 12:00 (solar noon).

## Losses & efficiency
- `LOSS_FACTOR = 0.04` (4%) applied to EV-delivered power.
- EV charge efficiency 0.95; battery charge efficiency 0.94 (round-trip loss shows
  up on the SOC gain, so it is not double-counted in `P_losses`).

## Battery health (Section 2 weights: 0.4/0.2/0.2/0.2)
- `socSuitability`: 100 in 20–90% band, linear derate outside.
- `tempScore`: 100 in 15–40 °C, derate to 0 at −5 °C / 60 °C.
- `resistanceScore`: `100 − (Rint/R0 − 1)·200`, clamped 0–100.
- State map: ≥80 AVAILABLE/ACTIVE, 60–79 LIMITED, 40–59 WARNING, <40 ISOLATED
  (auto-disconnect, never selected as a source).

## Degradation cost
- `degCostPerKWh = base·(2 − SOH)`. `base` = ₹4/kWh second-life, ₹8/kWh new pack —
  second-life is cheaper to cycle but wears faster (`WEAR_RATE`: 8e-6 vs 2e-6 SOH
  per kWh). Net effect: second-life is dispatched first, the new pack is held as a
  low-wear reserve — which is the intended behavior of the system.

## Source arbitration (Novelty 2)
- Solar is always taken first. Remaining demand is filled from a single cost-ranked
  list of every usable battery module (by `degCostPerKWh`) plus grid (by tariff),
  cheapest first — a greedy least-cost dispatch. A battery is usable only if not
  faulted, health ≥ 40, and SOC above its safety floor (15%).

## Grid
- Tariffs: low ₹6, normal ₹9, peak ₹13 /kWh. `Grid Energy Cost` = import cost only;
  export energy is tracked but not credited against it (kept separate for clarity).

## EV profiles
- Kia EV9 (99.8 kWh / 552 V / 350 kW) is the project reference vehicle. Other two:
  Compact 45 kWh/50 kW, Sedan 60 kWh/120 kW.

## CO₂ (accumulated now, surfaced in Phase 3)
- `0.71 kg/kWh` India grid emission factor applied to renewable (solar + battery)
  energy delivered.
