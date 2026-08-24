# ENERFLUX — Demo Simplification Changes

Front-end trimmed for a 1-minute presentation. No "Novelty" wording anywhere in the UI.
Engine math kept accurate to `ENERFLUX_6_Novelties_plus_V2V_Formulas.md`.

## Removed from UI
- **Controller · Source Selection** panel (top of center column) — `ControllerPanel` no longer rendered.
- **Novelty Verification** band (bottom) — `NoveltyPanel` no longer rendered.
- **Battery Storage** panel (right column) — `BatteryPanel` no longer rendered.
- All **"Novelty N"** labels that were shown in the UI (they lived only in the three panels above + EV panel title).
- **Scenario blurbs** — the descriptive line under each demo scenario ("Solar surplus charges…", etc.) removed. Only the scenario name remains (e.g. "Sunny / High demand").
- **EV manual sliders** — SOC / Target / Weight range inputs removed from each EV card, plus the `+ EV` and disconnect (×) buttons.

> Note: `ControllerPanel.tsx`, `NoveltyPanel.tsx`, `BatteryPanel.tsx` files are left in place but are no longer imported, so they are excluded from the bundle.

## Added
- **Load Case** panel (right column, above EV Charging) with three rectangular buttons:
  - **Worst Case** → 3 × EV1 (Kia EV9, 99.8 kWh)
  - **Normal Case** → 1 × EV1 + 1 × EV2 + 1 × EV3
  - **Best Case** → 3 × EV3 (MG Comet EV, 17 kWh)
- Clicking a case swaps **only the EV set** feeding the circuit diagram. Solar, grid, tariff, battery
  bank, and scenario settings are untouched. Always exactly 3 EVs (`makeCaseEVs`).

## EV profiles (`constants.ts` → `EV_PROFILES`)
| Slot | Model | Capacity | Nominal V | Max DC |
|------|-------|----------|-----------|--------|
| EV1 | Kia EV9 | 99.8 kWh | 552 V | 350 kW |
| EV2 | Tata Punch EV | 35 kWh | 320 V | 50 kW |
| EV3 | MG Comet EV | 17 kWh | 300 V | 7 kW |

(Replaced the old Kia / Compact / Sedan set. V and max-power for EV2/EV3 are illustrative.)

## Target SOC
- Every EV now charges to **100%** always. Enforced in `makeEV` default, `makeCaseEVs`, and
  `scenarios.setEV` (which now forces `targetSoc = 100` regardless of scenario data).
- EV card shows the target marker fixed at the 100% (right) edge of the SOC bar.

## EV card readings kept
Below each EV's charge bar: **SOC**, **P** (priority score), **wait**, **dep** (time to departure).
The `kW` charge rate stays in the card header.

## Formula accuracy (unchanged in this pass, confirmed against the formulae doc)
- **Priority**: `P_i = 0.10·U + 0.25·S + 0.25·D + 0.20·Q + 0.20·C` (weights sum to 1), with
  U = wait urgency, S = SOC deficit `(target−soc)/100`, D = departure urgency (2 h horizon),
  Q = operator weight `(w−1)/4`, C = charge feasibility (time-to-full / time-available).
- **Efficiency**: `evDelivered_kWh / primaryDrawn_kWh` (Option C) — realistic ~75–90%, not a fixed 96%.

## State / types
- New `CaseId = 'worst' | 'normal' | 'best'`, `SimState.activeCase`, and `SET_CASE` action.

## Verification
- `npx tsc --noEmit` — clean.
- `npx vite build` — clean (1544 modules).
