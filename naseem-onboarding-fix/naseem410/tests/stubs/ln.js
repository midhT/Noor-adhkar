window.__ln = window.__ln || { calls: [], perm: localStorage.getItem('__perm') || 'prompt', exact: 'granted', pending: [] };
const L = window.__ln;
export const LocalNotifications = {
  checkPermissions: async () => ({ display: L.perm }),
  requestPermissions: async () => { L.calls.push(['request']); L.perm = L.nextPerm || 'granted'; localStorage.setItem('__perm', L.perm); return { display: L.perm }; },
  checkExactNotificationSetting: async () => ({ exact_alarm: L.exact }),
  changeExactNotificationSetting: async () => { L.calls.push(['openExact']); L.exact = 'granted'; return { exact_alarm: 'granted' }; },
  createChannel: async c => { L.calls.push(['channel', c]); },
  cancel: async c => { L.calls.push(['cancel', c.notifications.map(n => n.id)]); L.pending = L.pending.filter(p => !c.notifications.some(n => n.id === p.id)); },
  schedule: async c => { L.calls.push(['schedule', JSON.parse(JSON.stringify(c.notifications))]); L.pending.push(...c.notifications); },
  getPending: async () => ({ notifications: L.pending })
};
