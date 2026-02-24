// TZ Sync - Multi-Timezone Meeting Scheduler (Mobile-First)
// Built by Little Bear 🧸

// Default settings
const DEFAULT_SETTINGS = {
  tz1: 'auto',
  tz2: 'Asia/Singapore',
  tz3: 'Europe/Berlin',
  workStart: 9,
  workEnd: 18
};

// Common timezones with labels
const TIMEZONES = [
  { value: 'auto', label: '📍 Auto-detect', city: 'Your Location' },
  { value: 'Asia/Bangkok', label: '🇹🇭 Bangkok', city: 'Bangkok' },
  { value: 'Asia/Singapore', label: '🇸🇬 Singapore', city: 'Singapore' },
  { value: 'Asia/Hong_Kong', label: '🇭🇰 Hong Kong', city: 'Hong Kong' },
  { value: 'Asia/Tokyo', label: '🇯🇵 Tokyo', city: 'Tokyo' },
  { value: 'Asia/Shanghai', label: '🇨🇳 Shanghai', city: 'Shanghai' },
  { value: 'Asia/Dubai', label: '🇦🇪 Dubai', city: 'Dubai' },
  { value: 'Europe/London', label: '🇬🇧 London', city: 'London' },
  { value: 'Europe/Paris', label: '🇫🇷 Paris', city: 'Paris' },
  { value: 'Europe/Berlin', label: '🇩🇪 Berlin', city: 'Berlin' },
  { value: 'Europe/Amsterdam', label: '🇳🇱 Amsterdam', city: 'Amsterdam' },
  { value: 'Europe/Zurich', label: '🇨🇭 Zurich', city: 'Zurich' },
  { value: 'Europe/Moscow', label: '🇷🇺 Moscow', city: 'Moscow' },
  { value: 'America/New_York', label: '🇺🇸 New York', city: 'New York' },
  { value: 'America/Chicago', label: '🇺🇸 Chicago', city: 'Chicago' },
  { value: 'America/Denver', label: '🇺🇸 Denver', city: 'Denver' },
  { value: 'America/Los_Angeles', label: '🇺🇸 Los Angeles', city: 'Los Angeles' },
  { value: 'America/Toronto', label: '🇨🇦 Toronto', city: 'Toronto' },
  { value: 'America/Vancouver', label: '🇨🇦 Vancouver', city: 'Vancouver' },
  { value: 'Australia/Sydney', label: '🇦🇺 Sydney', city: 'Sydney' },
  { value: 'Pacific/Auckland', label: '🇳🇿 Auckland', city: 'Auckland' }
];

// State
let settings = { ...DEFAULT_SETTINGS };
let selectedSlot = null;
let updateInterval;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  populateDropdowns();
  updateDisplay();
  updateInterval = setInterval(updateDisplay, 1000);
  
  // Scroll to current hour
  setTimeout(() => {
    const currentHour = new Date().getHours();
    const slot = document.querySelector(`[data-hour="${currentHour}"]`);
    if (slot) {
      slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
});

// Load settings from localStorage
function loadSettings() {
  const saved = localStorage.getItem('tz-sync-settings');
  if (saved) {
    settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  }
}

// Save settings
function saveSettings() {
  settings.tz1 = document.getElementById('tz1Select').value;
  settings.tz2 = document.getElementById('tz2Select').value;
  settings.tz3 = document.getElementById('tz3Select').value;
  settings.workStart = parseInt(document.getElementById('workStart').value);
  settings.workEnd = parseInt(document.getElementById('workEnd').value);
  localStorage.setItem('tz-sync-settings', JSON.stringify(settings));
  closeSettings();
  updateDisplay();
}

// Populate dropdowns
function populateDropdowns() {
  // Timezone dropdowns
  ['tz1Select', 'tz2Select', 'tz3Select'].forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = TIMEZONES.map(tz => 
      `<option value="${tz.value}" ${settings[id.replace('Select', '')] === tz.value ? 'selected' : ''}>${tz.label}</option>`
    ).join('');
  });
  
  // Work hours dropdowns
  const workStart = document.getElementById('workStart');
  const workEnd = document.getElementById('workEnd');
  
  for (let h = 0; h < 24; h++) {
    const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    workStart.innerHTML += `<option value="${h}" ${settings.workStart === h ? 'selected' : ''}>${label}</option>`;
    workEnd.innerHTML += `<option value="${h}" ${settings.workEnd === h ? 'selected' : ''}>${label}</option>`;
  }
}

// Get resolved timezone
function getResolvedTimezone(tz) {
  return tz === 'auto' ? Intl.DateTimeFormat().resolvedOptions().timeZone : tz;
}

// Get timezone info
function getTimezoneInfo(tz) {
  return TIMEZONES.find(t => t.value === tz) || TIMEZONES[0];
}

// Format time
function formatTime(date, timezone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

// Get hour in timezone
function getHourInTimezone(date, timezone) {
  return parseInt(new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    hour12: false
  }).format(date));
}

// Get offset string
function getOffsetString(timezone, date = new Date()) {
  try {
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const diff = (tzDate - utcDate) / (1000 * 60 * 60);
    const sign = diff >= 0 ? '+' : '';
    const hours = Math.floor(Math.abs(diff));
    const mins = Math.round((Math.abs(diff) % 1) * 60);
    return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  } catch {
    return '+00:00';
  }
}

// Check if hour is in work hours
function isWorkHour(hour) {
  return hour >= settings.workStart && hour < settings.workEnd;
}

// Update display
function updateDisplay() {
  const now = new Date();
  
  // Update date header
  document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  const tz1 = getResolvedTimezone(settings.tz1);
  const tz2 = getResolvedTimezone(settings.tz2);
  const tz3 = getResolvedTimezone(settings.tz3);
  
  const zones = [
    { tz: tz1, info: getTimezoneInfo(settings.tz1), setting: settings.tz1 },
    { tz: tz2, info: getTimezoneInfo(settings.tz2), setting: settings.tz2 },
    { tz: tz3, info: getTimezoneInfo(settings.tz3), setting: settings.tz3 }
  ];
  
  updateCurrentTimeCards(now, zones);
  updateTimeline(now, zones);
}

// Update horizontal scrollable time cards
function updateCurrentTimeCards(now, zones) {
  const container = document.getElementById('currentTimeCards');
  
  container.innerHTML = zones.map(({ tz, info }) => {
    const time = formatTime(now, tz);
    const hour = getHourInTimezone(now, tz);
    const offset = getOffsetString(tz, now);
    const isGood = isWorkHour(hour);
    
    return `
      <div class="flex-shrink-0 w-32 bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 snap-start">
        <div class="text-xs text-slate-500 mb-1 truncate">${info.city}</div>
        <div class="text-2xl font-mono font-medium">${time}</div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs text-slate-500">UTC${offset}</span>
          ${isGood ? '<span class="w-2 h-2 rounded-full bg-green-500"></span>' : '<span class="w-2 h-2 rounded-full bg-slate-600"></span>'}
        </div>
      </div>
    `;
  }).join('');
}

// Update vertical timeline
function updateTimeline(now, zones) {
  const container = document.getElementById('timelineSlots');
  const currentHour = now.getHours();
  
  let html = '';
  
  for (let h = 0; h < 24; h++) {
    // Get hour in each timezone
    const hours = zones.map(({ tz }) => {
      const testDate = new Date(now);
      testDate.setHours(h, 0, 0, 0);
      return getHourInTimezone(testDate, tz);
    });
    
    // Check if all zones are in work hours
    const allInWorkHours = hours.every(hr => isWorkHour(hr));
    const isCurrentHour = h === currentHour;
    
    // Determine row class
    let rowClass = 'slot-row px-4 py-3 flex items-center gap-3';
    if (allInWorkHours) rowClass += ' good-meeting';
    if (isCurrentHour) rowClass += ' current-hour';
    
    // Format label
    const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    
    html += `
      <div class="${rowClass}" data-hour="${h}" onclick="openSlotModal(${h})">
        <div class="time-badge font-mono text-sm ${isCurrentHour ? 'text-blue-400 font-medium' : 'text-slate-400'}">
          ${label}
        </div>
        <div class="flex-1 flex gap-2">
          ${zones.map(({ tz, info }, i) => {
            const testDate = new Date(now);
            testDate.setHours(h, 0, 0, 0);
            const timeThere = formatTime(testDate, tz);
            const hourThere = hours[i];
            const isGood = isWorkHour(hourThere);
            return `
              <div class="flex-1 bg-slate-700/30 rounded-lg px-2 py-1.5 text-center">
                <div class="text-xs text-slate-500">${info.city.slice(0, 3)}</div>
                <div class="font-mono text-sm ${isGood ? 'text-green-400' : 'text-slate-300'}">${timeThere}</div>
              </div>
            `;
          }).join('')}
        </div>
        ${allInWorkHours ? '<span class="text-green-500 text-lg">✓</span>' : ''}
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// Open slot details modal
function openSlotModal(hour) {
  const now = new Date();
  const testDate = new Date(now);
  testDate.setHours(hour, 0, 0, 0);
  
  const zones = [
    { tz: getResolvedTimezone(settings.tz1), info: getTimezoneInfo(settings.tz1) },
    { tz: getResolvedTimezone(settings.tz2), info: getTimezoneInfo(settings.tz2) },
    { tz: getResolvedTimezone(settings.tz3), info: getTimezoneInfo(settings.tz3) }
  ];
  
  const label = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
  
  selectedSlot = { hour, zones, label };
  
  document.getElementById('slotModalContent').innerHTML = `
    <div class="text-center mb-4">
      <div class="text-2xl font-bold">${label}</div>
      <div class="text-sm text-slate-400">Your local time</div>
    </div>
    <div class="space-y-3">
      ${zones.map(({ tz, info }) => {
        const timeThere = formatTime(testDate, tz);
        const hourThere = getHourInTimezone(testDate, tz);
        const isGood = isWorkHour(hourThere);
        return `
          <div class="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
            <div class="flex items-center gap-3">
              <span class="text-lg">${info.label.split(' ')[0]}</span>
              <span class="text-slate-300">${info.city}</span>
            </div>
            <div class="text-right">
              <div class="font-mono text-lg ${isGood ? 'text-green-400' : 'text-white'}">${timeThere}</div>
              ${isGood ? '<div class="text-xs text-green-500">Work hours</div>' : '<div class="text-xs text-slate-500">Off hours</div>'}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  document.getElementById('slotModal').classList.remove('hidden');
  document.getElementById('slotModal').classList.add('flex');
}

// Close slot modal
function closeSlotModal() {
  document.getElementById('slotModal').classList.add('hidden');
  document.getElementById('slotModal').classList.remove('flex');
}

// Copy slot details
function copySlotDetails() {
  if (!selectedSlot) return;
  
  const now = new Date();
  const testDate = new Date(now);
  testDate.setHours(selectedSlot.hour, 0, 0, 0);
  
  const lines = selectedSlot.zones.map(({ tz, info }) => {
    const time = formatTime(testDate, tz);
    return `${info.city}: ${time}`;
  });
  
  const text = `${selectedSlot.label} local time\n${lines.join('\n')}`;
  
  navigator.clipboard.writeText(text).then(() => {
    // Brief visual feedback
    const btn = document.querySelector('#slotModal button[onclick="copySlotDetails()"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Copied!';
    setTimeout(() => btn.innerHTML = original, 1500);
  });
}

// Open settings
function openSettings() {
  document.getElementById('settingsModal').classList.remove('hidden');
  document.getElementById('settingsModal').classList.add('flex');
}

// Close settings
function closeSettings() {
  document.getElementById('settingsModal').classList.add('hidden');
  document.getElementById('settingsModal').classList.remove('flex');
}

// Close modals on backdrop click
document.getElementById('slotModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeSlotModal();
});

document.getElementById('settingsModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeSettings();
});
