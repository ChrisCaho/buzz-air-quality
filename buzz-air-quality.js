/**
 * Buzz Air Quality Card
 * A Home Assistant custom card for air quality monitoring with BuzzBridge
 *
 * Copyright (c) 2026 Chris Caho
 * Licensed under the MIT License
 * https://github.com/ChrisCaho/buzz-air-quality
 *
 * Visual design, bottom button system, and threshold coloring derived from
 * HA Total Climate Card (https://github.com/Mystic369/ha-total-climate-card)
 * by Traci S Aaron (Mystic369), also licensed under MIT.
 *
 * Built with AI-assisted development by Claude (Anthropic).
 */
const BUZZ_AIR_QUALITY_VERSION = '1.0.0';
console.log(`Buzz Air Quality Card v${BUZZ_AIR_QUALITY_VERSION}: Script loading started...`);

class BuzzAirQualityCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._refreshTriggered = false;
  }

  setConfig(config) {
    this.config = {
      name: config.name || 'Air Quality',
      aq_score_entity: config.aq_score_entity || null,
      co2_entity: config.co2_entity || null,
      voc_entity: config.voc_entity || null,
      aq_accuracy_entity: config.aq_accuracy_entity || null,
      temperature_entity: config.temperature_entity || null,
      humidity_entity: config.humidity_entity || null,
      comfort_index_entity: config.comfort_index_entity || null,
      differential_entity: config.differential_entity || null,
      filter_runtime_entity: config.filter_runtime_entity || null,
      refresh_now_entity: config.refresh_now_entity || null,
      bottom_buttons: config.bottom_buttons || [],
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      this.render();
      this.triggerRefreshNow();
    }
    this.update();
  }

  getCardSize() {
    return 4;
  }

  static getStubConfig() {
    return {
      name: 'Air Quality',
      aq_score_entity: 'sensor.buzzbridge_thermostat_NAME_air_quality_score',
    };
  }

  getAqiColor(score) {
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#facc15';
    if (score >= 40) return '#fb923c';
    if (score >= 20) return '#ef4444';
    if (score >= 10) return '#a855f7';
    return '#991b1b';
  }

  getAqiLabel(score) {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Moderate';
    if (score >= 40) return 'Sensitive';
    if (score >= 20) return 'Unhealthy';
    if (score >= 10) return 'Very Unhealthy';
    return 'Hazardous';
  }

  render() {
    const buttons = this.config.bottom_buttons || [];
    const buttonCount = Math.min(buttons.length, 5);

    let bottomButtonsHtml = '';
    if (buttonCount > 0) {
      let btns = '';
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons[i];
        const icon = button.icon || '';
        btns += `
          <button class="nav-btn" id="bottom-btn-${i}">
            ${icon ? `<div class="nav-btn-icon">${icon}</div>` : ''}
            <div class="nav-btn-label">${button.label || 'BUTTON ' + (i + 1)}</div>
            <div class="nav-btn-value" id="bottom-btn-${i}-value">--</div>
          </button>`;
      }
      bottomButtonsHtml = `<div class="bottom-buttons" style="grid-template-columns: repeat(${buttonCount}, 1fr);">${btns}</div>`;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-width: 0;
          contain: layout style paint;
          overflow: hidden;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes pulse-critical {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes buttonPress {
          0% { transform: scale(1); }
          50% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }

        .card-container {
          background: linear-gradient(165deg, #1e5a7d 0%, #0f3049 50%, #0a1f2e 100%);
          border-radius: 12px;
          padding: 12px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: white;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
          position: relative;
          overflow: hidden;
        }

        .card-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0;
          padding-bottom: 10px;
          gap: 10px;
        }

        .room-name {
          font-size: 16px;
          font-weight: 300;
          letter-spacing: 0.4px;
          flex: 0 0 auto;
        }

        .datetime {
          font-size: 12px;
          opacity: 0.9;
          font-weight: 500;
          flex: 1 1 auto;
          text-align: right;
        }

        /* Gauge Section */
        .gauge-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 12px 12px;
          background: linear-gradient(165deg, rgba(5,15,35,0.9) 0%, rgba(0,8,25,0.95) 100%);
          box-shadow: inset 0 2px 15px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.3);
          margin: 0 -12px;
          position: relative;
        }

        .gauge-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 30px;
          background: linear-gradient(to bottom,
            rgba(30,90,125,0.4) 0%,
            rgba(20,60,90,0.3) 25%,
            rgba(10,40,70,0.2) 50%,
            rgba(5,25,50,0.1) 75%,
            transparent 100%);
          pointer-events: none;
        }

        .gauge-section::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30px;
          background: linear-gradient(to top,
            rgba(30,90,125,0.4) 0%,
            rgba(20,60,90,0.3) 25%,
            rgba(10,40,70,0.2) 50%,
            rgba(5,25,50,0.1) 75%,
            transparent 100%);
          pointer-events: none;
        }

        .gauge-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          opacity: 0.7;
          margin-bottom: 8px;
          z-index: 1;
        }

        .gauge-wrapper {
          position: relative;
          width: 180px;
          height: 110px;
          z-index: 1;
        }

        .gauge-svg {
          width: 180px;
          height: 110px;
        }

        .gauge-score {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -10%);
          text-align: center;
        }

        .gauge-score-value {
          font-size: 42px;
          font-weight: 200;
          line-height: 1;
        }

        .gauge-score-max {
          font-size: 13px;
          opacity: 0.5;
          font-weight: 400;
        }

        .gauge-status {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-top: 4px;
          z-index: 1;
        }

        .gauge-accuracy {
          font-size: 10px;
          opacity: 0.5;
          margin-top: 2px;
          z-index: 1;
        }

        /* Sensor Grid */
        .sensor-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 10px 0 0;
        }

        .sensor-tile {
          background: linear-gradient(145deg, rgba(30,90,125,0.3), rgba(20,60,90,0.25));
          border: 1px solid rgba(100,180,255,0.2);
          border-radius: 10px;
          padding: 10px 8px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }

        .sensor-tile-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.4px;
          opacity: 0.7;
        }

        .sensor-tile-value {
          font-size: 16px;
          font-weight: 300;
        }

        .sensor-tile-unit {
          font-size: 10px;
          opacity: 0.5;
          font-weight: 400;
        }

        /* Filter Bar */
        .filter-bar {
          margin-top: 8px;
          background: linear-gradient(145deg, rgba(30,90,125,0.3), rgba(20,60,90,0.25));
          border: 1px solid rgba(100,180,255,0.2);
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.4px;
          opacity: 0.7;
        }

        .filter-value {
          font-size: 14px;
          font-weight: 300;
        }

        /* Bottom Buttons */
        .bottom-buttons {
          display: grid;
          gap: 8px;
          margin-top: 8px;
        }

        .nav-btn {
          background: linear-gradient(145deg, rgba(30,90,125,0.3), rgba(20,60,90,0.25));
          border: 1px solid rgba(100,180,255,0.2);
          border-radius: 10px;
          padding: 10px 6px;
          color: white;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          position: relative;
          min-height: 52px;
        }

        .nav-btn::after {
          content: '';
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          transition: all 0.3s ease;
        }

        .nav-btn.status-on::after {
          background: #4ade80;
          box-shadow: 0 0 8px #4ade80, 0 0 16px rgba(74,222,128,0.4);
          animation: pulse 2s ease-in-out infinite;
        }

        .nav-btn:hover {
          background: linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.1));
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
        }

        .nav-btn:active {
          animation: buttonPress 0.15s ease;
        }

        .nav-btn.status-on {
          background: linear-gradient(145deg, rgba(74, 222, 128, 0.3), rgba(34, 197, 94, 0.2));
          border-color: rgba(74, 222, 128, 0.4);
        }

        .nav-btn.status-warning {
          background: linear-gradient(145deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.2));
          border-color: rgba(251, 191, 36, 0.4);
        }

        .nav-btn.status-critical {
          background: linear-gradient(145deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.2));
          border-color: rgba(239, 68, 68, 0.4);
          animation: pulse-critical 2s ease-in-out infinite;
        }

        .nav-btn-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.4px;
        }

        .nav-btn-value {
          font-size: 9px;
          opacity: 0.85;
          font-weight: 500;
        }

        .nav-btn-icon {
          font-size: 16px;
          margin-bottom: 2px;
        }

        @media (max-width: 400px) {
          .sensor-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      </style>

      <ha-card>
        <div class="card-container">
          <div class="header">
            <div class="room-name">${this.config.name}</div>
            <div class="datetime" id="datetime">--</div>
          </div>

          <div class="gauge-section">
            <div class="gauge-label">AQ SCORE</div>
            <div class="gauge-wrapper">
              <svg class="gauge-svg" viewBox="0 0 180 110">
                <path d="M 15 100 A 75 75 0 0 1 165 100"
                      fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="10" stroke-linecap="round"/>
                <path id="gauge-arc" d="M 15 100 A 75 75 0 0 1 165 100"
                      fill="none" stroke="#4ade80" stroke-width="10" stroke-linecap="round"
                      stroke-dasharray="236" stroke-dashoffset="236"/>
              </svg>
              <div class="gauge-score">
                <div class="gauge-score-value" id="gauge-value">--</div>
                <div class="gauge-score-max">/100</div>
              </div>
            </div>
            <div class="gauge-status" id="gauge-status">--</div>
            <div class="gauge-accuracy" id="gauge-accuracy"></div>
          </div>

          <div class="sensor-grid">
            <div class="sensor-tile" id="tile-co2">
              <div class="sensor-tile-label">CO2</div>
              <div class="sensor-tile-value" id="val-co2">--</div>
              <div class="sensor-tile-unit">ppm</div>
            </div>
            <div class="sensor-tile" id="tile-voc">
              <div class="sensor-tile-label">VOC</div>
              <div class="sensor-tile-value" id="val-voc">--</div>
              <div class="sensor-tile-unit">ppb</div>
            </div>
            <div class="sensor-tile" id="tile-comfort">
              <div class="sensor-tile-label">COMFORT</div>
              <div class="sensor-tile-value" id="val-comfort">--</div>
              <div class="sensor-tile-unit">%</div>
            </div>
            <div class="sensor-tile" id="tile-temp">
              <div class="sensor-tile-label">TEMP</div>
              <div class="sensor-tile-value" id="val-temp">--</div>
              <div class="sensor-tile-unit">&deg;F</div>
            </div>
            <div class="sensor-tile" id="tile-humidity">
              <div class="sensor-tile-label">HUMIDITY</div>
              <div class="sensor-tile-value" id="val-humidity">--</div>
              <div class="sensor-tile-unit">%</div>
            </div>
            <div class="sensor-tile" id="tile-diff">
              <div class="sensor-tile-label">&Delta; TEMP</div>
              <div class="sensor-tile-value" id="val-diff">--</div>
              <div class="sensor-tile-unit">&deg;F</div>
            </div>
          </div>

          ${this.config.filter_runtime_entity ? `
          <div class="filter-bar" id="filter-bar">
            <div class="filter-label">FILTER</div>
            <div class="filter-value" id="val-filter">-- h</div>
          </div>` : ''}

          ${bottomButtonsHtml}
        </div>
      </ha-card>
    `;

    this.content = this.shadowRoot.querySelector('.card-container');

    // Event listeners for bottom buttons
    const btns = this.config.bottom_buttons || [];
    for (let i = 0; i < btns.length; i++) {
      const btn = this.shadowRoot.getElementById(`bottom-btn-${i}`);
      if (btn) {
        btn.addEventListener('click', () => this.handleBottomButton(i));
      }
    }

    // Sensor tile tap → more-info
    const tileMap = {
      'tile-co2': this.config.co2_entity,
      'tile-voc': this.config.voc_entity,
      'tile-comfort': this.config.comfort_index_entity,
      'tile-temp': this.config.temperature_entity,
      'tile-humidity': this.config.humidity_entity,
      'tile-diff': this.config.differential_entity,
    };
    for (const [id, entityId] of Object.entries(tileMap)) {
      if (!entityId) continue;
      const el = this.shadowRoot.getElementById(id);
      if (el) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => this.fireMoreInfo(entityId));
      }
    }

    // Gauge tap → more-info for AQ score
    if (this.config.aq_score_entity) {
      const gaugeWrapper = this.shadowRoot.querySelector('.gauge-wrapper');
      if (gaugeWrapper) {
        gaugeWrapper.style.cursor = 'pointer';
        gaugeWrapper.addEventListener('click', () => this.fireMoreInfo(this.config.aq_score_entity));
      }
    }

    // Filter bar tap → more-info
    if (this.config.filter_runtime_entity) {
      const filterBar = this.shadowRoot.getElementById('filter-bar');
      if (filterBar) {
        filterBar.style.cursor = 'pointer';
        filterBar.addEventListener('click', () => this.fireMoreInfo(this.config.filter_runtime_entity));
      }
    }
  }

  update() {
    if (!this._hass || !this.content) return;
    this.updateDatetime();
    this.updateGauge();
    this.updateSensorGrid();
    this.updateFilter();
    this.updateBottomButtons();
  }

  updateDatetime() {
    const el = this.shadowRoot.getElementById('datetime');
    if (!el) return;
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    el.textContent = `${days[now.getDay()]} ${months[now.getMonth()]} ${now.getDate()}`;
  }

  updateGauge() {
    const valueEl = this.shadowRoot.getElementById('gauge-value');
    const arcEl = this.shadowRoot.getElementById('gauge-arc');
    const statusEl = this.shadowRoot.getElementById('gauge-status');
    const accuracyEl = this.shadowRoot.getElementById('gauge-accuracy');
    if (!valueEl || !arcEl) return;

    if (!this.config.aq_score_entity) {
      valueEl.textContent = '--';
      return;
    }

    const entity = this._hass.states[this.config.aq_score_entity];
    if (!entity || entity.state === 'unavailable' || entity.state === 'unknown') {
      valueEl.textContent = '--';
      arcEl.style.strokeDashoffset = '236';
      if (statusEl) statusEl.textContent = '--';
      return;
    }

    const score = parseFloat(entity.state);
    if (isNaN(score)) {
      valueEl.textContent = '--';
      return;
    }

    const color = this.getAqiColor(score);
    const label = this.getAqiLabel(score);

    valueEl.textContent = Math.round(score);
    valueEl.style.color = color;

    // Arc: total path length ~236px for semi-circle
    const totalArc = 236;
    const offset = totalArc - (score / 100) * totalArc;
    arcEl.style.strokeDashoffset = offset;
    arcEl.style.stroke = color;
    arcEl.style.transition = 'stroke-dashoffset 0.8s ease, stroke 0.5s ease';

    if (statusEl) {
      statusEl.textContent = label;
      statusEl.style.color = color;
    }

    if (accuracyEl && this.config.aq_accuracy_entity) {
      const accEntity = this._hass.states[this.config.aq_accuracy_entity];
      if (accEntity && accEntity.state !== 'unavailable') {
        accuracyEl.textContent = `Accuracy: ${accEntity.state}`;
      } else {
        accuracyEl.textContent = '';
      }
    }
  }

  updateSensorGrid() {
    const sensors = [
      { id: 'val-co2', entity: this.config.co2_entity, decimals: 0 },
      { id: 'val-voc', entity: this.config.voc_entity, decimals: 0 },
      { id: 'val-comfort', entity: this.config.comfort_index_entity, decimals: 1 },
      { id: 'val-temp', entity: this.config.temperature_entity, decimals: 1 },
      { id: 'val-humidity', entity: this.config.humidity_entity, decimals: 0 },
      { id: 'val-diff', entity: this.config.differential_entity, decimals: 1 },
    ];

    for (const sensor of sensors) {
      const el = this.shadowRoot.getElementById(sensor.id);
      if (!el) continue;

      if (!sensor.entity) {
        el.textContent = '--';
        continue;
      }

      const entity = this._hass.states[sensor.entity];
      if (!entity || entity.state === 'unavailable' || entity.state === 'unknown') {
        el.textContent = '--';
        continue;
      }

      const val = parseFloat(entity.state);
      if (isNaN(val)) {
        el.textContent = entity.state;
      } else {
        el.textContent = val.toFixed(sensor.decimals);
      }
    }
  }

  updateFilter() {
    if (!this.config.filter_runtime_entity) return;
    const el = this.shadowRoot.getElementById('val-filter');
    if (!el) return;

    const entity = this._hass.states[this.config.filter_runtime_entity];
    if (!entity || entity.state === 'unavailable' || entity.state === 'unknown') {
      el.textContent = '-- h';
      return;
    }

    const val = parseFloat(entity.state);
    if (isNaN(val)) {
      el.textContent = entity.state;
    } else {
      el.textContent = `${val.toFixed(1)} h`;
    }
  }

  updateBottomButtons() {
    const buttons = this.config.bottom_buttons || [];
    buttons.forEach((button, index) => {
      if (!button.entity) return;

      const valueEl = this.shadowRoot.getElementById(`bottom-btn-${index}-value`);
      const btnEl = this.shadowRoot.getElementById(`bottom-btn-${index}`);
      if (!valueEl || !btnEl) return;

      const entity = this._hass.states[button.entity];
      if (!entity) {
        valueEl.textContent = '--';
        btnEl.style.background = '';
        return;
      }

      let rawValue = button.attribute ? entity.attributes[button.attribute] : entity.state;
      let displayValue = rawValue;

      if (!isNaN(rawValue)) {
        const numValue = parseFloat(rawValue);
        displayValue = button.decimal_places !== undefined
          ? numValue.toFixed(button.decimal_places)
          : Math.round(numValue);
      }

      if (button.unit) {
        displayValue = `${displayValue}${button.unit}`;
      }

      valueEl.textContent = displayValue;

      btnEl.style.background = '';
      btnEl.classList.remove('status-on', 'status-warning', 'status-critical');

      if (button.thresholds && !isNaN(rawValue)) {
        const numValue = parseFloat(rawValue);
        const thresholds = button.thresholds;

        if (thresholds.critical_low !== undefined && numValue <= thresholds.critical_low) {
          btnEl.classList.add('status-critical');
        } else if (thresholds.critical_high !== undefined && numValue >= thresholds.critical_high) {
          btnEl.classList.add('status-critical');
        } else if (thresholds.warning_low !== undefined && numValue <= thresholds.warning_low) {
          btnEl.classList.add('status-warning');
        } else if (thresholds.warning_high !== undefined && numValue >= thresholds.warning_high) {
          btnEl.classList.add('status-warning');
        } else {
          btnEl.classList.add('status-on');
        }
      } else if (entity.state === 'on') {
        btnEl.classList.add('status-on');
      }
    });
  }

  handleBottomButton(index) {
    const button = this.config.bottom_buttons[index];
    if (!button) return;

    if (button.tap_action && button.tap_action.action === 'more-info') {
      this.fireMoreInfo(button.entity);
      return;
    }

    if (button.tap_action && button.tap_action.action === 'call-service') {
      const serviceParts = button.tap_action.service.split('.');
      this._hass.callService(serviceParts[0], serviceParts[1], button.tap_action.service_data || {});
      return;
    }

    if (button.tap_action && button.tap_action.action === 'navigate') {
      window.history.pushState(null, '', button.tap_action.navigation_path);
      const navEvent = new Event('location-changed', { bubbles: true, composed: true });
      window.dispatchEvent(navEvent);
      return;
    }

    if (button.entity) {
      this.fireMoreInfo(button.entity);
    }
  }

  fireMoreInfo(entityId) {
    const event = new Event('hass-more-info', { bubbles: true, composed: true });
    event.detail = { entityId: entityId };
    this.dispatchEvent(event);
  }

  triggerRefreshNow() {
    if (this._refreshTriggered) return;
    this._refreshTriggered = true;
    if (!this._hass || !this.config.refresh_now_entity) return;
    this._hass.callService('button', 'press', { entity_id: this.config.refresh_now_entity });
  }
}

customElements.define('buzz-air-quality', BuzzAirQualityCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'buzz-air-quality',
  name: 'Buzz Air Quality Card',
  description: 'Air quality monitoring card for BuzzBridge ecobee sensors',
  preview: true,
});

console.log(`Buzz Air Quality Card v${BUZZ_AIR_QUALITY_VERSION}: Registration complete`);
