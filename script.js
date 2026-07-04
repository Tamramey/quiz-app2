import {
  applyStockEntry,
  getAlertItems,
  getStockSummary,
  loadAppData,
  saveAppData,
  DEFAULT_ITEMS
} from './app-data.js';

document.addEventListener('DOMContentLoaded', () => {
  const toast = document.createElement('div');
  toast.className = 'toast';
  document.body.appendChild(toast);

  const showToast = (message, type = 'info') => {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  };

  const navigateWithMessage = (event, target, message) => {
    event.preventDefault();
    document.body.classList.add('is-transitioning');
    showToast(message);
    window.setTimeout(() => {
      window.location.href = target;
    }, 350);
  };

  document.querySelectorAll('[data-nav-target]').forEach((element) => {
    element.addEventListener('click', (event) => {
      const target = element.getAttribute('data-nav-target');
      const message = element.getAttribute('data-nav-message');
      if (target && message) {
        navigateWithMessage(event, target, message);
      }
    });
  });

  const state = loadAppData(window.localStorage);
  const currentPage = document.body.dataset.page;

  const renderWeather = async () => {
    const weatherCard = document.getElementById('weather-card');
    const weatherTitle = document.getElementById('weather-summary-title');
    const weatherTemp = document.getElementById('weather-summary-temperature');
    const weatherIcon = document.getElementById('weather-summary-icon');
    const weatherUpdatedAt = document.getElementById('weather-updated-at');
    const weatherMessage = document.getElementById('weather-message');
    const dashboardForecast = document.getElementById('dashboard-forecast-list');
    const registerWeatherCard = document.getElementById('register-weather-card');
    const registerTitle = document.getElementById('register-weather-title');
    const registerSummary = document.getElementById('register-weather-summary');
    const registerUpdatedAt = document.getElementById('register-updated-at');
    const registerMessage = document.getElementById('register-weather-message');
    const registerForecast = document.getElementById('register-forecast-list');

    try {
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo');
      const data = await response.json();
      const daily = data.daily;
      const today = daily.time?.[0];
      const todayWeatherCode = daily.weathercode?.[0];
      const todayMax = daily.temperature_2m_max?.[0];
      const todayMin = daily.temperature_2m_min?.[0];
      const isRainy = [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(todayWeatherCode);
      const weatherText = getWeatherLabel(todayWeatherCode);
      const icon = getWeatherIcon(todayWeatherCode);
      const updatedAtText = new Date().toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
      const rainyMessage = isRainy ? '雨の日は発注を考えよう' : '';

      if (weatherCard) weatherCard.classList.toggle('rainy', isRainy);
      if (registerWeatherCard) registerWeatherCard.classList.toggle('rainy', isRainy);
      if (weatherTitle) weatherTitle.textContent = weatherText;
      if (weatherTemp) weatherTemp.textContent = `最高 ${todayMax}℃・最低 ${todayMin}℃`;
      if (weatherIcon) weatherIcon.textContent = icon;
      if (weatherUpdatedAt) weatherUpdatedAt.textContent = `更新: ${updatedAtText}`;
      if (weatherMessage) weatherMessage.textContent = rainyMessage;
      if (registerTitle) registerTitle.textContent = `${weatherText} / ${todayMax}℃`;
      if (registerSummary) registerSummary.textContent = `最低 ${todayMin}℃・${isRainy ? '雨の予報' : '晴れの予報'}`;
      if (registerUpdatedAt) registerUpdatedAt.textContent = `更新: ${updatedAtText}`;
      if (registerMessage) registerMessage.textContent = rainyMessage;

      const forecastItems = (daily.time || []).slice(0, 5).map((date, index) => {
          const code = daily.weathercode?.[index];
        const max = daily.temperature_2m_max?.[index];
        const min = daily.temperature_2m_min?.[index];
        const isRainyDay = [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code);
        const label = getDayLabel(date);
        return `
          <div class="forecast-item ${isRainyDay ? 'rainy' : ''}">
            <span>${label}</span>
            <strong>${getWeatherIcon(code)}</strong>
            <span>${Math.round(max)}℃</span>
          </div>
        `;
      });

      if (dashboardForecast) dashboardForecast.innerHTML = forecastItems.join('');
      if (registerForecast) registerForecast.innerHTML = forecastItems.join('');
    } catch (error) {
      if (weatherTitle) weatherTitle.textContent = '天気取得失敗';
      if (weatherTemp) weatherTemp.textContent = '再読み込みしてください';
      if (weatherIcon) weatherIcon.textContent = '☁️';
      if (registerTitle) registerTitle.textContent = '天気取得失敗';
      if (registerSummary) registerSummary.textContent = '再読み込みしてください';
    }
  };

  const getWeatherLabel = (code) => {
    const map = {
      0: '快晴',
      1: '晴れ',
      2: '晴れ時々曇',
      3: '曇り',
      45: '霧',
      48: '霧',
      51: '小雨',
      53: '雨',
      55: '雨',
      61: '雨',
      63: '雨',
      65: '大雨',
      71: '雪',
      73: '雪',
      75: '雪',
      80: 'にわか雨',
      81: '雨',
      82: '大雨',
      95: '雷雨',
      96: '雷雨',
      99: '雷雨'
    };
    return map[code] || '晴れ';
  };

  const getWeatherIcon = (code) => {
    const map = {
      0: '☀️',
      1: '☀️',
      2: '🌤️',
      3: '☁️',
      45: '🌫️',
      48: '🌫️',
      51: '🌦️',
      53: '🌧️',
      55: '🌧️',
      61: '🌧️',
      63: '🌧️',
      65: '⛈️',
      71: '❄️',
      73: '❄️',
      75: '❄️',
      80: '🌦️',
      81: '🌧️',
      82: '⛈️',
      95: '⛈️',
      96: '⛈️',
      99: '⛈️'
    };
    return map[code] || '☁️';
  };

  const getDayLabel = (date) => {
    const targetDate = new Date(date);
    const week = ['日', '月', '火', '水', '木', '金', '土'];
    return week[targetDate.getDay()];
  };

  if (currentPage === 'dashboard') {
    const summary = getStockSummary(state.items, state.entries);
    const alertItems = getAlertItems(state.items);

    const currentStockEl = document.getElementById('current-stock');
    const needOrderEl = document.getElementById('need-order');
    const todayUsageEl = document.getElementById('today-usage');
    const alertListEl = document.getElementById('alert-list');

    if (currentStockEl) currentStockEl.textContent = `${summary.currentStock} 袋`;
    if (needOrderEl) needOrderEl.textContent = `${summary.needOrderCount} 件`;
    if (todayUsageEl) todayUsageEl.textContent = `${summary.todayUsage} 袋`;

    if (alertListEl) {
      alertListEl.innerHTML = alertItems.length
        ? alertItems.map((item) => `
            <li>
              <div>
                <strong>${item.name}</strong>
                <p>残り ${item.stock} 袋</p>
              </div>
              <span class="badge ${Number(item.stock) === 0 ? 'danger' : 'warning'}">${Number(item.stock) === 0 ? '在庫切れ' : '要注意'}</span>
            </li>
          `).join('')
        : '<li class="empty-state">在庫に問題はありません。</li>';
    }
  }

  if (currentPage === 'inventory') {
    const inventoryBody = document.getElementById('inventory-body');
    if (inventoryBody) {
      inventoryBody.innerHTML = state.items.map((item) => {
        const statusClass = Number(item.stock) === 0 ? 'status-danger' : Number(item.stock) <= Number(item.minimum) ? 'status-warning' : 'status-ok';
        const statusText = Number(item.stock) === 0 ? '在庫切れ' : Number(item.stock) <= Number(item.minimum) ? '要注意' : '通常';
        return `
          <tr>
            <td>${item.name}</td>
            <td>${item.stock} 袋</td>
            <td>${item.minimum} 袋</td>
            <td><span class="status-pill ${statusClass}">${statusText}</span></td>
            <td>${item.lastUpdated}</td>
          </tr>
        `;
      }).join('');
    }
  }

  const dateInput = document.getElementById('date-input');
  const calendarTitle = document.getElementById('calendar-title');
  const calendarGrid = document.getElementById('calendar-grid');

  if (dateInput && calendarTitle && calendarGrid) {
    let currentDate = new Date(dateInput.value || new Date());

    const renderCalendar = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      calendarTitle.textContent = `${year}/${String(month + 1).padStart(2, '0')}`;

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const firstWeekday = firstDay.getDay();
      const daysInMonth = lastDay.getDate();
      const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

      calendarGrid.innerHTML = '';
      weekDays.forEach((day) => {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'calendar-weekday';
        dayLabel.textContent = day;
        calendarGrid.appendChild(dayLabel);
      });

      for (let i = 0; i < firstWeekday; i += 1) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day';
        emptyCell.textContent = '';
        calendarGrid.appendChild(emptyCell);
      }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'calendar-day';
        button.textContent = String(day);

        const dateValue = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (dateInput.value === dateValue) {
          button.classList.add('is-selected');
        }
        if (new Date().toDateString() === new Date(year, month, day).toDateString()) {
          button.classList.add('is-today');
        }

        button.addEventListener('click', () => {
          dateInput.value = dateValue;
          renderCalendar();
        });

        calendarGrid.appendChild(button);
      }
    };

    document.querySelectorAll('[data-calendar-nav]').forEach((button) => {
      button.addEventListener('click', () => {
        const direction = button.getAttribute('data-calendar-nav');
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'next' ? 1 : -1), 1);
        renderCalendar();
      });
    });

    dateInput.addEventListener('change', () => {
      currentDate = new Date(dateInput.value || new Date());
      renderCalendar();
    });

    renderCalendar();
  }

  renderWeather();

  const form = document.getElementById('stock-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const selectedItem = state.items.find((item) => item.name === formData.get('item'));
      const entry = {
        itemId: selectedItem ? selectedItem.id : null,
        itemName: formData.get('item'),
        type: formData.get('type'),
        quantity: Number(formData.get('quantity')) || 0,
        date: formData.get('date') || new Date().toISOString().slice(0, 10),
        note: formData.get('note') || ''
      };

      const nextState = applyStockEntry(state, entry);
      saveAppData(nextState, window.localStorage);

      document.body.classList.add('is-transitioning');
      showToast('入出庫を登録しました', 'success');
      window.setTimeout(() => {
        window.location.href = 'inventory.html';
      }, 500);
    });
  }
});
