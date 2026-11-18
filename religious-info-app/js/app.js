'use strict';

const KEYS = {
  members: 'religiousInfoMembers',
  settings: 'religiousInfoSettings',
  logos: 'religiousInfoLogos',
  attendance: 'religiousInfoAttendance',
  results: 'religiousInfoResults'
};

const RELIGIONS = [
  { id: 'orthodox', en: 'Ethiopian Orthodox Tewahedo', am: 'ኢትዮጵያ ኦርቶዶክስ ተዋሕዶ', icon: 'EO' },
  { id: 'islam', en: 'Islam', am: 'እስልምና', icon: 'IS' },
  { id: 'catholic', en: 'Catholic', am: 'ካቶሊክ', icon: 'CA' },
  { id: 'protestant', en: 'Protestant', am: 'ፕሮቴስታንት', icon: 'PR' },
  { id: 'other', en: 'Other Religions', am: 'ሌሎች ሃይማኖቶች', icon: 'OR' }
];
const ORGS = [
  { id: 'mah', en: 'Mahibere Kidusan', am: 'ማኅበረ ቅዱሳን', icon: 'MK' },
  { id: 'gibi', en: 'Gibi Gubae', am: 'ግቢ ጉባኤ', icon: 'GG' },
  { id: 'sunday-school', en: 'Sunday School', am: 'ሰንበት ትምህርት ቤት', icon: 'SS' }
];
const YEARS = [
  ['first-year', 'First Year', 'አንደኛ ዓመት'],
  ['second-year', 'Second Year', 'ሁለተኛ ዓመት'],
  ['third-year', 'Third Year', 'ሦስተኛ ዓመት'],
  ['fourth-year', 'Fourth Year', 'አራተኛ ዓመት'],
  ['fifth-year', 'Fifth Year', 'አምስተኛ ዓመት'],
  ['sixth-year', 'Sixth Year', 'ስድስተኛ ዓመት'],
  ['seventh-year', 'Seventh Year', 'ሰባተኛ ዓመት']
].map(([id, en, am]) => ({ id, en, am }));
const CATEGORIES = [
  { id: 'children', en: 'Children', am: 'ሕፃናት' },
  { id: 'youth', en: 'Youth', am: 'ወጣቶች' },
  { id: 'adults', en: 'Adults', am: 'አዋቂዎች' }
];
const GENDERS = [
  { value: 'Male', label: 'Male – ወንድ' },
  { value: 'Female', label: 'Female – ሴት' },
  { value: 'Non-Binary', label: 'Non-Binary – ምንም የሌለም' }
];
const STATUS_OPTIONS = [
  ['Present', 'Present – ተገኝቷል'],
  ['Absent', 'Absent – ቀርቷል'],
  ['Late', 'Late – ዘግይቶ መጥቷል']
];
const DEFAULT_GRADE_RULES = [
  { grade: 'A', minimum: 90 },
  { grade: 'B', minimum: 80 },
  { grade: 'C', minimum: 70 },
  { grade: 'D', minimum: 60 },
  { grade: 'E', minimum: 50 },
  { grade: 'F', minimum: 0 }
];

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const dialog = document.querySelector('#details-dialog');
const state = {
  view: 'dashboard',
  context: {},
  tab: 'members',
  form: emptyMember(),
  editingMember: '',
  resultForm: emptyResult(),
  editingResult: '',
  notice: null,
  search: '',
  ageFilter: '',
  genderFilter: '',
  sort: { key: 'registrationDate', direction: 'desc' },
  attendanceDate: today(),
  attendanceSearch: '',
  attendanceStatus: {},
  reportSearch: '',
  reportPeriod: 'all',
  reportDate: today(),
  logoDraft: '',
  logoDraftKey: ''
};

function emptyMember() {
  return {
    fullName: '', memberId: '', age: '', gender: 'Male', phone: '', address: '',
    registrationDate: today(), photo: '', guardianName: '', guardianPhone: ''
  };
}

function saveGradeRules() {
  const nextRules = DEFAULT_GRADE_RULES.map((rule) => {
    const input = document.querySelector(`[data-grade-min="${rule.grade}"]`);
    return { grade: rule.grade, minimum: rule.grade === 'F' ? 0 : Number(input?.value) };
  });
  const invalid = nextRules.some((rule) => !Number.isFinite(rule.minimum) || rule.minimum < 0 || rule.minimum > 100)
    || nextRules.slice(0, -1).some((rule, index) => rule.minimum <= nextRules[index + 1].minimum);
  if (invalid) {
    showToast('Use thresholds from 0 to 100, in strictly descending order – መቶኛዎችን ከ0 እስከ 100 በተከታታይ ከፍ የሚል ቅደም ተከተል ያስገቡ።', true);
    return;
  }
  const settings = read(KEYS.settings, {});
  const nextSettings = settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {};
  nextSettings.gradeRules = nextRules;
  if (write(KEYS.settings, nextSettings)) {
    showToast('Grading rules saved – የውጤት ደረጃ መመሪያዎች ተቀምጠዋል።');
    render();
  }
}

function emptyResult() {
  return {
    memberId: '', subject: '', examType: 'Midterm', academicYear: YEARS[0].id,
    semester: 'Semester 1', totalMarks: '100', obtainedMarks: '', remark: ''
  };
}

function today() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function uniqueId() {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `ri-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.error(`Unable to read ${key} from LocalStorage`, error);
    state.notice = { type: 'error', text: `Saved data for ${key} could not be read – የተቀመጠው መረጃ ማንበብ አልተቻለም።` };
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Unable to save ${key} to LocalStorage`, error);
    showToast('Could not save. Browser storage may be full – ማስቀመጥ አልተቻለም፤ የአሳሹ ማከማቻ ሙሉ ሊሆን ይችላል።', true);
    return false;
  }
}

function members() {
  const saved = read(KEYS.members, []);
  return Array.isArray(saved) ? saved : [];
}

function attendance() {
  const saved = read(KEYS.attendance, []);
  return Array.isArray(saved) ? saved : [];
}

function results() {
  const saved = read(KEYS.results, []);
  return Array.isArray(saved) ? saved : [];
}

function logos() {
  const saved = read(KEYS.logos, {});
  return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
}

function gradeRules() {
  const settings = read(KEYS.settings, {});
  const savedRules = settings && Array.isArray(settings.gradeRules) ? settings.gradeRules : null;
  if (!savedRules || savedRules.length !== DEFAULT_GRADE_RULES.length) return DEFAULT_GRADE_RULES;
  const valid = savedRules.every((rule, index) =>
    rule.grade === DEFAULT_GRADE_RULES[index].grade
    && Number.isFinite(Number(rule.minimum))
    && Number(rule.minimum) >= 0
    && Number(rule.minimum) <= 100
  );
  return valid ? savedRules.map((rule) => ({ grade: rule.grade, minimum: Number(rule.minimum) })) : DEFAULT_GRADE_RULES;
}

function showToast(message, type = 'success') {
  const toastType = typeof type === 'boolean' ? (type ? 'error' : 'success') : type;
  toast.textContent = message;
  toast.dataset.type = toastType;
  toast.classList.add('visible');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('visible'), 3600);
}

function itemById(items, id) {
  return items.find((item) => item.id === id);
}

function contextKey(context = state.context) {
  return [
    context.religion || '',
    context.organization || '',
    context.year || '',
    context.category || '',
    context.customReligionName || ''
  ].join('|');
}

function sectionMembers(context = state.context) {
  const key = contextKey(context);
  return members().filter((member) => member.scope === key);
}

function scopedAttendance(context = state.context) {
  const ids = new Set(sectionMembers(context).map((member) => member.id));
  return attendance().filter((entry) => ids.has(entry.memberRef));
}

function scopedResults(context = state.context) {
  const ids = new Set(sectionMembers(context).map((member) => member.id));
  return results().filter((result) => ids.has(result.memberRef));
}

function selectedReligion() { return itemById(RELIGIONS, state.context.religion); }
function selectedOrg() { return itemById(ORGS, state.context.organization); }
function selectedYear() { return itemById(YEARS, state.context.year); }
function selectedCategory() { return itemById(CATEGORIES, state.context.category); }

function sectionName() {
  const context = state.context;
  if (context.customReligionName) return `${context.customReligionName} – ሌሎች ሃይማኖቶች`;
  if (context.category) {
    const category = selectedCategory();
    return category ? `${category.en} – ${category.am}` : '';
  }
  if (context.year) {
    const year = selectedYear();
    return year ? `${year.en} – ${year.am}` : '';
  }
  if (context.organization) {
    const org = selectedOrg();
    return org ? `${org.en} – ${org.am}` : '';
  }
  const religion = selectedReligion();
  return religion ? `${religion.en} – ${religion.am}` : '';
}

function logoKey() { return contextKey(); }
function logoValue() { return logos()[logoKey()] || ''; }

function imageTag(data, alt, className = '') {
  if (!data || !/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(data)) return '';
  return `<img class="${className}" src="${data}" alt="${escapeHtml(alt)}">`;
}

function render() {
  if (state.view === 'dashboard') app.innerHTML = renderDashboard();
  else if (state.view === 'orthodox') app.innerHTML = renderPicker('Choose an organization – ድርጅት ይምረጡ', ORGS);
  else if (state.view === 'gibi-years') app.innerHTML = renderPicker('Choose an academic year – የትምህርት ዓመት ይምረጡ', YEARS);
  else if (state.view === 'sunday-categories') app.innerHTML = renderPicker('Choose an age category – የዕድሜ ክፍል ይምረጡ', CATEGORIES);
  else if (state.view === 'other-name') app.innerHTML = renderOtherNameForm();
  else if (state.view === 'manage') app.innerHTML = renderManagement();
  else app.innerHTML = renderDashboard();
}

function renderDashboard() {
  return renderDashboardComponent(RELIGIONS);
}

function renderBreadcrumbs() {
  const parts = [{ label: 'Dashboard – ዳሽቦርድ', view: 'dashboard' }];
  const context = state.context;
  const religion = selectedReligion();
  if (religion) parts.push({ label: `${religion.en} – ${religion.am}`, view: religion.id === 'orthodox' ? 'orthodox' : 'religion' });
  if (context.organization) parts.push({ label: `${selectedOrg()?.en || ''} – ${selectedOrg()?.am || ''}`, view: 'organization' });
  if (context.year) parts.push({ label: `${selectedYear()?.en || ''} – ${selectedYear()?.am || ''}`, view: 'year' });
  if (context.category) parts.push({ label: `${selectedCategory()?.en || ''} – ${selectedCategory()?.am || ''}`, view: 'category' });
  if (context.customReligionName) parts.push({ label: escapeHtml(context.customReligionName), view: 'religion' });
  const items = parts.map((part, index) =>
    `${index ? '<span aria-hidden="true">/</span>' : ''}<button type="button" data-action="breadcrumb" data-view="${part.view}">${part.label}</button>`
  ).join('');
  return renderComponent('sidebar', { items });
}

function renderPicker(title, options) {
  const isOrg = options === ORGS;
  const action = isOrg ? 'organization' : options === YEARS ? 'year' : 'category';
  const logoPanel = isOrg || options === YEARS || options === CATEGORIES ? renderLogoPanel() : '';
  return `${renderBreadcrumbs()}<header class="view-header">
    <div><p class="eyebrow">RELIGIOUS INFO · ሃይማኖታዊ ኢንፎ</p><h1 class="page-heading">${escapeHtml(title)}</h1></div>
    <div class="view-tools"><button class="button button-outline" data-action="back" type="button">Back – ተመለስ</button></div>
  </header>
  <section class="selection-grid${options === CATEGORIES ? ' age-category-grid' : ''}" aria-label="${escapeHtml(title)}">
    ${options.map((option, index) => isOrg
      ? `<button class="choice-card" type="button" data-action="${action}" data-id="${option.id}">
          <span class="choice-icon" aria-hidden="true">${option.icon}</span>
          <h2>${escapeHtml(option.en)} – ${escapeHtml(option.am)}</h2>
        </button>`
      : `<label class="choice-card${options === CATEGORIES ? ' category-option' : ''}">
          <input class="picker-radio" type="radio" name="section-choice" value="${option.id}" data-action="${action}" data-id="${option.id}" aria-label="${escapeHtml(option.en)} – ${escapeHtml(option.am)}">
          ${options === CATEGORIES ? '' : `<span class="choice-icon" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>`}
          <h2>${escapeHtml(option.en)} – ${escapeHtml(option.am)}</h2>
        </label>`).join('')}
  </section>${logoPanel}`;
}

function renderOtherNameForm() {
  return `${renderBreadcrumbs()}<header class="view-header">
    <div><p class="eyebrow">OTHER RELIGIONS · ሌሎች ሃይማኖቶች</p><h1 class="page-heading">Enter religion name – የሃይማኖት ስም ያስገቡ</h1></div>
    <div class="view-tools"><button class="button button-outline" data-action="back" type="button">Back – ተመለስ</button></div>
  </header><section class="panel">
    <form id="other-name-form">
      <div class="field"><label for="custom-religion">Religion Name – የሃይማኖት ስም</label>
        <input id="custom-religion" name="customReligionName" required maxlength="80" autocomplete="organization">
      </div>
      <div class="form-actions"><button class="button button-primary" type="submit">Continue – ቀጥል</button></div>
    </form>
  </section>`;
}

function tabsForContext() {
  const tabs = [
    ['members', 'Member Registration – አባል ምዝገባ'],
    ['list', 'Member List – የአባላት ዝርዝር']
  ];
  if (state.context.organization === 'sunday-school') {
    tabs.push(['attendance', 'Attendance – አቴንዳንስ'], ['results', 'Academic Results – የትምህርት ውጤት']);
  }
  tabs.push(['reports', 'Reports – ሪፖርቶች'], ['logo', 'Logo Settings – ሎጎ ማስተካከያ']);
  return tabs;
}

function renderManagement() {
  const tab = tabsForContext().some(([id]) => id === state.tab) ? state.tab : 'members';
  state.tab = tab;
  const logo = logoValue();
  const religion = selectedReligion();
  const stats = sectionStats();
  const tabContent = {
    members: renderMemberForm(),
    list: renderMemberList(),
    attendance: renderAttendance(),
    results: renderResults(),
    reports: renderReports(),
    logo: renderLogoSettings()
  }[tab];
  return `${renderBreadcrumbs()}<header class="view-header">
    <div class="view-heading">
      <div class="section-logo">${logo ? imageTag(logo, 'Section logo') : escapeHtml(religion?.icon || 'RI')}</div>
      <div><p class="eyebrow">${escapeHtml(religion ? `${religion.en} – ${religion.am}` : 'RELIGIOUS INFO')}</p><h1 class="page-heading">${escapeHtml(sectionName())}</h1></div>
    </div>
    <div class="view-tools"><button class="button button-outline" data-action="back" type="button">Back – ተመለስ</button></div>
  </header>
  <section class="stats-grid" aria-label="Section statistics">${stats.map(([label, value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`).join('')}</section>
  ${renderComponent('navbar', { items: tabsForContext().map(([id, label]) => `<button class="tab-button" type="button" role="tab" aria-selected="${id === tab}" data-action="tab" data-id="${id}">${label}</button>`).join('') })}
  ${state.notice ? `<div class="notice notice-${state.notice.type}" role="alert">${state.notice.text}</div>` : ''}
  ${tabContent}`;
}

function sectionStats() {
  const list = sectionMembers();
  const attendanceToday = scopedAttendance(state.context).filter((entry) => entry.date === today());
  const resultList = scopedResults();
  const avg = resultList.length
    ? (resultList.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / resultList.length).toFixed(1) + '%'
    : '—';
  const stats = [
    ['Total Members – አጠቃላይ አባላት', String(list.length)],
    ['New Members – አዲስ አባላት', String(list.filter((member) => member.registrationDate === today()).length)]
  ];
  if (state.context.organization === 'sunday-school') {
    stats.push(
      ['Present Today – ዛሬ ተገኝተዋል', String(attendanceToday.filter((entry) => entry.status === 'Present').length)],
      ['Absent Today – ዛሬ ቀርተዋል', String(attendanceToday.filter((entry) => entry.status === 'Absent').length)],
      ['Late Today – ዛሬ ዘግይተው መጡ', String(attendanceToday.filter((entry) => entry.status === 'Late').length)],
      ['Results Recorded – የተመዘገቡ ውጤቶች', String(resultList.length)],
      ['Average Result – አማካይ ውጤት', avg]
    );
  }
  return stats;
}

function renderMemberForm() {
  const member = state.form;
  const sunday = state.context.organization === 'sunday-school';
  const fields = `
        ${textField('fullName', 'Full Name – ሙሉ ስም', member.fullName, 'text', 'required autocomplete="name"')}
        ${textField('memberId', 'Member ID – የአባል መለያ ቁጥር', member.memberId, 'text', 'required maxlength="40"')}
        ${textField('age', 'Age – ዕድሜ', member.age, 'number', 'required min="1" max="120"')}
        <fieldset class="field"><legend>Gender – ጾታ</legend><div class="radio-row">${GENDERS.map((gender) =>
          `<label><input type="radio" name="gender" value="${gender.value}" ${member.gender === gender.value ? 'checked' : ''} required> ${gender.label}</label>`
        ).join('')}</div></fieldset>
        ${textField('phone', 'Phone Number – ስልክ ቁጥር', member.phone, 'tel', 'required autocomplete="tel"')}
        ${textField('address', 'Address – አድራሻ', member.address, 'text', 'required autocomplete="street-address"')}
        ${textField('registrationDate', 'Registration Date – የምዝገባ ቀን', member.registrationDate, 'date', 'required')}
        <div class="field"><label for="member-photo">Member Photo – የአባል ፎቶ</label><input id="member-photo" name="photo" type="file" accept="image/png,image/jpeg,image/webp,image/gif">
          <div class="photo-preview" id="photo-preview">${member.photo ? imageTag(member.photo, 'Member photo preview') : 'Preview – ቅድመ እይታ'}</div>
          <p class="hint">Image up to 800 KB – እስከ 800 KB የሆነ ምስል።</p></div>
        ${sunday ? `${textField('guardianName', 'Parent/Guardian Name – የወላጅ/አሳዳጊ ስም', member.guardianName, 'text', 'required')}
          ${textField('guardianPhone', 'Parent/Guardian Phone – የወላጅ/አሳዳጊ ስልክ', member.guardianPhone, 'tel', 'required')}` : ''}`;
  const actions = `
        <button class="button button-primary" type="submit">${state.editingMember ? 'Update Member – መረጃ አስተካክል' : 'Register Member – አባል መዝግብ'}</button>
        <button class="button button-outline" type="button" data-action="clear-member">Clear Form – ቅጹን አጽዳ</button>
        ${state.editingMember ? '<button class="button button-soft" type="button" data-action="cancel-edit">Cancel – ይቅር</button>' : ''}`;
  return renderComponent('member-form', {
    title: state.editingMember ? 'Update Member – የአባል መረጃ አስተካክል' : 'Register Member – አባል መዝግብ',
    fields,
    actions
  });
}

function textField(name, label, value, type = 'text', attrs = '') {
  return `<div class="field"><label for="field-${name}">${label}</label><input id="field-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${attrs}></div>`;
}

function renderMemberList() {
  const query = state.search.trim().toLocaleLowerCase();
  const list = sectionMembers().filter((member) => {
    const matchesText = !query || [member.fullName, member.memberId, member.phone].some((value) => String(value).toLocaleLowerCase().includes(query));
    return matchesText && (!state.ageFilter || Number(member.age) === Number(state.ageFilter)) && (!state.genderFilter || member.gender === state.genderFilter);
  });
  list.sort((a, b) => {
    const left = a[state.sort.key] ?? '';
    const right = b[state.sort.key] ?? '';
    const compare = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right));
    return state.sort.direction === 'asc' ? compare : -compare;
  });
  return `<section class="panel">
    <div class="panel-heading"><h2>Member List – የአባላት ዝርዝር <span class="subtle">(${sectionMembers().length})</span></h2>
      <button class="button button-outline button-small" type="button" data-action="print">Print – አትም</button></div>
    <div class="toolbar">
      <div class="field"><label for="member-search">Search name, Member ID, or phone – በስም፣ መለያ ወይም ስልክ ፈልግ</label><input id="member-search" data-filter="search" type="search" value="${escapeHtml(state.search)}"></div>
      <div class="field"><label for="age-filter">Filter by age – በዕድሜ ማጣሪያ</label><input id="age-filter" data-filter="age" type="number" min="1" max="120" value="${escapeHtml(state.ageFilter)}"></div>
      <div class="field"><label for="gender-filter">Filter by gender – በጾታ ማጣሪያ</label><select id="gender-filter" data-filter="gender"><option value="">All – ሁሉም</option>${GENDERS.map((gender) => `<option value="${gender.value}" ${gender.value === state.genderFilter ? 'selected' : ''}>${gender.label}</option>`).join('')}</select></div>
      <button class="button button-soft" type="button" data-action="clear-filters">Clear filters – ማጣሪያ አጽዳ</button>
    </div>
    <div class="table-wrap"><table><thead><tr>
      <th>No.</th><th>Photo – ፎቶ</th>${sortableHeader('memberId', 'Member ID – የአባል መለያ')}${sortableHeader('fullName', 'Full Name – ሙሉ ስም')}${sortableHeader('age', 'Age – ዕድሜ')}${sortableHeader('gender', 'Gender – ጾታ')}
      <th>Phone – ስልክ</th><th>Address – አድራሻ</th>${sortableHeader('registrationDate', 'Registration Date – ቀን')}<th>Action – እርምጃ</th>
    </tr></thead><tbody>${list.length ? list.map((member, index) => `<tr>
      <td>${index + 1}</td><td>${member.photo ? imageTag(member.photo, 'Member photo', 'member-thumb') : '—'}</td>
      <td>${escapeHtml(member.memberId)}</td><td>${escapeHtml(member.fullName)}</td><td>${escapeHtml(member.age)}</td><td>${escapeHtml(member.gender)}</td>
      <td>${escapeHtml(member.phone)}</td><td>${escapeHtml(member.address)}</td><td>${escapeHtml(member.registrationDate)}</td>
      <td><div class="table-actions"><button class="button button-soft button-small" type="button" data-action="details" data-id="${member.id}">View – እይ</button><button class="button button-outline button-small" type="button" data-action="edit-member" data-id="${member.id}">Edit – አስተካክል</button><button class="button button-danger button-small" type="button" data-action="delete-member" data-id="${member.id}">Delete – ሰርዝ</button></div></td>
    </tr>`).join('') : '<tr><td class="empty-state" colspan="10">No records found – ምንም መረጃ አልተገኘም።</td></tr>'}</tbody></table></div>
  </section>`;
}

function sortableHeader(key, label) {
  const marker = state.sort.key === key ? (state.sort.direction === 'asc' ? ' ↑' : ' ↓') : '';
  return `<th><button type="button" data-action="sort" data-key="${key}">${label}${marker}</button></th>`;
}

function renderLogoSettings() {
  return renderLogoPanel();
}

function renderLogoPanel() {
  const key = logoKey();
  const current = state.logoDraftKey === key && state.logoDraft ? state.logoDraft : logoValue();
  const hasDraft = state.logoDraftKey === key && Boolean(state.logoDraft);
  return `<section class="panel"><div class="panel-heading"><h2>Independent Logo Settings – የግል ሎጎ ማስተካከያ</h2></div>
    <p class="page-subtitle">${escapeHtml(sectionName())}. Each section keeps its own logo – እያንዳንዱ ክፍል የራሱን ሎጎ ይጠቀማል።</p>
    <div class="logo-controls" style="margin-top:20px">
      <div class="logo-preview" id="logo-preview">${current ? imageTag(current, 'Current section logo') : 'Default – ነባሪ'}</div>
      <div class="field"><label for="section-logo-input">Upload or replace logo – ሎጎ ጫን ወይም ቀይር</label><input id="section-logo-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif">
        <p class="hint">PNG, JPG, WEBP, or GIF; up to 800 KB – PNG፣ JPG፣ WEBP ወይም GIF፤ እስከ 800 KB።</p>
        <div class="form-actions">
          ${hasDraft ? '<button class="button button-primary" type="button" data-action="save-logo">Save Logo – ሎጎ አስቀምጥ</button><button class="button button-outline" type="button" data-action="discard-logo">Cancel Preview – ቅድመ እይታን ሰርዝ</button>' : ''}
          ${logoValue() ? '<button class="button button-danger" type="button" data-action="remove-logo">Remove Logo – ሎጎ አስወግድ</button>' : ''}
        </div></div>
    </div></section>`;
}

function renderAttendance() {
  const list = sectionMembers();
  const query = state.attendanceSearch.toLocaleLowerCase();
  const filtered = list.filter((member) => !query || `${member.fullName} ${member.memberId}`.toLocaleLowerCase().includes(query));
  const dayRecords = scopedAttendance().filter((entry) => entry.date === state.attendanceDate);
  return `<section class="panel"><div class="panel-heading"><h2>Sunday School Attendance – የሰንበት ትምህርት ቤት አቴንዳንስ</h2>
    <button class="button button-outline button-small" type="button" data-action="print">Print – አትም</button></div>
    <div class="toolbar"><div class="field"><label for="attendance-date">Date – ቀን</label><input id="attendance-date" type="date" data-attendance="date" value="${escapeHtml(state.attendanceDate)}"></div>
      <div class="field"><label for="attendance-search">Search member – አባል ፈልግ</label><input id="attendance-search" type="search" data-attendance="search" value="${escapeHtml(state.attendanceSearch)}" placeholder="Name or Member ID – ስም ወይም መለያ"></div></div>
    <div class="table-wrap"><table><thead><tr><th>No.</th><th>Member ID – መለያ</th><th>Member Name – ስም</th><th>Age Category – የዕድሜ ክፍል</th><th>Date – ቀን</th><th>Status – ሁኔታ</th><th>History – ታሪክ</th></tr></thead><tbody>
      ${filtered.length ? filtered.map((member, index) => {
        const record = dayRecords.find((entry) => entry.memberRef === member.id);
        const status = state.attendanceStatus[member.id] || record?.status || 'Present';
        return `<tr><td>${index + 1}</td><td>${escapeHtml(member.memberId)}</td><td>${escapeHtml(member.fullName)}</td><td>${escapeHtml(selectedCategory()?.en || '')}</td><td>${escapeHtml(state.attendanceDate)}</td>
          <td><select aria-label="Attendance status for ${escapeHtml(member.fullName)}" data-status-for="${member.id}">${STATUS_OPTIONS.map(([value, label]) => `<option value="${value}" ${status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></td>
          <td><button class="button button-soft button-small" type="button" data-action="attendance-history" data-id="${member.id}">View – እይ</button></td></tr>`;
      }).join('') : '<tr><td class="empty-state" colspan="7">No registered members found – የተመዘገቡ አባላት አልተገኙም።</td></tr>'}
    </tbody></table></div>
    <div class="form-actions"><button class="button button-primary" type="button" data-action="save-attendance">Save Attendance – አቴንዳንስ አስቀምጥ</button></div>
  </section>`;
}

function renderResults() {
  const list = sectionMembers();
  const entries = scopedResults();
  const form = state.resultForm;
  const selectedMember = list.find((member) => member.id === form.memberRef);
  const memberOptions = list.map((member) => `<option value="${member.id}" ${member.id === form.memberRef ? 'selected' : ''}>${escapeHtml(member.memberId)} – ${escapeHtml(member.fullName)}</option>`).join('');
  const percentage = form.totalMarks && form.obtainedMarks !== '' ? Number(form.obtainedMarks) / Number(form.totalMarks) * 100 : 0;
  const grade = gradeFor(percentage);
  return `<section class="panel"><div class="panel-heading"><h2>Academic Results – የትምህርት ውጤቶች</h2>
    <button class="button button-outline button-small" type="button" data-action="print">Print – አትም</button></div>
    <form id="result-form" novalidate><div class="form-grid">
      <div class="field"><label for="result-member">Registered Member – የተመዘገበ አባል</label><select id="result-member" name="memberRef" required><option value="">Select a member – አባል ይምረጡ</option>${memberOptions}</select></div>
      <div class="field"><label for="result-member-id">Member ID – የአባል መለያ ቁጥር</label><input id="result-member-id" value="${escapeHtml(selectedMember?.memberId || '')}" readonly></div>
      <div class="field"><label for="result-member-name">Member Name – የአባል ስም</label><input id="result-member-name" value="${escapeHtml(selectedMember?.fullName || '')}" readonly></div>
      <div class="field"><label for="result-age-category">Age Category – የዕድሜ ክፍል</label><input id="result-age-category" value="${escapeHtml(selectedCategory()?.en ? `${selectedCategory().en} – ${selectedCategory().am}` : '')}" readonly></div>
      ${textField('subject', 'Subject Name – የትምህርት ዓይነት', form.subject, 'text', 'required')}
      <div class="field"><label for="exam-type">Exam Type – የፈተና ዓይነት</label><select id="exam-type" name="examType">${[['Midterm','Midterm – መካከለኛ'],['Final','Final – የመጨረሻ'],['Quiz','Quiz – አጭር ፈተና']].map(([value,label]) => `<option value="${value}" ${form.examType === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
      <div class="field"><label for="academic-year">Academic Year – የትምህርት ዘመን</label><select id="academic-year" name="academicYear">${YEARS.map((year) => `<option value="${year.id}" ${form.academicYear === year.id ? 'selected' : ''}>${year.en} – ${year.am}</option>`).join('')}</select></div>
      <div class="field"><label for="semester">Semester – የትምህርት ክፍለ ጊዜ</label><select id="semester" name="semester"><option value="Semester 1" ${form.semester === 'Semester 1' ? 'selected' : ''}>Semester 1 – ክፍል 1</option><option value="Semester 2" ${form.semester === 'Semester 2' ? 'selected' : ''}>Semester 2 – ክፍል 2</option></select></div>
      ${textField('totalMarks', 'Total Marks – ጠቅላላ ነጥብ', form.totalMarks, 'number', 'required min="1" step="any"')}
      ${textField('obtainedMarks', 'Obtained Marks – የተገኘ ውጤት', form.obtainedMarks, 'number', 'required min="0" step="any"')}
      <div class="field"><label>Percentage / Grade – መቶኛ / ደረጃ</label><input value="${percentage.toFixed(1)}% / ${grade}" readonly></div>
      <div class="field field-wide"><label for="remark">Remark – አስተያየት</label><textarea id="remark" name="remark">${escapeHtml(form.remark)}</textarea></div>
    </div><div class="form-actions"><button class="button button-primary" type="submit">${state.editingResult ? 'Update Result – ውጤት አስተካክል' : 'Save Result – ውጤት አስቀምጥ'}</button><button class="button button-outline" type="button" data-action="clear-result">Clear – አጽዳ</button>${state.editingResult ? '<button class="button button-soft" type="button" data-action="cancel-result">Cancel – ይቅር</button>' : ''}</div></form>
    <details class="report-card" style="margin-top:18px"><summary><strong>Grading Rules – የውጤት ደረጃ መመሪያ</strong></summary>
      <p class="hint">Set the minimum percentage for each grade; thresholds must descend from A to E. F starts at zero. – የእያንዳንዱን ደረጃ ዝቅተኛ መቶኛ ያስቀምጡ።</p>
      <div class="form-grid">${gradeRules().filter((rule) => rule.grade !== 'F').map((rule) => `<div class="field"><label for="grade-${rule.grade}">Grade ${rule.grade} minimum % – የ${rule.grade} ዝቅተኛ መቶኛ</label><input id="grade-${rule.grade}" data-grade-min="${rule.grade}" type="number" min="0" max="100" step="1" value="${rule.minimum}"></div>`).join('')}</div>
      <div class="form-actions"><button class="button button-primary" type="button" data-action="save-grade-rules">Save Grading Rules – የውጤት መመሪያ አስቀምጥ</button></div>
    </details>
    <div class="table-wrap" style="margin-top:22px"><table><thead><tr><th>No. – ቁ.</th><th>Member ID – መለያ</th><th>Member Name – ስም</th><th>Subject – ትምህርት</th><th>Exam – ፈተና</th><th>Year – ዓመት</th><th>Total Marks – ጠቅላላ ነጥብ</th><th>Obtained Marks – የተገኘ ነጥብ</th><th>Percentage – መቶኛ</th><th>Grade – ደረጃ</th><th>Actions – እርምጃ</th></tr></thead><tbody>
      ${entries.length ? entries.map((entry, index) => { const member = list.find((item) => item.id === entry.memberRef); return `<tr><td>${index + 1}</td><td>${escapeHtml(member?.memberId || '—')}</td><td>${escapeHtml(member?.fullName || '—')}</td><td>${escapeHtml(entry.subject)}</td><td>${escapeHtml(entry.examType)}</td><td>${escapeHtml(labelForYear(entry.academicYear))}</td><td>${escapeHtml(entry.totalMarks)}</td><td>${escapeHtml(entry.obtainedMarks)}</td><td>${Number(entry.percentage).toFixed(1)}%</td><td>${escapeHtml(entry.grade)}</td><td><button class="button button-soft button-small" type="button" data-action="edit-result" data-id="${entry.id}">Edit – አስተካክል</button> <button class="button button-danger button-small" type="button" data-action="delete-result" data-id="${entry.id}">Delete – ሰርዝ</button></td></tr>`; }).join('') : '<tr><td class="empty-state" colspan="11">No results recorded – ምንም ውጤት አልተመዘገበም።</td></tr>'}
    </tbody></table></div></section>`;
}

function gradeFor(percentage) {
  return [...gradeRules()]
    .sort((a, b) => b.minimum - a.minimum)
    .find((rule) => percentage >= rule.minimum)?.grade || 'F';
}

function labelForYear(id) { return itemById(YEARS, id)?.en || id || '—'; }

function renderReports() {
  const list = sectionMembers();
  const allMembers = members();
  const religionCounts = summarize(allMembers, 'religion');
  const organizationCounts = summarize(allMembers.filter((member) => member.organization), 'organization');
  const attendanceList = filterAttendanceByPeriod(scopedAttendance());
  const resultList = scopedResults();
  const search = state.reportSearch.toLocaleLowerCase();
  const membersByGender = summarize(list, 'gender');
  const membersByAge = summarize(list, 'age');
  const attendanceByStatus = summarize(attendanceList, 'status');
  const resultsByGrade = summarize(resultList, 'grade');
  return `<section class="panel"><div class="panel-heading"><h2>Reports – ሪፖርቶች</h2><button class="button button-outline" type="button" data-action="print">Print Report – ሪፖርት አትም</button></div>
    <div class="toolbar"><div class="field"><label for="report-search">Search reports – በሪፖርት ፍለጋ</label><input id="report-search" type="search" data-filter="report" value="${escapeHtml(state.reportSearch)}" placeholder="Member name or ID – የአባል ስም ወይም መለያ"></div>
      ${state.context.organization === 'sunday-school' ? `<div class="field"><label for="report-period">Attendance period – የአቴንዳንስ ጊዜ</label><select id="report-period" data-report="period"><option value="all" ${state.reportPeriod === 'all' ? 'selected' : ''}>All records – ሁሉም</option><option value="daily" ${state.reportPeriod === 'daily' ? 'selected' : ''}>Daily – ዕለታዊ</option><option value="weekly" ${state.reportPeriod === 'weekly' ? 'selected' : ''}>Weekly – ሳምንታዊ</option><option value="monthly" ${state.reportPeriod === 'monthly' ? 'selected' : ''}>Monthly – ወርሃዊ</option></select></div><div class="field"><label for="report-date">Report date – የሪፖርት ቀን</label><input id="report-date" type="date" data-report="date" value="${escapeHtml(state.reportDate)}"></div>` : ''}</div>
    <div class="report-grid">
      ${reportTable('Total Members by Religion – አጠቃላይ አባላት በሃይማኖት', Object.entries(religionCounts).map(([id, count]) => { const religion = itemById(RELIGIONS, id); return [religion ? `${religion.en} – ${religion.am}` : id, count]; }))}
      ${reportTable('Members by Organization – አባላት በድርጅት', Object.entries(organizationCounts).map(([id, count]) => { const organization = itemById(ORGS, id); return [organization ? `${organization.en} – ${organization.am}` : id, count]; }))}
      ${reportTable('Member Summary – የአባላት ማጠቃለያ', [['Total Members – አጠቃላይ አባላት', list.length], ...Object.entries(membersByGender)])}
      ${reportTable('Members by Age – አባላት በዕድሜ', Object.entries(membersByAge))}
      ${state.context.organization === 'gibi' ? reportTable('Gibi Gubae Members by Academic Year – የግቢ ጉባኤ አባላት በዓመት', Object.entries(summarize(allMembers.filter((member) => member.organization === 'gibi'), 'year')).map(([id, count]) => { const year = itemById(YEARS, id); return [year ? `${year.en} – ${year.am}` : id, count]; })) : ''}
      ${state.context.organization === 'sunday-school' ? reportTable('Members by Age Category – አባላት በዕድሜ ክፍል', Object.entries(summarize(allMembers.filter((member) => member.organization === 'sunday-school'), 'category')).map(([id, count]) => { const category = itemById(CATEGORIES, id); return [category ? `${category.en} – ${category.am}` : id, count]; })) : ''}
      ${state.context.organization === 'sunday-school' ? reportTable('Attendance Status – የአቴንዳንስ ሁኔታ', Object.entries(attendanceByStatus)) : ''}
      ${state.context.organization === 'sunday-school' ? renderAttendancePercentage(attendanceList, list) : ''}
      ${state.context.organization === 'sunday-school' ? reportTable('Results by Grade – ውጤት በደረጃ', Object.entries(resultsByGrade)) : ''}
      ${state.context.organization === 'sunday-school' ? reportTable('Results by Subject – ውጤት በትምህርት', Object.entries(summarize(resultList, 'subject'))) : ''}
      ${state.context.organization === 'sunday-school' ? reportTable('Results by Semester – ውጤት በክፍለ ጊዜ', Object.entries(summarize(resultList, 'semester'))) : ''}
      ${state.context.organization === 'sunday-school' ? reportTable('Results by Academic Year – ውጤት በዓመት', Object.entries(summarize(resultList, 'academicYear')).map(([id, count]) => [labelForYear(id), count])) : ''}
      ${state.context.organization === 'sunday-school' ? renderResultExtremes(resultList, list) : ''}
      ${renderReportMemberTable(list.filter((member) => !search || `${member.fullName} ${member.memberId}`.toLocaleLowerCase().includes(search)))}
      ${state.context.organization === 'sunday-school' ? renderAttendanceReport(attendanceList.filter((entry) => { const member = list.find((item) => item.id === entry.memberRef); return !search || `${member?.fullName || ''} ${member?.memberId || ''}`.toLocaleLowerCase().includes(search); })) : ''}
      ${state.context.organization === 'sunday-school' ? renderResultReport(resultList, search, list) : ''}
    </div></section>`;
}

function filterAttendanceByPeriod(entries) {
  if (state.reportPeriod === 'daily') return entries.filter((entry) => entry.date === state.reportDate);
  if (state.reportPeriod === 'monthly') return entries.filter((entry) => entry.date.startsWith(state.reportDate.slice(0, 7)));
  if (state.reportPeriod === 'weekly') {
    const selected = new Date(`${state.reportDate}T00:00:00`);
    const monday = new Date(selected);
    monday.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    const start = localDateString(monday);
    const end = localDateString(nextMonday);
    return entries.filter((entry) => entry.date >= start && entry.date < end);
  }
  return entries;
}

function localDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function renderAttendancePercentage(entries, list) {
  const memberRows = list.map((member) => {
    const records = entries.filter((entry) => entry.memberRef === member.id);
    const attended = records.filter((entry) => entry.status === 'Present' || entry.status === 'Late').length;
    return [member.fullName, records.length ? `${(attended / records.length * 100).toFixed(1)}%` : '—'];
  });
  return `<article class="report-card"><h3>Attendance Percentage – የአቴንዳንስ መቶኛ</h3><div class="table-wrap"><table><thead><tr><th>Member – አባል</th><th>Attendance – አቴንዳንስ</th></tr></thead><tbody>${memberRows.length ? memberRows.map(([name, value]) => `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(value)}</td></tr>`).join('') : '<tr><td colspan="2">No data – መረጃ የለም</td></tr>'}</tbody></table></div></article>`;
}

function renderResultExtremes(entries, list) {
  if (!entries.length) return reportTable('Highest and Lowest Marks – ከፍተኛ እና ዝቅተኛ ውጤት', []);
  const ordered = [...entries].sort((a, b) => Number(a.percentage) - Number(b.percentage));
  const lowest = ordered[0];
  const highest = ordered[ordered.length - 1];
  const memberName = (entry) => list.find((member) => member.id === entry.memberRef)?.fullName || '—';
  return `<article class="report-card"><h3>Highest and Lowest Marks – ከፍተኛ እና ዝቅተኛ ውጤት</h3><div class="table-wrap"><table><thead><tr><th>Report – ሪፖርት</th><th>Member – አባል</th><th>Subject – ትምህርት</th><th>Percent – መቶኛ</th></tr></thead><tbody><tr><td>Highest – ከፍተኛ</td><td>${escapeHtml(memberName(highest))}</td><td>${escapeHtml(highest.subject)}</td><td>${Number(highest.percentage).toFixed(1)}%</td></tr><tr><td>Lowest – ዝቅተኛ</td><td>${escapeHtml(memberName(lowest))}</td><td>${escapeHtml(lowest.subject)}</td><td>${Number(lowest.percentage).toFixed(1)}%</td></tr></tbody></table></div></article>`;
}

function summarize(list, key) {
  return list.reduce((counts, item) => {
    const name = String(item[key] ?? 'Unknown');
    counts[name] = (counts[name] || 0) + 1;
    return counts;
  }, {});
}

function reportTable(title, rows) {
  return `<article class="report-card"><h3>${title}</h3><div class="table-wrap"><table><thead><tr><th>Category – ክፍል</th><th>Total – ብዛት</th></tr></thead><tbody>${rows.length ? rows.map(([name, count]) => `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(count)}</td></tr>`).join('') : '<tr><td colspan="2">No data – መረጃ የለም</td></tr>'}</tbody></table></div></article>`;
}

function renderReportMemberTable(list) {
  return `<article class="report-card"><h3>Member Report – የአባላት ሪፖርት</h3><div class="table-wrap"><table><thead><tr><th>Member ID – መለያ</th><th>Full Name – ስም</th><th>Gender – ጾታ</th><th>Age – ዕድሜ</th><th>Registered – የተመዘገበበት</th></tr></thead><tbody>${list.length ? list.map((member) => `<tr><td>${escapeHtml(member.memberId)}</td><td>${escapeHtml(member.fullName)}</td><td>${escapeHtml(member.gender)}</td><td>${escapeHtml(member.age)}</td><td>${escapeHtml(member.registrationDate)}</td></tr>`).join('') : '<tr><td colspan="5">No records found – ምንም መረጃ አልተገኘም።</td></tr>'}</tbody></table></div></article>`;
}

function renderAttendanceReport(entries) {
  const list = sectionMembers();
  return `<article class="report-card"><h3>Attendance Report – የአቴንዳንስ ሪፖርት</h3><div class="table-wrap"><table><thead><tr><th>Member – አባል</th><th>Date – ቀን</th><th>Status – ሁኔታ</th></tr></thead><tbody>${entries.length ? entries.map((entry) => `<tr><td>${escapeHtml(list.find((item) => item.id === entry.memberRef)?.fullName || '')}</td><td>${escapeHtml(entry.date)}</td><td>${escapeHtml(entry.status)}</td></tr>`).join('') : '<tr><td colspan="3">No attendance records – የአቴንዳንስ መረጃ የለም</td></tr>'}</tbody></table></div></article>`;
}

function renderResultReport(entries, search, list) {
  const filtered = entries.filter((entry) => { const member = list.find((item) => item.id === entry.memberRef); return !search || `${member?.fullName || ''} ${member?.memberId || ''}`.toLocaleLowerCase().includes(search); });
  return `<article class="report-card"><h3>Academic Results Report – የትምህርት ውጤት ሪፖርት</h3><div class="table-wrap"><table><thead><tr><th>Member – አባል</th><th>Subject – ትምህርት</th><th>Semester – ክፍለ ጊዜ</th><th>Year – ዓመት</th><th>Score – ውጤት</th><th>Grade – ደረጃ</th></tr></thead><tbody>${filtered.length ? filtered.map((entry) => `<tr><td>${escapeHtml(list.find((member) => member.id === entry.memberRef)?.fullName || '')}</td><td>${escapeHtml(entry.subject)}</td><td>${escapeHtml(entry.semester)}</td><td>${escapeHtml(labelForYear(entry.academicYear))}</td><td>${escapeHtml(entry.obtainedMarks)} / ${escapeHtml(entry.totalMarks)}</td><td>${escapeHtml(entry.grade)}</td></tr>`).join('') : '<tr><td colspan="6">No results found – ምንም ውጤት አልተገኘም።</td></tr>'}</tbody></table></div></article>`;
}

function setView(view) {
  state.view = view;
  state.notice = null;
  resetMemberForm();
  resetResultForm();
  state.search = '';
  state.ageFilter = '';
  state.genderFilter = '';
  state.reportSearch = '';
  state.logoDraft = '';
  state.logoDraftKey = '';
  if (view === 'manage') {
    state.tab = 'members';
    state.attendanceStatus = {};
  }
  render();
}

function resetMemberForm() {
  state.form = emptyMember();
  state.editingMember = '';
}

function resetResultForm() {
  state.resultForm = emptyResult();
  state.editingResult = '';
}

function showDetails(member) {
  const fields = [
    ['Full Name – ሙሉ ስም', member.fullName],
    ['Member ID – የአባል መለያ', member.memberId],
    ['Age – ዕድሜ', member.age],
    ['Gender – ጾታ', member.gender],
    ['Phone – ስልክ', member.phone],
    ['Address – አድራሻ', member.address],
    ['Registration Date – የምዝገባ ቀን', member.registrationDate],
    ['Religion / Section – ሃይማኖት / ክፍል', sectionName()],
    ...(member.guardianName ? [['Parent/Guardian – ወላጅ/አሳዳጊ', member.guardianName]] : []),
    ...(member.guardianPhone ? [['Guardian Phone – የወላጅ ስልክ', member.guardianPhone]] : [])
  ];
  dialog.innerHTML = `<div class="panel-heading"><h2>Member Details – የአባል ዝርዝር</h2><button class="button button-outline" type="button" data-action="close-dialog">Close – ዝጋ</button></div>
    ${member.photo ? `<p>${imageTag(member.photo, 'Member photo', 'member-thumb')}</p>` : ''}
    <div class="detail-grid">${fields.map(([label, value]) => `<div class="detail-item"><strong>${label}</strong>${escapeHtml(value)}</div>`).join('')}</div>`;
  dialog.showModal();
}

function showAttendanceHistory(member) {
  const history = scopedAttendance().filter((entry) => entry.memberRef === member.id).sort((a, b) => b.date.localeCompare(a.date));
  dialog.innerHTML = `<div class="panel-heading"><h2>Attendance History – የአቴንዳንስ ታሪክ</h2><button class="button button-outline" type="button" data-action="close-dialog">Close – ዝጋ</button></div>
    <p>${escapeHtml(member.fullName)} · ${escapeHtml(member.memberId)}</p><div class="table-wrap"><table><thead><tr><th>Date – ቀን</th><th>Status – ሁኔታ</th></tr></thead><tbody>${history.length ? history.map((entry) => `<tr><td>${escapeHtml(entry.date)}</td><td>${escapeHtml(entry.status)}</td></tr>`).join('') : '<tr><td colspan="2">No history found – ታሪክ አልተገኘም።</td></tr>'}</tbody></table></div>`;
  dialog.showModal();
}

function handleClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;

  if (action === 'home') {
    event.preventDefault();
    state.context = {};
    state.tab = 'members';
    setView('dashboard');
  } else if (action === 'religion') {
    state.context = { religion: id };
    if (id === 'orthodox') setView('orthodox');
    else if (id === 'other') setView('other-name');
    else setView('manage');
  } else if (action === 'organization') {
    state.context.organization = id;
    if (id === 'gibi') setView('gibi-years');
    else if (id === 'sunday-school') setView('sunday-categories');
    else { state.tab = 'members'; setView('manage'); }
  } else if (action === 'year') {
    state.context.year = id;
    state.tab = 'members';
    setView('manage');
  } else if (action === 'category') {
    state.context.category = id;
    state.tab = 'members';
    setView('manage');
  } else if (action === 'back') {
    if (state.view === 'manage' && state.context.organization === 'gibi' && state.context.year) {
      state.context.year = undefined;
      setView('gibi-years');
    } else if (state.view === 'manage' && state.context.organization === 'sunday-school' && state.context.category) {
      state.context.category = undefined;
      setView('sunday-categories');
    } else if (state.view === 'gibi-years' || state.view === 'sunday-categories' || (state.view === 'manage' && state.context.organization)) {
      state.context.organization = undefined;
      state.context.year = undefined;
      state.context.category = undefined;
      setView('orthodox');
    } else if (state.view === 'orthodox' || state.view === 'other-name' || state.view === 'manage') {
      state.context = {};
      setView('dashboard');
    }
  } else if (action === 'breadcrumb') {
    const target = button.dataset.view;
    if (target === 'dashboard') { state.context = {}; setView('dashboard'); }
    else if (target === 'orthodox') { state.context = { religion: 'orthodox' }; setView('orthodox'); }
    else if (target === 'religion') {
      if (state.context.religion === 'other' && !state.context.customReligionName) setView('other-name');
      else { state.context.organization = undefined; state.context.year = undefined; state.context.category = undefined; setView('manage'); }
    } else if (target === 'organization') {
      state.context.year = undefined; state.context.category = undefined;
      setView(state.context.organization === 'gibi' ? 'gibi-years' : state.context.organization === 'sunday-school' ? 'sunday-categories' : 'manage');
    } else if (target === 'year') { state.context.category = undefined; setView('manage'); }
    else if (target === 'category') { state.context.year = undefined; setView('manage'); }
  } else if (action === 'tab') {
    state.tab = id;
    state.notice = null;
    render();
  } else if (action === 'clear-member') {
    resetMemberForm();
    render();
  } else if (action === 'cancel-edit') {
    resetMemberForm();
    state.tab = 'list';
    render();
  } else if (action === 'edit-member') {
    const member = sectionMembers().find((item) => item.id === id);
    if (!member) return;
    state.form = { fullName: member.fullName, memberId: member.memberId, age: String(member.age), gender: member.gender, phone: member.phone, address: member.address, registrationDate: member.registrationDate, photo: member.photo || '', guardianName: member.guardianName || '', guardianPhone: member.guardianPhone || '' };
    state.editingMember = member.id;
    state.tab = 'members';
    state.notice = null;
    render();
  } else if (action === 'delete-member') {
    const member = sectionMembers().find((item) => item.id === id);
    if (!member || !window.confirm(`Delete member ${member.fullName}? – አባሉን ሰርዝ?`)) return;
    const next = members().filter((item) => item.id !== id);
    if (write(KEYS.members, next)) { showToast('Member deleted successfully – አባሉ በተሳካ ሁኔታ ተሰርዟል።'); render(); }
  } else if (action === 'details') {
    const member = sectionMembers().find((item) => item.id === id);
    if (member) showDetails(member);
  } else if (action === 'clear-filters') {
    state.search = ''; state.ageFilter = ''; state.genderFilter = ''; render();
  } else if (action === 'sort') {
    state.sort = { key: button.dataset.key, direction: state.sort.key === button.dataset.key && state.sort.direction === 'asc' ? 'desc' : 'asc' };
    render();
  } else if (action === 'remove-logo') {
    const allLogos = logos();
    delete allLogos[logoKey()];
    if (write(KEYS.logos, allLogos)) {
      state.logoDraft = '';
      state.logoDraftKey = '';
      showToast('Logo removed – ሎጎ ተወግዷል።');
      render();
    }
  } else if (action === 'save-logo') {
    if (!state.logoDraft || state.logoDraftKey !== logoKey()) return;
    const allLogos = logos();
    allLogos[logoKey()] = state.logoDraft;
    if (write(KEYS.logos, allLogos)) {
      state.logoDraft = '';
      state.logoDraftKey = '';
      showToast('Logo saved for this section – ሎጎው ለዚህ ክፍል ተቀምጧል።');
      render();
    }
  } else if (action === 'discard-logo') {
    state.logoDraft = '';
    state.logoDraftKey = '';
    render();
  } else if (action === 'save-attendance') {
    saveDailyAttendance();
  } else if (action === 'attendance-history') {
    const member = sectionMembers().find((item) => item.id === id);
    if (member) showAttendanceHistory(member);
  } else if (action === 'edit-result') {
    const result = scopedResults().find((item) => item.id === id);
    if (result) {
      state.resultForm = { memberRef: result.memberRef, subject: result.subject, examType: result.examType, academicYear: result.academicYear, semester: result.semester, totalMarks: String(result.totalMarks), obtainedMarks: String(result.obtainedMarks), remark: result.remark || '' };
      state.editingResult = result.id;
      render();
    }
  } else if (action === 'delete-result') {
    if (!window.confirm('Delete this result? – ይህን ውጤት ሰርዝ?')) return;
    const next = results().filter((item) => item.id !== id);
    if (write(KEYS.results, next)) { showToast('Result deleted – ውጤቱ ተሰርዟል።'); render(); }
  } else if (action === 'clear-result') {
    resetResultForm(); render();
  } else if (action === 'cancel-result') {
    resetResultForm(); render();
  } else if (action === 'save-grade-rules') {
    saveGradeRules();
  } else if (action === 'print') {
    window.print();
  } else if (action === 'close-dialog') {
    dialog.close();
  }
}

function saveDailyAttendance() {
  const all = attendance();
  const list = sectionMembers();
  const existing = all.filter((entry) => !(entry.scope === contextKey() && entry.date === state.attendanceDate));
  for (const member of list) {
    const prior = all.find((entry) => entry.scope === contextKey() && entry.memberRef === member.id && entry.date === state.attendanceDate);
    existing.push({
      id: prior?.id || uniqueId(),
      scope: contextKey(),
      memberRef: member.id,
      date: state.attendanceDate,
      status: state.attendanceStatus[member.id] || prior?.status || 'Present'
    });
  }
  if (write(KEYS.attendance, existing)) {
    state.attendanceStatus = {};
    showToast('Attendance saved successfully – አቴንዳንስ በተሳካ ሁኔታ ተቀምጧል።');
    render();
  }
}

function handleInput(event) {
  const target = event.target;
  if (target.form?.id === 'member-form' && target.name !== 'photo') {
    if (target.name === 'gender') state.form.gender = target.value;
    else state.form[target.name] = target.value;
  } else if (target.dataset.filter === 'search') {
    state.search = target.value;
    render();
    restoreFocus('#member-search');
  } else if (target.dataset.filter === 'age') {
    state.ageFilter = target.value;
    render();
    restoreFocus('#age-filter');
  } else if (target.dataset.filter === 'gender') {
    state.genderFilter = target.value;
    render();
  } else if (target.dataset.filter === 'report') {
    state.reportSearch = target.value;
    render();
    restoreFocus('#report-search');
  } else if (target.dataset.attendance === 'search') {
    state.attendanceSearch = target.value;
    render();
    restoreFocus('#attendance-search');
  } else if (target.dataset.attendance === 'date') {
    state.attendanceDate = target.value || today();
    render();
  } else if (target.dataset.report === 'period') {
    state.reportPeriod = target.value;
    render();
  } else if (target.dataset.report === 'date') {
    state.reportDate = target.value || today();
    render();
  } else if (target.dataset.statusFor) {
    state.attendanceStatus[target.dataset.statusFor] = target.value;
  } else if (target.form?.id === 'result-form' && target.name) {
    state.resultForm[target.name] = target.value;
    if (target.name === 'totalMarks' || target.name === 'obtainedMarks' || target.name === 'memberRef') render();
  }
}

function restoreFocus(selector) {
  const input = document.querySelector(selector);
  if (input) {
    input.focus();
    const end = input.value.length;
    input.setSelectionRange?.(end, end);
  }
}

function handleChange(event) {
  const target = event.target;
  if (target.id === 'member-photo') handleImageUpload(target.files?.[0], 800 * 1024, (data) => {
    state.form.photo = data;
    const preview = document.querySelector('#photo-preview');
    if (preview) preview.innerHTML = imageTag(data, 'Member photo preview');
  });
  if (target.id === 'section-logo-input') handleImageUpload(target.files?.[0], 800 * 1024, (data) => {
    state.logoDraft = data;
    state.logoDraftKey = logoKey();
    render();
  });
}

function handleImageUpload(file, maxBytes, callback) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    showToast('Use a JPG, PNG, WEBP, or GIF image – JPG፣ PNG፣ WEBP ወይም GIF ምስል ይጠቀሙ።', true);
    return;
  }
  if (file.size > maxBytes) {
    showToast('Image must be 800 KB or smaller – ምስሉ 800 KB ወይም ከዚያ በታች መሆን አለበት።', true); return;
  }
  const reader = new FileReader();
  reader.onerror = () => showToast('Image could not be read – ምስሉን ማንበብ አልተቻለም።', true);
  reader.onload = () => {
    if (typeof reader.result !== 'string' || !reader.result.startsWith('data:image/')) {
      showToast('Invalid image – ምስሉ ትክክል አይደለም።', true);
      return;
    }
    callback(reader.result);
  };
  reader.readAsDataURL(file);
}

function handleSubmit(event) {
  if (event.target.id === 'other-name-form') {
    event.preventDefault();
    const name = new FormData(event.target).get('customReligionName').trim();
    if (!name) return showToast('Enter a religion name – የሃይማኖት ስም ያስገቡ።', true);
    state.context.customReligionName = name;
    state.tab = 'members';
    setView('manage');
  } else if (event.target.id === 'member-form') {
    event.preventDefault();
    submitMember(event.target);
  } else if (event.target.id === 'result-form') {
    event.preventDefault();
    submitResult(event.target);
  }
}

function submitMember(formElement) {
  const values = Object.fromEntries(new FormData(formElement).entries());
  values.gender = formElement.querySelector('[name="gender"]:checked')?.value || '';
  values.age = Number(values.age);
  const phone = String(values.phone || '').replace(/[\s()-]/g, '');
  const guardianPhone = String(values.guardianPhone || '').replace(/[\s()-]/g, '');
  if (!values.fullName?.trim() || !values.memberId?.trim() || !values.age || !values.gender || !phone || !values.address?.trim() || !values.registrationDate) {
    return setNotice('error', 'Complete all required fields – እባክዎ ሁሉንም አስፈላጊ መስኮች ይሙሉ።');
  }
  if (!Number.isInteger(values.age) || values.age < 1 || values.age > 120) {
    return setNotice('error', 'Age must be a whole number from 1 to 120 – ዕድሜ ከ1 እስከ 120 ያለ ሙሉ ቁጥር መሆን አለበት።');
  }
  if (!/^\+?[0-9]{7,15}$/.test(phone) || (guardianPhone && !/^\+?[0-9]{7,15}$/.test(guardianPhone))) {
    return setNotice('error', 'Enter a valid phone number – ትክክለኛ የስልክ ቁጥር ያስገቡ።');
  }
  if (state.context.organization === 'sunday-school' && (!values.guardianName?.trim() || !guardianPhone)) {
    return setNotice('error', 'Parent/Guardian name and phone are required – የወላጅ/አሳዳጊ ስም እና ስልክ ያስፈልጋሉ።');
  }
  const all = members();
  const normalizedId = values.memberId.trim().toLocaleLowerCase();
  if (all.some((member) => member.scope === contextKey() && member.memberId.trim().toLocaleLowerCase() === normalizedId && member.id !== state.editingMember)) {
    return setNotice('error', 'Member ID already exists in this section – ይህ የአባል መለያ ቁጥር በዚህ ክፍል ውስጥ አስቀድሞ አለ።');
  }
  const current = state.editingMember ? all.find((member) => member.id === state.editingMember) : null;
  const member = {
    ...current,
    ...values,
    id: current?.id || uniqueId(),
    scope: contextKey(),
    religion: state.context.religion,
    organization: state.context.organization || '',
    year: state.context.year || '',
    category: state.context.category || '',
    customReligionName: state.context.customReligionName || '',
    phone,
    guardianPhone,
    photo: state.form.photo || current?.photo || ''
  };
  const next = current ? all.map((item) => item.id === member.id ? member : item) : [...all, member];
  if (!write(KEYS.members, next)) return;
  const wasEdit = Boolean(current);
  resetMemberForm();
  state.notice = null;
  showToast(wasEdit
    ? 'Member updated successfully – የአባሉ መረጃ በተሳካ ሁኔታ ተስተካክሏል።'
    : 'Member registered successfully – አባሉ በተሳካ ሁኔታ ተመዝግቧል።');
  render();
}

function submitResult(formElement) {
  const values = Object.fromEntries(new FormData(formElement).entries());
  const member = sectionMembers().find((item) => item.id === values.memberRef);
  const total = Number(values.totalMarks);
  const obtained = Number(values.obtainedMarks);
  if (!member) return showToast('Select an existing registered member – የተመዘገበ አባል ይምረጡ።', true);
  if (!values.subject?.trim() || !Number.isFinite(total) || total <= 0 || !Number.isFinite(obtained) || obtained < 0) {
    return showToast('Enter a subject and valid marks – የትምህርት ዓይነት እና ትክክለኛ ነጥብ ያስገቡ።', true);
  }
  if (obtained > total) return showToast('Obtained marks cannot exceed total marks – የተገኘው ነጥብ ከጠቅላላው በላይ መሆን አይችልም።', true);
  const percentage = obtained / total * 100;
  const all = results();
  const current = state.editingResult ? all.find((item) => item.id === state.editingResult) : null;
  const result = {
    ...current, ...values,
    id: current?.id || uniqueId(),
    memberRef: member.id,
    scope: contextKey(),
    ageCategory: state.context.category || '',
    totalMarks: total,
    obtainedMarks: obtained,
    percentage: Number(percentage.toFixed(2)),
    grade: gradeFor(percentage),
    subject: values.subject.trim()
  };
  const next = current ? all.map((item) => item.id === result.id ? result : item) : [...all, result];
  if (!write(KEYS.results, next)) return;
  resetResultForm();
  showToast(current ? 'Result updated – ውጤቱ ተስተካክሏል።' : 'Result saved successfully – ውጤቱ በተሳካ ሁኔታ ተቀምጧል።');
  render();
}

function setNotice(type, text) {
  state.notice = null;
  showToast(text, type);
}

document.addEventListener('click', handleClick);
app.addEventListener('input', handleInput);
app.addEventListener('change', handleChange);
app.addEventListener('submit', handleSubmit);
componentsReady.then(() => {
  render();
}).catch((error) => {
  console.error('Unable to initialize the application components', error);
  app.innerHTML = '<section class="panel notice notice-error" role="alert">The page could not load its components. Run this project with VS Code Live Server and check the browser console.</section>';
});
