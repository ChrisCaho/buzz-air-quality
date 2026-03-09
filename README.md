# Buzz Air Quality Card

A Home Assistant custom card for displaying air quality and environmental data from [BuzzBridge](https://github.com/ChrisCaho/BuzzBridge) ecobee sensors.

Companion card to [Ecobee Buzz Card](https://github.com/ChrisCaho/ecobee-buzz-card) — uses the same visual style for a unified dashboard experience.

## Features

- **AQ Score Gauge** — Semi-circle SVG gauge with EPA AQI color scale (Green/Yellow/Orange/Red/Purple/Maroon)
- **Sensor Grid** — CO2, VOC, Comfort Index, Temperature, Humidity, Indoor/Outdoor Differential
- **Filter Runtime** — Hours on current filter
- **Bottom Warning Buttons** — Configurable buttons with threshold coloring (same system as ecobee-buzz-card)
- **Auto-Refresh** — Triggers BuzzBridge Refresh Now on dashboard open
- **Tap Actions** — Tap any sensor tile or gauge for more-info popup

## Installation

### HACS (Recommended)
1. Open HACS -> Frontend -> 3 dots -> Custom repositories
2. Add `https://github.com/ChrisCaho/buzz-air-quality` as a Lovelace plugin
3. Search for "Buzz Air Quality Card" and install
4. Restart Home Assistant

### Manual
1. Download `buzz-air-quality.js`
2. Copy to `/config/www/buzz-air-quality.js`
3. Add to Lovelace resources:
   ```yaml
   resources:
     - url: /local/buzz-air-quality.js
       type: module
   ```
4. Restart Home Assistant

## Configuration

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

### AQ Score Color Scale (EPA AQI)

| Score | Color | Label |
|-------|-------|-------|
| 80-100 | Green | Good |
| 60-79 | Yellow | Moderate |
| 40-59 | Orange | Sensitive |
| 20-39 | Red | Unhealthy |
| 10-19 | Purple | Very Unhealthy |
| 0-9 | Maroon | Hazardous |

### Minimal Configuration

```yaml
type: custom:buzz-air-quality
name: Studio Air Quality
aq_score_entity: sensor.buzzbridge_thermostat_studio_air_quality_score
```

### Full Configuration

```yaml
type: custom:buzz-air-quality
name: Studio Air Quality
aq_score_entity: sensor.buzzbridge_thermostat_studio_air_quality_score
co2_entity: sensor.buzzbridge_thermostat_studio_co2
voc_entity: sensor.buzzbridge_thermostat_studio_voc
aq_accuracy_entity: sensor.buzzbridge_thermostat_studio_air_quality_accuracy
temperature_entity: sensor.buzzbridge_thermostat_studio_temperature
humidity_entity: sensor.buzzbridge_thermostat_studio_humidity
comfort_index_entity: sensor.buzzbridge_thermostat_studio_comfort_index
differential_entity: sensor.buzzbridge_thermostat_studio_indoor_outdoor_differential
filter_runtime_entity: sensor.buzzbridge_thermostat_studio_filter_runtime
refresh_now_entity: button.buzzbridge_thermostat_studio_refresh_now
bottom_buttons:
  - label: CO2
    icon: "\U0001FAC1"
    entity: sensor.buzzbridge_thermostat_studio_co2
    unit: " ppm"
    thresholds:
      warning_high: 1000
      critical_high: 1500
    tap_action:
      action: more-info
  - label: VOC
    icon: "\U0001F4A8"
    entity: sensor.buzzbridge_thermostat_studio_voc
    unit: " ppb"
    thresholds:
      warning_high: 500
      critical_high: 1000
    tap_action:
      action: more-info
  - label: AQ
    icon: "\U0001F32C"
    entity: sensor.buzzbridge_thermostat_studio_air_quality_score
    unit: ""
    thresholds:
      warning_low: 60
      critical_low: 40
    tap_action:
      action: more-info
  - label: HUMIDITY
    icon: "\U0001F4A7"
    entity: sensor.buzzbridge_thermostat_studio_humidity
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

```yaml
thresholds:
  warning_low: 30      # Yellow below this value
  warning_high: 70     # Yellow above this value
  critical_low: 20     # Red below this value
  critical_high: 80    # Red above this value
```

## Credits

Built with collaboration and assistance from Claude (Anthropic).

## License

MIT License
