export const STORAGE_KEY = 'soba-stock-data-v1';

export const DEFAULT_ITEMS = [
  { id: 1, name: 'そば粉A', stock: 12, minimum: 5, lastUpdated: '2026-07-04' },
  { id: 2, name: 'そば粉B', stock: 2, minimum: 5, lastUpdated: '2026-07-03' },
  { id: 3, name: 'そば粉C', stock: 0, minimum: 5, lastUpdated: '2026-07-02' },
  { id: 4, name: 'そば粉D', stock: 8, minimum: 5, lastUpdated: '2026-07-04' }
];

export function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

export function loadAppData(storage) {
  if (!storage) {
    return { items: cloneData(DEFAULT_ITEMS), entries: [] };
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return { items: cloneData(DEFAULT_ITEMS), entries: [] };
    }

    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : cloneData(DEFAULT_ITEMS),
      entries: Array.isArray(parsed.entries) ? parsed.entries : []
    };
  } catch (error) {
    return { items: cloneData(DEFAULT_ITEMS), entries: [] };
  }
}

export function saveAppData(state, storage) {
  if (!storage) {
    return state;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function getStockSummary(items, entries = []) {
  const today = new Date().toISOString().slice(0, 10);
  const todayUsage = entries
    .filter((entry) => entry.date === today && entry.type === '使用')
    .reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);

  return {
    currentStock: items.reduce((sum, item) => sum + Number(item.stock || 0), 0),
    needOrderCount: items.filter((item) => Number(item.stock || 0) <= Number(item.minimum || 0)).length,
    todayUsage
  };
}

export function getAlertItems(items) {
  return items
    .filter((item) => Number(item.stock || 0) <= Number(item.minimum || 0))
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
}

export function applyStockEntry(state, entry) {
  const quantity = Number(entry.quantity || 0);
  if (!entry.itemId || !quantity) {
    return state;
  }

  const nextItems = state.items.map((item) => {
    if (item.id !== entry.itemId) {
      return item;
    }

    let nextStock = Number(item.stock || 0);

    if (entry.type === '仕入れ') {
      nextStock += quantity;
    } else if (entry.type === '使用' || entry.type === '廃棄') {
      nextStock = Math.max(0, nextStock - quantity);
    }

    return {
      ...item,
      stock: nextStock,
      lastUpdated: entry.date
    };
  });

  const nextEntries = [
    ...state.entries,
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      itemId: entry.itemId,
      itemName: entry.itemName,
      type: entry.type,
      quantity,
      date: entry.date,
      note: entry.note || ''
    }
  ];

  return {
    items: nextItems,
    entries: nextEntries.slice(-50)
  };
}
