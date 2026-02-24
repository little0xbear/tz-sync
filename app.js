// TZ Sync - Multi-Timezone Meeting Scheduler
// Built by Little Bear 🐻

// Configuration
const DEFAULT_SETTINGS = {
  tz1: 'auto', // User's timezone (auto-detect)
  tz2: 'Asia/Singapore', // HK/Singapore
  tz3: 'Europe/Berlin', // CET
};

// Timezone metadata
const TIMEZONE_INFO = {
  'auto': { label: 'Your Time', flag: '📍', shortLabel: 'YOU' },
  'Asia/Singapore': { label: 'Singapore', flag: '🇸🇬', shortLabel: 'SG' },
  'Asia/Hong_Kong': { label: 'Hong Kong', flag: '🇭🇰', shortLabel: 'HK' },
  'Europe/Berlin': { label: 'Berlin', flag: '🇩🇪', shortLabel: 'CET' },
  'Europe/Paris': { label: 'Paris', flag: '🇫🇷', shortLabel: 'CET' },
  'Europe/Amsterdam': { label: 'Amsterdam', flag: '🇳🇱', shortLabel: 'CET' },
  'Europe/Zurich': { label: 'Zurich', flag: '🇨🇭', shortLabel: 'CET' },
  'Asia/Bangkok': { label: 'Bangkok', flag: '🇹🇭', shortLabel: 'BKK' },
};

// State
let settings = { ...DEFAULT_SETTINGS };
let updateInterval;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  populateTimezoneDropdowns();
  updateDisplay();
  updateInterval = setInterval(updateDisplay, 1000);
});

// Load settings from localStorage
function loadSettings() {
  const saved = localStorage.getItem('tz-sync-settings');
  if (saved) {
    settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  }
}

// Save settings to localStorage
function saveSettings() {
  settings.tz1 = document.getElementById('tz1').value;
  settings.tz2 = document.getElementById('tz2').value;
  settings.tz3 = document.getElementById('tz3').value;
  localStorage.setItem('tz-sync-settings', JSON.stringify(settings));
  toggleSettings();
  updateDisplay();
}

// Get resolved timezone (handle 'auto')
function getResolvedTimezone(tz) {
  if (tz === 'auto') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return tz;
}

// Populate timezone dropdowns
function populateTimezoneDropdowns() {
  const commonTimezones = [
    { value: 'auto', label: 'Auto-detect' },
    { value: 'Asia/Singapore', label: '🇸🇬 Singapore' },
    { value: 'Asia/Hong_Kong', label: '🇭🇰 Hong Kong' },
    { value: 'Asia/Bangkok', label: '🇹🇭 Bangkok' },
    { value: 'Europe/Berlin', label: '🇩🇪 Berlin (CET)' },
    { value: 'Europe/Paris', label: '🇫🇷 Paris (CET)' },
    { value: 'Europe/Amsterdam', label: '🇳🇱 Amsterdam (CET)' },
    { value: 'Europe/Zurich', label: '🇨🇭 Zurich (CET)' },
    { value: 'Europe/London', label: '🇬🇧 London (GMT)' },
    { value: 'America/New_York', label: '🇺🇸 New York (EST)' },
    { value: 'America/Los_Angeles', label: '🇺🇸 Los Angeles (PST)' },
    { value: 'Asia/Tokyo', label: '🇯🇵 Tokyo (JST)' },
  ];

  ['tz1', 'tz2', 'tz3'].forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = '';
    commonTimezones.forEach(tz => {
      const option = document.createElement('option');
      option.value = tz.value;
      option.textContent = tz.label;
      if (settings[id] === tz.value) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  });
}

// Format time for a timezone
function formatTime(date, timezone, format = 'full') {
  const options = {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  
  if (format === 'full') {
    options.weekday = 'short';
    options.day = 'numeric';
    options.month = 'short';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

// Get hour in timezone (0-23)
function getHourInTimezone(date, timezone) {
  return parseInt(new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    hour12: false,
  }).format(date));
}

// Get offset string (e.g., "+08:00")
function getOffsetString(timezone, date = new Date()) {
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const diff = (tzDate - utcDate) / (1000 * 60 * 60);
  const sign = diff >= 0 ? '+' : '';
  const hours = Math.floor(Math.abs(diff));
  const mins = Math.round((Math.abs(diff) % 1) * 60);
  return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Check if hour is in "good meeting hours" (9 AM - 6 PM)
function isGoodMeetingHour(hour) {
  return hour >= 9 && hour < 18;
}

// Update main display
function updateDisplay() {
  const now = new Date();
  
  // Update date header
  document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // Get resolved timezones
  const tz1 = getResolvedTimezone(settings.tz1);
  const tz2 = settings.tz2;
  const tz3 = settings.tz3;
  
  const timezones = [
    { id: 'tz1', tz: tz1, info: TIMEZONE_INFO[settings.tz1] || TIMEZONE_INFO['auto'] },
    { id: 'tz2', tz: tz2, info: TIMEZONE_INFO[tz2] },
    { id: 'tz3', tz: tz3, info: TIMEZONE_INFO[tz3] },
  ];
  
  // Update timezone cards
  updateCards(now, timezones);
  
  // Update timeline
  updateTimeline(now, timezones);
  
  // Update quick reference
  updateQuickReference(now, timezones);
  
  // Update current time indicator position
  updateCurrentTimeIndicator(now, timezones[0].tz);
}

// Update timezone cards
function updateCards(now, timezones) {
  const container = document.getElementById('timezoneCards');
  container.innerHTML = timezones.map(({ tz, info }, index) => {
    const time = formatTime(now, tz);
    const offset = getOffsetString(tz, now);
    const hour = getHourInTimezone(now, tz);
    const isGood = isGoodMeetingHour(hour);
    const statusColor = isGood ? 'bg-green-500' : 'bg-slate-500';
    
    return `
      <div class="timezone-card bg-slate-800/80 rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="text-3xl">${info.flag}</span>
            <div>
              <h3 class="font-semibold text-lg">${info.label}</h3>
              <p class="text-sm text-slate-400">UTC ${offset}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full ${statusColor}"></span>
            <span class="text-xs text-slate-400">${isGood ? 'Work hours' : 'Off hours'}</span>
          </div>
        </div>
        <div class="text-5xl font-mono font-medium tracking-tight">
          ${time.split(',')[0]}
        </div>
        <div class="mt-2 text-sm text-slate-400">
          ${time.split(',').slice(1).join(',').trim()}
        </div>
      </div>
    `;
  }).join('');
}

// Update timeline view
function updateTimeline(now, timezones) {
  const container = document.getElementById('timelineRows');
  
  container.innerHTML = timezones.map(({ tz, info }) => {
    const currentHour = getHourInTimezone(now, tz);
    
    // Generate 24 hour blocks
    let hours = '';
    for (let h = 0; h < 24; h++) {
      const isGood = isGoodMeetingHour(h);
      const isCurrent = h === currentHour;
      const baseClass = isGood ? 'bg-green-500/20' : 'bg-slate-700/30';
      const currentClass = isCurrent ? 'ring-2 ring-white ring-opacity-50' : '';
      hours += `<div class="flex-1 h-8 ${baseClass} ${currentClass} hour-marker flex items-center justify-center text-xs text-slate-400 border-r border-slate-700/30 last:border-r-0">${h.toString().padStart(2, '0')}</div>`;
    }
    
    return `
      <div class="flex items-center gap-4">
        <div class="w-20 flex-shrink-0">
          <span class="text-xl">${info.flag}</span>
          <span class="text-sm text-slate-400 ml-1">${info.shortLabel}</span>
        </div>
        <div class="flex-1 flex rounded-lg overflow-hidden">
          ${hours}
        </div>
      </div>
    `;
  }).join('');
}

// Update quick reference grid
function updateQuickReference(now, timezones) {
  const container = document.getElementById('quickReference');
  
  // Key times: 9 AM, 12 PM, 3 PM, 6 PM in first timezone
  const refHours = [9, 12, 15, 18];
  const userTz = timezones[0].tz;
  
  container.innerHTML = refHours.map(hour => {
    // Create a date for this hour today in user's timezone
    const refDate = new Date(now);
    refDate.setHours(hour, 0, 0, 0);
    
    const label = hour === 12 ? 'Noon' : `${hour}:00`;
    
    return `
      <div class="bg-slate-700/30 rounded-lg p-3 text-center">
        <div class="text-xs text-slate-400 mb-1">${label} local</div>
        <div class="space-y-1">
          ${timezones.slice(1).map(({ tz, info }) => {
            const timeThere = formatTime(refDate, tz).split(',')[0];
            return `<div class="text-sm"><span class="text-slate-500">${info.shortLabel}:</span> ${timeThere}</div>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Update current time indicator position
function updateCurrentTimeIndicator(now, userTz) {
  const indicator = document.getElementById('currentTimeIndicator');
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const percentage = ((hour * 60 + minutes) / (24 * 60)) * 100;
  indicator.style.left = `${percentage}%`;
}

// Toggle settings modal
function toggleSettings() {
  const modal = document.getElementById('settingsModal');
  if (modal.classList.contains('hidden')) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } else {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Close modal on outside click
document.getElementById('settingsModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    toggleSettings();
  }
});
