# Buzz Air Quality Card

> **v1.1.0**

A Home Assistant custom card for displaying air quality and environmental data from [BuzzBridge](https://github.com/ChrisCaho/BuzzBridge) ecobee sensors.

Companion card to [Ecobee Buzz Card](https://github.com/ChrisCaho/ecobee-buzz-card) — uses the same visual style for a unified dashboard experience.

## Features

- **AQ Score Gauge** — Semi-circle SVG gauge with EPA AQI color scale (Green/Yellow/Orange/Red/Purple/Maroon)
- **Sensor Grid** — CO2, VOC, Comfort Index, Temperature, Humidity, Indoor/Outdoor Differential
- **Filter Runtime** — Hours on current filter
- **Bottom Warning Buttons** — Configurable buttons with threshold coloring (same system as ecobee-buzz-card)
- **Auto-Refresh** — Triggers BuzzBridge Refresh Now on dashboard open
- **Tap Actions** — Tap any sensor tile or gauge for more-info popup

## Requirements

- [BuzzBridge](https://github.com/ChrisCaho/BuzzBridge) custom integration installed and configured
- An ecobee thermostat with air quality sensors (e.g., ecobee Smart Thermostat Premium)

## Installation

### HACS (Recommended)
1. Open HACS -> Frontend -> 3 dots -> Custom repositories
2. Add `https://github.com/ChrisCaho/buzz-air-quality` as a Lovelace plugin
3. Search for "Buzz Air Quality Card" and install
4. Restart Home Assistant

### Manual
1. Download `buzz-air-quality.js` from the [latest release](https://github.com/ChrisCaho/buzz-air-quality/releases)
2. Copy to `/config/www/buzz-air-quality.js`
3. Add to Lovelace resources:
   ```yaml
   resources:
     - url: /local/buzz-air-quality.js
       type: module
   ```
4. Restart Home Assistant

## Configuration

Replace `NAME` in entity IDs below with your thermostat name as it appears in BuzzBridge (e.g., `home`, `downstairs`, etc.).

### Card Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `type` | string | Yes | Must be `custom:buzz-air-quality` |
| `name` | string | No | Card title (default: "Air Quality") |
| `aq_score_entity` | string | No | BuzzBridge AQ score sensor (0-100) |
| `co2_entity` | string | No | CO2 sensor (ppm) |
| `voc_entity` | string | No | VOC sensor (ppb) |
| `aq_accuracy_entity` | string | No | AQ accuracy sensor |
| `temperature_entity` | string | No | Temperature sensor |
| `humidity_entity` | string | No | Humidity sensor |
| `comfort_index_entity` | string | No | Comfort index sensor (%) |
| `differential_entity` | string | No | Indoor/outdoor temp differential |
| `filter_runtime_entity` | string | No | Filter runtime sensor (hours) |
| `refresh_now_entity` | string | No | BuzzBridge refresh now button |
| `bottom_buttons` | list | No | Configurable warning buttons (up to 5) |

### AQ Score Color Scale

The AQ score from beestat's `actualAQScore` uses the **raw ecobee direction**: higher score = worse air quality. This is the opposite of what beestat's documentation states (see [Sensor Accuracy & Limitations](#sensor-accuracy--limitations) below).

| Score | Color | Label |
|-------|-------|-------|
| 0-59 | Green | Good |
| 60-79 | Yellow | Moderate |
| 80-99 | Orange | Unhealthy for Sensitive Groups |
| 100+ | Red | Unhealthy |

### Minimal Configuration

```yaml
type: custom:buzz-air-quality
name: Air Quality
aq_score_entity: sensor.buzzbridge_thermostat_NAME_air_quality_score
```

### Full Configuration

```yaml
type: custom:buzz-air-quality
name: Air Quality
aq_score_entity: sensor.buzzbridge_thermostat_NAME_air_quality_score
co2_entity: sensor.buzzbridge_thermostat_NAME_co2
voc_entity: sensor.buzzbridge_thermostat_NAME_voc
aq_accuracy_entity: sensor.buzzbridge_thermostat_NAME_air_quality_accuracy
temperature_entity: sensor.buzzbridge_thermostat_NAME_temperature
humidity_entity: sensor.buzzbridge_thermostat_NAME_humidity
comfort_index_entity: sensor.buzzbridge_thermostat_NAME_comfort_index
differential_entity: sensor.buzzbridge_thermostat_NAME_indoor_outdoor_differential
filter_runtime_entity: sensor.buzzbridge_thermostat_NAME_filter_runtime
refresh_now_entity: button.buzzbridge_thermostat_NAME_refresh_now
bottom_buttons:
  - label: CO2
    icon: "\U0001FAC1"
    entity: sensor.buzzbridge_thermostat_NAME_co2
    unit: " ppm"
    thresholds:
      warning_high: 700
      caution_high: 1000
      critical_high: 1500
    tap_action:
      action: more-info
  - label: VOC
    icon: "\U0001F4A8"
    entity: sensor.buzzbridge_thermostat_NAME_voc
    unit: " ppb"
    thresholds:
      warning_high: 400
      caution_high: 800
      critical_high: 1500
    tap_action:
      action: more-info
  - label: AQ
    icon: "\U0001F32C"
    entity: sensor.buzzbridge_thermostat_NAME_air_quality_score
    unit: ""
    thresholds:
      warning_high: 60
      caution_high: 80
      critical_high: 100
    tap_action:
      action: more-info
  - label: HUMIDITY
    icon: "\U0001F4A7"
    entity: sensor.buzzbridge_thermostat_NAME_humidity
    unit: "%"
    thresholds:
      warning_low: 35
      warning_high: 65
      critical_low: 25
      critical_high: 75
    tap_action:
      action: more-info
```

### Bottom Button Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `label` | string | Yes | Button label text |
| `icon` | string | No | Emoji icon |
| `entity` | string | Yes | Entity to monitor |
| `attribute` | string | No | Specific attribute to display |
| `unit` | string | No | Unit suffix |
| `decimal_places` | number | No | Decimal precision |
| `thresholds` | object | No | Color threshold settings |
| `tap_action` | object | No | Action on button click |

### Threshold Options

Bottom buttons support 4-level coloring to match the mini-graph color bands:
**Green** (safe) → **Yellow** (warning) → **Orange** (caution) → **Red** (critical)

```yaml
thresholds:
  warning_low: 35      # Yellow below this value
  warning_high: 700    # Yellow above this value
  caution_low: 25      # Orange below this value (optional)
  caution_high: 1000   # Orange above this value (optional)
  critical_low: 20     # Red below this value
  critical_high: 1500  # Red above this value
```

### Tap Action Options

```yaml
tap_action:
  action: more-info          # Opens entity detail popup (default)

tap_action:
  action: toggle             # Toggles entity on/off

tap_action:
  action: call-service       # Calls a Home Assistant service
  service: input_number.set_value
  service_data:
    entity_id: input_number.filter_days
    value: 90

tap_action:
  action: navigate           # Navigate to another dashboard view
  navigation_path: /lovelace/climate
```

## Sensor Accuracy & Limitations

### The Bosch BME680 Gas Sensor

The ecobee Smart Thermostat Premium uses a **Bosch BME680** metal-oxide (MOX) gas sensor to measure indoor air quality. This sensor directly measures **total VOC gas resistance** — a single analog reading that responds to a broad mix of volatile organic compounds. From this one measurement, the ecobee firmware derives three values: a VOC reading (ppb), an estimated CO2 level (eCO2, ppm), and an overall air quality score.

**CO2 is not directly measured.** The CO2 value is an *estimate* (eCO2) calculated from the VOC gas resistance using Bosch's BSEC algorithm. Because all three readings derive from the same single gas resistance measurement, they are highly correlated — when one changes, they all change together. This means the CO2 reading cannot distinguish between actual CO2 buildup (from breathing/occupancy) and other VOC sources (cooking, cleaning products, off-gassing furniture). True NDIR CO2 sensors (like the SenseAir S8) measure CO2 directly and are significantly more accurate for CO2 specifically.

The BME680's MOX sensor also requires a **burn-in period** of 48-72 hours after first power-on to stabilize readings, and Bosch recommends running the BSEC algorithm continuously for the first week to establish an accurate baseline. Readings tend to run high compared to reference-grade instruments, particularly for CO2 — typical indoor eCO2 readings of 800-1000 ppm from the BME680 might correspond to 500-700 ppm on an NDIR sensor. The sensor's accuracy is best understood as indicating relative trends and threshold crossings rather than precise absolute values.

### AQ Score Direction

Beestat's documentation states that the `actualAQScore` is normalized to a 0-100 scale where higher = better air quality. However, **observed data shows the opposite**: the score correlates positively with CO2 and VOC levels, meaning higher score = worse air quality. Values also routinely exceed 100 (observed up to 109+), contradicting the documented 0-100 range. This card treats the score in its actual observed direction: **lower = better air, higher = worse air**.

### Sources

- [Bosch BME680 Datasheet](https://www.bosch-sensortec.com/products/environmental-sensors/gas-sensors/bme680/) — sensor specifications and MOX technology
- [Bosch BSEC Algorithm](https://www.bosch-sensortec.com/software-tools/software/bme680-software-bsec/) — the firmware library that converts gas resistance to IAQ/eCO2/VOC
- [EPA Indoor Air Quality Guide](https://www.epa.gov/indoor-air-quality-iaq) — CO2 recommendations (<1000 ppm)
- [ASHRAE Standard 62.1](https://www.ashrae.org/technical-resources/bookstore/standards-62-1-62-2) — ventilation for acceptable indoor air quality
- [PMC3548274](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3548274/) — cognitive performance decline at elevated CO2 levels
- [German Federal Environment Agency (UBA)](https://www.umweltbundesamt.de/) — VOC indoor air guidelines

## Mini-Graph Color Bands

This card pairs well with [mini-graph-card](https://github.com/kalkih/mini-graph-card) for historical trend visualization. Below are the recommended color threshold configurations with **tight transition bands** for distinct color changes at zone boundaries.

### Design Philosophy

mini-graph-card interpolates colors between threshold values. Wide gaps between thresholds create gradual color blending that makes it hard to see when a value enters a new zone. These configs use **narrow 4-unit transition bands** (e.g., green at 58 → yellow at 62) so the line color snaps distinctly when crossing a zone boundary.

### Threshold Zones

**AQ Score** (raw ecobee direction: lower = better):
| Range | Color | Meaning |
|-------|-------|---------|
| 0-59 | Green (#4ade80) | Good air quality |
| 60-79 | Yellow (#facc15) | Moderate — consider ventilation |
| 80-99 | Orange (#fb923c) | Unhealthy for sensitive individuals |
| 100+ | Red (#ef4444) | Unhealthy — ventilate immediately |

**CO2** (estimated, ppm):
| Range | Color | Meaning |
|-------|-------|---------|
| 0-700 | Green (#4ade80) | Well-ventilated space |
| 701-1000 | Yellow (#facc15) | EPA recommended maximum, getting stuffy |
| 1001-1500 | Orange (#fb923c) | Cognitive performance may decline |
| 1500+ | Red (#ef4444) | Seriously stuffy, ventilate now |

**VOC** (ppb):
| Range | Color | Meaning |
|-------|-------|---------|
| 0-400 | Green (#4ade80) | Normal indoor levels |
| 401-800 | Yellow (#facc15) | Slightly elevated |
| 801-1500 | Orange (#fb923c) | Elevated — identify source |
| 1500+ | Red (#ef4444) | High — ventilate and investigate |

**Comfort Index** (BuzzBridge calculated: 70% temperature accuracy + 30% humidity comfort, higher = better):
| Range | Color | Meaning |
|-------|-------|---------|
| 90-100 | Green (#4ade80) | Excellent comfort |
| 75-89 | Yellow (#facc15) | Acceptable |
| 60-74 | Orange (#fb923c) | Uncomfortable |
| 0-59 | Red (#ef4444) | Poor comfort |

See [sample-mini-graph-configs.yaml](sample-mini-graph-configs.yaml) for ready-to-use card configurations.

## Changelog

### v1.1.0 (March 2026)
- **Fix**: Inverted AQ Score color scale — raw ecobee score is higher = worse, not higher = better
- **Fix**: Gauge now handles scores above 100 (visual max capped at 120)
- **Fix**: Gauge label changed from "/100" to "AQ"
- Added sensor accuracy documentation with sources
- Added mini-graph color band documentation
- Added sample mini-graph configuration file

### v1.0.0 (March 2026)
- Initial release
- AQ Score semi-circle gauge with EPA AQI color scale
- 6-tile sensor grid (CO2, VOC, Comfort, Temp, Humidity, Differential)
- Filter runtime display bar
- Configurable bottom warning buttons with threshold coloring
- Auto-refresh BuzzBridge on dashboard open
- Tap-to-open more-info on all tiles and gauge
- Responsive layout (3-column, 2-column on narrow screens)

## Acknowledgments

This card's visual design, bottom button system, and threshold coloring are derived from
[HA Total Climate Card](https://github.com/Mystic369/ha-total-climate-card) by **Traci S Aaron (Mystic369)**.
Thank you to Traci for creating the original card and releasing it as open source — the
card container styling, button patterns, and color-coded alert system in this project
build directly on that work.

The [Ecobee Buzz Card](https://github.com/ChrisCaho/ecobee-buzz-card) (also derived from
HA Total Climate Card) serves as this card's companion for thermostat control.

## Credits

Copyright (c) 2026 Chris Caho

Created by **Chris Caho** with development and architecture by **Claude** (Anthropic).
This project was built using AI-assisted development — Claude wrote the code at the
direction and design of Chris Caho.

Special thanks to the Home Assistant community and the
[BuzzBridge](https://github.com/ChrisCaho/BuzzBridge) / [Beestat](https://beestat.io/)
projects for making ecobee air quality data accessible.

## License

MIT License — see [LICENSE](LICENSE) for details.
