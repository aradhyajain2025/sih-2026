## 6 Strengthened Novelty Mechanisms + V2V ENERFLUX Charging

Clean formulas, parameter meanings and worked examples for simulation

| Simulation parameter | Value used |
| --- | --- |
| Solar PV array | 15 kWp |
| Converter / inverter rating | 20 kW |
| V2V transfer limit | 15 kW |
| Example EV battery | 99.8 kWh |
| Example nominal battery voltage | 552 V |
| Example conversion efficiency | 94% |

Important distinction: The attached IDF describes the core ENERFLUX architecture: real-time EV demand, dynamic priority, solar-first allocation, SOC/SOH-aware battery selection, tariff-aware source selection and surplus export. The six mechanisms below are the strengthened, more quantitative extensions discussed for making those concepts more technically specific. V2V is added separately because it is a distinct power-flow mechanism.



## 1. Predictive Solar + EV Demand Forecasting

Purpose: Adds a short-horizon prediction layer so the controller can anticipate future solar generation and EV demand rather than reacting only to current measurements.

## Formula(s)

```
P_PV(t) = P_rated * [G(t)/G_STC] * [1 + gamma*(T_cell(t)-T_ref)]
E_forecast = SUM(P_PV(k)*Delta_t)
MAPE = (100/n) * SUM(ABS[(P_actual(k)-P_forecast(k))/P_actual(k)])
Demand_forecast = SUM_i P_EV,i(t + k)
```

Example: P_rated=15 kW, G=800 W/m2, G_STC=1000 W/m2, gamma=-0.004 per degree C, T_cell=35 C, T_ref=25 C. P_PV = 15*(0.8)*(1-0.04) = 11.52 kW. If this level lasts 1 hour, forecast energy is 11.52 kWh. The controller can compare forecast solar energy with predicted EV demand before deciding whether to discharge storage.

Parameters: G=irradiance; T_cell=cell temperature; gamma=temperature coefficient; Delta_t=time step; MAPE=forecast error.

Engineering note: A forecast is only defensible as a technical feature if the implementation actually uses the prediction to change the control decision.

## 2. Battery-Degradation-Aware Dispatch

Purpose: Extends SOC/SOH eligibility into a numerical degradation cost. Instead of simply allowing or blocking a second-life battery, the controller can make its use more or less expensive as stress increases.

## Formula(s)

```
SOC_new = SOC_old + 100*(E_charge*eta_charge/E_batt)
SOC_new = SOC_old - 100*(E_discharge/(E_batt*eta_discharge))
DOD = SOC_max - SOC_min
C_rate = P_batt/E_batt
C_deg = C_base * F_SOH * F_DOD * F_Crate * F_T
```

Example: E_batt=99.8 kWh and P_batt=15 kW. C_rate=15/99.8=0.150 C. If SOC changes from 80% to 30%, DOD=50%. The controller can assign a higher C_deg when SOH is lower or DOD/C-rate is higher, making that battery less attractive than a healthier source.

Parameters: SOC=state of charge; SOH=state of health; DOD=depth of discharge; C_rate=power-to-energy ratio; F terms are experimentally fitted degradation factors.


Engineering note: Do not invent real battery-aging coefficients. For a serious prototype, obtain them from cycling data or a validated battery model.


## 3. Multi-Station Energy Sharing

Purpose: Extends the architecture from one station to several stations. A station with renewable surplus can support another station with unmet demand.

## Formula(s)

```
P_surplus,A = MAX(P_generation,A - P_demand,A, 0)
P_deficit,B = MAX(P_demand,B - P_generation,B, 0)
P_transfer = MIN(P_surplus,A, P_deficit,B, P_link,max)
P_remaining,B = P_deficit,B - P_transfer
E_transfer = P_transfer * Delta_t
```

Example: Station A generates 9 kW and needs 5 kW, so surplus=4 kW. Station B generates 2 kW and needs 8 kW, so deficit=6 kW. If the inter-station link allows 10 kW, P_transfer=MIN(4,6,10)=4 kW. Station B's remaining deficit is 2 kW.

Parameters: P_link,max is the physical transfer limit of the cable/converter/network.

Engineering note: This becomes a real network-level novelty only if the stations actually exchange information and power under a defined coordination protocol.

## 4. Self-Tuning / Adaptive Thresholds

Purpose: Replaces permanently fixed operating thresholds with thresholds that adapt according to measured performance.

## Formula(s)

```
e(k) = T_target - T_observed(k)
T(k+1) = T(k) + alpha*e(k)
T_min <= T(k) <= T_max
```

Example: Initial battery discharge threshold T=20%. Target=20%, observed performance=15%, alpha=0.10. e=20-15=5. Therefore T_new=20+0.10(5)=20.5%. The controller repeats the update after each evaluation interval.

Parameters: T=adaptive threshold; alpha=learning rate; e=performance error.

Engineering note: Use bounded thresholds and a small learning rate. Otherwise the controller can oscillate or make unsafe decisions.


## 5. Hardware-Level Multi-Source Power Conversion

Purpose: Links the control algorithm to a concrete converter embodiment with current limits, DC-link protection and power-flow constraints.

## Formula(s)

Example: For the 20 kW converter at 552 V, I_max=20000/552=36.23 A. For the selected 15 kW V2V transfer limit, I=15000/552=27.17 A. These values can be used as current constraints in the simulation and component sizing.

Parameters: P_max=converter rating; V_DC=DC-link voltage; I=current; C=capacitance; R=pre-charge resistance.

Engineering note: A patent claim needs a concrete topology/connection and control interaction, not merely 'a converter'.


## 6. V2V Charging: EV-A to EV-B

This is the additional mechanism you asked to include. EV-A is treated as the energy source and EV-B as the receiving EV. The controller must verify that EV-A is permitted to discharge, EV-B is permitted to charge, the voltage/current limits are satisfied, and the bidirectional converter operates within its limits.

```
P = V * I
I = P/V
E_load = P_load * t
E_source = E_load/eta_converter
Delta_SOC_B = 100 * E_load/E_batt,B
Delta_SOC_A = 100 * E_source/E_batt,A
P_V2V <= MIN(P_converter,max, P_A,max, P_B,max)
```

Worked example: Use a 15 kW V2V transfer limit, V=552 V, converter efficiency eta=0.94 and a 99.8 kWh receiving battery. Current at 15 kW is I=15000/552=27.17 A. If EV-A supplies EV-B with 10 kW for 1 hour, EV-B receives 10 kWh. EV-A must provide 10/0.94=10.64 kWh. For a 99.8 kWh EV-B battery, SOC increase is 100*(10/99.8)=10.02 percentage points. For a 99.8 kWh EV-A battery, the corresponding SOC decrease is approximately 10.66 percentage points if the source battery capacity is also 99.8 kWh.

Energy-flow chain: EV-A battery -> contactor/protection -> bidirectional DC-DC converter -> DC charging interface -> EV-B BMS/charger -> EV-B battery. The controller determines the allowed transfer power and stops the transfer when an SOC, voltage, current, temperature, BMS or communication limit is reached.

Critical real-world point: Do not assume that an ordinary EV can simply discharge through its normal charging socket. The vehicle must expose a supported bidirectional power path or an appropriate V2V/V2G interface. Your simulation can model this path, but a physical prototype needs compatible hardware and BMS authorization.

## 7. Combined ENERFLUX Control Objective

The seven[including the priority formula we discussed earlier] mechanisms can be combined into one optimization objective for the simulation:

```
J = a*C_grid + b*C_deg + c*E_solar_unused - d*R_export + e*P_unserved
```

Minimize J subject to power balance, SOC limits, SOH limits, converter current limits, EV charging limits and V2V limits. This gives the simulator a measurable objective instead of a collection of unrelated if/else rules.


