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
