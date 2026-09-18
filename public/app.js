// Bon Meeting Recap — Frontend Client Logic (Odoo SSO & Lean Architecture)

let currentUser = null;
let currentMeetingId = null;
let currentMeetingData = null;
let allMeetings = [];
let mediaRecorder = null;
let recordedChunks = [];
let recordInterval = null;
let recordSeconds = 0;
let recordedAudioBlob = null;
let serverHasKey = false;

// DOM Elements — Auth & User Profile
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginEmailInput = document.getElementById('loginEmailInput');
const loginPasswordInput = document.getElementById('loginPasswordInput');
const loginProfileSelect = document.getElementById('loginProfileSelect');
const loginErrorAlert = document.getElementById('loginErrorAlert');
const loginErrorText = document.getElementById('loginErrorText');
const btnSubmitLogin = document.getElementById('btnSubmitLogin');

const userProfileBar = document.getElementById('userProfileBar');
const userAvatar = document.getElementById('userAvatar');
const userNameDisplay = document.getElementById('userNameDisplay');
const userEnvBadge = document.getElementById('userEnvBadge');
const btnLogout = document.getElementById('btnLogout');

// DOM Elements — Header & Key
const btnApiKey = document.getElementById('btnApiKey');
const apiKeyDot = document.getElementById('apiKeyDot');
const apiKeyLabel = document.getElementById('apiKeyLabel');
const apiKeyBanner = document.getElementById('apiKeyBanner');
const apiKeyModal = document.getElementById('apiKeyModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnSaveApiKey = document.getElementById('btnSaveApiKey');
const inputApiKeyModal = document.getElementById('inputApiKeyModal');
const bannerInputKeyBtn = document.getElementById('bannerInputKeyBtn');

const btnNewRecap = document.getElementById('btnNewRecap');
const searchInput = document.getElementById('searchInput');
const meetingsList = document.getElementById('meetingsList');
const emptyListState = document.getElementById('emptyListState');

// Mobile drawer elements
const btnOpenMobileDrawer = document.getElementById('btnOpenMobileDrawer');
const btnCloseMobileDrawer = document.getElementById('btnCloseMobileDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const sidebarDrawer = document.getElementById('sidebarDrawer');
const btnMobileBack = document.getElementById('btnMobileBack');

function openDrawer() {
  sidebarDrawer.classList.remove('-translate-x-full');
  drawerBackdrop.classList.remove('hidden');
}

function closeDrawer() {
  sidebarDrawer.classList.add('-translate-x-full');
  drawerBackdrop.classList.add('hidden');
}

if (btnOpenMobileDrawer) btnOpenMobileDrawer.addEventListener('click', openDrawer);
if (btnCloseMobileDrawer) btnCloseMobileDrawer.addEventListener('click', closeDrawer);
if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);
if (btnMobileBack) {
  btnMobileBack.addEventListener('click', () => {
    currentMeetingId = null;
    currentMeetingData = null;
    detailSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    openDrawer();
  });
}

const uploadSection = document.getElementById('uploadSection');
const detailSection = document.getElementById('detailSection');

const tabUploadMode = document.getElementById('tabUploadMode');
const tabRecordMode = document.getElementById('tabRecordMode');
const dropZoneContainer = document.getElementById('dropZoneContainer');
const dropZone = document.getElementById('dropZone');
const audioFileInput = document.getElementById('audioFileInput');
const selectedFileInfo = document.getElementById('selectedFileInfo');
const selectedFileName = document.getElementById('selectedFileName');
const selectedFileSize = document.getElementById('selectedFileSize');

let activeMediaStream = null;

const recordContainer = document.getElementById('recordContainer');
const btnStartRecord = document.getElementById('btnStartRecord');
const btnStartRecordText = document.getElementById('btnStartRecordText');
const btnStopRecord = document.getElementById('btnStopRecord');
const btnCancelRecord = document.getElementById('btnCancelRecord');
const recordTimer = document.getElementById('recordTimer');
const recordPing = document.getElementById('recordPing');
const recordStatusText = document.getElementById('recordStatusText');
const recordedAudioContainer = document.getElementById('recordedAudioContainer');
const recordedAudioPreview = document.getElementById('recordedAudioPreview');
const recordedDurationText = document.getElementById('recordedDurationText');

const meetingTitleInput = document.getElementById('meetingTitleInput');
const attendeesInput = document.getElementById('attendeesInput');
const meetingGoalInput = document.getElementById('meetingGoalInput');
const btnToggleAdvanced = document.getElementById('btnToggleAdvanced');
const advancedContent = document.getElementById('advancedContent');
const advancedArrow = document.getElementById('advancedArrow');
const customPromptInput = document.getElementById('customPromptInput');

const processForm = document.getElementById('processForm');
const btnSubmitRecap = document.getElementById('btnSubmitRecap');
const processingCard = document.getElementById('processingCard');

// Detail elements
const detailTitle = document.getElementById('detailTitle');
const detailDate = document.getElementById('detailDate');
const detailLanguageBadge = document.getElementById('detailLanguageBadge');
const detailDuration = document.getElementById('detailDuration');
const detailAttendeesContainer = document.getElementById('detailAttendeesContainer');
const detailAttendeesList = document.getElementById('detailAttendeesList');
const detailExecutiveSummary = document.getElementById('detailExecutiveSummary');
const detailDecisionsList = document.getElementById('detailDecisionsList');
const detailActionItemsList = document.getElementById('detailActionItemsList');
const actionItemsProgressBadge = document.getElementById('actionItemsProgressBadge');
const openQuestionsSection = document.getElementById('openQuestionsSection');
const detailOpenQuestionsList = document.getElementById('detailOpenQuestionsList');
const risksSection = document.getElementById('risksSection');
const detailRisksList = document.getElementById('detailRisksList');
const detailTopicsContainer = document.getElementById('detailTopicsContainer');
const detailTranscriptList = document.getElementById('detailTranscriptList');
const transcriptCard = document.getElementById('transcriptCard');
const meetingAudioPlayer = document.getElementById('meetingAudioPlayer');

const btnCopyAll = document.getElementById('btnCopyAll');
const btnDownloadMd = document.getElementById('btnDownloadMd');
const btnDownloadWord = document.getElementById('btnDownloadWord');
const btnDownloadExcel = document.getElementById('btnDownloadExcel');
const btnDeleteMeeting = document.getElementById('btnDeleteMeeting');

// Odoo Banner & Modal Elements
const odooProjectBanner = document.getElementById('odooProjectBanner');
const odooBannerTitle = document.getElementById('odooBannerTitle');
const odooBannerMeta = document.getElementById('odooBannerMeta');
const odooBannerLink = document.getElementById('odooBannerLink');
const btnOpenOdooModal = document.getElementById('btnOpenOdooModal');

const odooModal = document.getElementById('odooModal');
const btnCloseOdooModal = document.getElementById('btnCloseOdooModal');
const btnCancelOdooModal = document.getElementById('btnCancelOdooModal');
const odooProjectNameInput = document.getElementById('odooProjectNameInput');
const odooProfileSelect = document.getElementById('odooProfileSelect');
const odooTasksPreviewList = document.getElementById('odooTasksPreviewList');
const odooModalTaskCountBadge = document.getElementById('odooModalTaskCountBadge');
const btnModalDownloadExcel = document.getElementById('btnModalDownloadExcel');
const chkOdooDisclaimer = document.getElementById('chkOdooDisclaimer');
const btnConfirmPushOdoo = document.getElementById('btnConfirmPushOdoo');

const odooModalNormalView = document.getElementById('odooModalNormalView');
const odooModalLoadingView = document.getElementById('odooModalLoadingView');
const odooModalSuccessView = document.getElementById('odooModalSuccessView');
const odooSuccessProjectName = document.getElementById('odooSuccessProjectName');
const odooSuccessMeta = document.getElementById('odooSuccessMeta');
const odooSuccessLink = document.getElementById('odooSuccessLink');
const btnCloseOdooSuccessModal = document.getElementById('btnCloseOdooSuccessModal');

// Toast
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

function showToast(msg, isError = false) {
  toastMessage.textContent = msg;
  toast.className = `fixed bottom-6 right-6 ${
    isError ? 'bg-red-600' : 'bg-slate-900'
  } text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 z-50 transition-all`;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

// =========================================================================
// 1. Odoo Authentication & SSO Management
// =========================================================================

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.authenticated && data.user) {
      currentUser = data.user;
      renderUserBar();
      loginModal.classList.add('hidden');
      await checkConfig();
      await loadMeetings();
      return true;
    }
  } catch (err) {
    console.error('Auth check error:', err);
  }

  // Not authenticated -> show login modal
  currentUser = null;
  userProfileBar.classList.add('hidden');
  loginModal.classList.remove('hidden');
  return false;
}

function renderUserBar() {
  if (!currentUser) return;
  userProfileBar.classList.remove('hidden');
  const initial = (currentUser.name || 'U').trim().charAt(0).toUpperCase();
  userAvatar.textContent = initial;
  userNameDisplay.textContent = currentUser.name || currentUser.email;
  userEnvBadge.textContent = currentUser.profile || 'skillbon';
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErrorAlert.classList.add('hidden');

    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value.trim();
    const profile = loginProfileSelect.value;

    if (!email || !password) {
      loginErrorText.textContent = 'Vui lòng điền đầy đủ Email và Mật khẩu Odoo.';
      loginErrorAlert.classList.remove('hidden');
      return;
    }

    btnSubmitLogin.disabled = true;
    btnSubmitLogin.innerHTML = `
      <div class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
      <span>Đang xác thực qua Odoo...</span>
    `;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: email, password, profile }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Email hoặc mật khẩu Odoo không chính xác.');
      }

      currentUser = data.user;
      renderUserBar();
      loginModal.classList.add('hidden');
      loginPasswordInput.value = '';
      showToast(`Xin chào ${currentUser.name}!`);

      await checkConfig();
      await loadMeetings();
    } catch (err) {
      console.error('Login error:', err);
      loginErrorText.textContent = err.message || 'Không thể đăng nhập. Kiểm tra kết nối mạng.';
      loginErrorAlert.classList.remove('hidden');
    } finally {
      btnSubmitLogin.disabled = false;
      btnSubmitLogin.innerHTML = `
        <span>Đăng Nhập</span>
        <i data-lucide="arrow-right" class="w-4 h-4"></i>
      `;
      if (window.lucide) lucide.createIcons();
    }
  });
}

if (btnLogout) {
  btnLogout.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    currentUser = null;
    currentMeetingId = null;
    currentMeetingData = null;
    userProfileBar.classList.add('hidden');
    detailSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    meetingsList.innerHTML = '';
    emptyListState.classList.remove('hidden');
    meetingsList.appendChild(emptyListState);
    loginModal.classList.remove('hidden');
    showToast('Đã đăng xuất.');
  });
}

// =========================================================================
// 2. Gemini Config & API Key
// =========================================================================

async function checkConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    serverHasKey = Boolean(data.hasApiKey);
    const localKey = localStorage.getItem('gemini_api_key');

    if (serverHasKey || localKey) {
      apiKeyDot.className = 'w-2 h-2 rounded-full bg-emerald-500';
      apiKeyLabel.textContent = serverHasKey ? 'API Key (.env)' : 'API Key (Browser)';
      apiKeyBanner.classList.add('hidden');
    } else {
      apiKeyDot.className = 'w-2 h-2 rounded-full bg-amber-400';
      apiKeyLabel.textContent = 'Thiếu Key';
      apiKeyBanner.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Config check failed:', err);
  }
}

function getActiveApiKey() {
  return localStorage.getItem('gemini_api_key') || null;
}

btnApiKey.addEventListener('click', () => {
  inputApiKeyModal.value = localStorage.getItem('gemini_api_key') || '';
  apiKeyModal.classList.remove('hidden');
});
bannerInputKeyBtn.addEventListener('click', () => {
  inputApiKeyModal.value = localStorage.getItem('gemini_api_key') || '';
  apiKeyModal.classList.remove('hidden');
});
btnCloseModal.addEventListener('click', () => apiKeyModal.classList.add('hidden'));
btnSaveApiKey.addEventListener('click', () => {
  const val = inputApiKeyModal.value.trim();
  if (val) {
    localStorage.setItem('gemini_api_key', val);
    showToast('Đã lưu Gemini API Key!');
  } else {
    localStorage.removeItem('gemini_api_key');
    showToast('Đã xóa Gemini API Key cục bộ.');
  }
  apiKeyModal.classList.add('hidden');
  checkConfig();
});

// Advanced toggle
btnToggleAdvanced.addEventListener('click', () => {
  advancedContent.classList.toggle('hidden');
  advancedArrow.classList.toggle('rotate-180');
});

// =========================================================================
// 3. Mode Switching (Upload vs Record)
// =========================================================================

tabUploadMode.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    if (!confirm('Bạn đang ghi âm. Bạn có chắc muốn chuyển sang Upload file (bản ghi âm dở dang sẽ bị hủy)?')) {
      return;
    }
    btnCancelRecord.click();
  }
  tabUploadMode.className = 'flex-1 py-1.5 rounded-lg bg-white text-slate-900 shadow-sm transition-all flex items-center justify-center space-x-1.5';
  tabRecordMode.className = 'flex-1 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center space-x-1.5';
  dropZoneContainer.classList.remove('hidden');
  recordContainer.classList.add('hidden');
  updateSubmitState();
});

tabRecordMode.addEventListener('click', () => {
  tabRecordMode.className = 'flex-1 py-1.5 rounded-lg bg-white text-slate-900 shadow-sm transition-all flex items-center justify-center space-x-1.5';
  tabUploadMode.className = 'flex-1 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center space-x-1.5';
  dropZoneContainer.classList.add('hidden');
  recordContainer.classList.remove('hidden');
  updateSubmitState();
});

function updateSubmitState() {
  const isUploadMode = !dropZoneContainer.classList.contains('hidden');
  if (isUploadMode) {
    btnSubmitRecap.disabled = !audioFileInput.files || audioFileInput.files.length === 0;
  } else {
    btnSubmitRecap.disabled = !recordedAudioBlob;
  }
}

// File Drag & Drop
dropZone.addEventListener('click', () => audioFileInput.click());
audioFileInput.addEventListener('change', () => {
  if (audioFileInput.files && audioFileInput.files[0]) {
    handleFileSelected(audioFileInput.files[0]);
  }
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('border-blue-500', 'bg-blue-50/50');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    audioFileInput.files = e.dataTransfer.files;
    handleFileSelected(e.dataTransfer.files[0]);
  }
});

function handleFileSelected(file) {
  selectedFileName.textContent = file.name;
  selectedFileSize.textContent = formatBytes(file.size);
  selectedFileInfo.classList.remove('hidden');
  if (!meetingTitleInput.value.trim()) {
    meetingTitleInput.value = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }
  updateSubmitState();
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Audio Recording (In-Browser)
btnStartRecord.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    activeMediaStream = stream;
    recordedChunks = [];
    recordedAudioBlob = null;
    recordedAudioContainer.classList.add('hidden');
    recordedAudioPreview.classList.add('hidden');

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4';

    mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      if (recordedChunks.length > 0) {
        recordedAudioBlob = new Blob(recordedChunks, { type: mimeType });
        recordedAudioPreview.src = URL.createObjectURL(recordedAudioBlob);
        recordedAudioContainer.classList.remove('hidden');
        recordedAudioPreview.classList.remove('hidden');
        if (recordedDurationText) {
          const mins = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
          const secs = String(recordSeconds % 60).padStart(2, '0');
          recordedDurationText.textContent = `${mins}:${secs}`;
        }
        if (!meetingTitleInput.value.trim()) {
          const now = new Date();
          const dateStr = now.toLocaleDateString('vi-VN');
          const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          meetingTitleInput.value = `Ghi âm cuộc họp - ${dateStr} ${timeStr}`;
        }
        updateSubmitState();
        showToast('✓ Đã lưu bản ghi âm! Bấm "Bắt Đầu Tóm Tắt" bên dưới.');
      }
      if (activeMediaStream) {
        activeMediaStream.getTracks().forEach((track) => track.stop());
        activeMediaStream = null;
      }
    };

    mediaRecorder.start(1000);

    recordSeconds = 0;
    recordTimer.textContent = '00:00';
    recordStatusText.textContent = 'Đang ghi âm trực tiếp...';
    recordPing.classList.remove('hidden');
    btnStartRecord.classList.add('hidden');
    btnStopRecord.classList.remove('hidden');
    btnStopRecord.disabled = false;
    btnCancelRecord.classList.remove('hidden');
    btnSubmitRecap.disabled = true;

    recordInterval = setInterval(() => {
      recordSeconds++;
      const mins = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
      const secs = String(recordSeconds % 60).padStart(2, '0');
      recordTimer.textContent = `${mins}:${secs}`;
    }, 1000);
  } catch (err) {
    console.error('Microphone error:', err);
    showToast('Không thể truy cập Microphone! Vui lòng cấp quyền micro trên trình duyệt.', true);
  }
});

btnStopRecord.addEventListener('click', () => {
  btnStopRecord.disabled = true;
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  clearInterval(recordInterval);
  recordPing.classList.add('hidden');
  recordStatusText.textContent = 'Ghi âm hoàn tất! Bạn có thể nghe lại bên dưới trước khi tóm tắt.';
  btnStartRecord.classList.remove('hidden');
  if (btnStartRecordText) btnStartRecordText.textContent = 'Ghi Âm Lại';
  btnStopRecord.classList.add('hidden');
  btnCancelRecord.classList.add('hidden');
  btnStopRecord.disabled = false;
});

btnCancelRecord.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.ondataavailable = null;
    mediaRecorder.onstop = null;
    mediaRecorder.stop();
  }
  if (activeMediaStream) {
    activeMediaStream.getTracks().forEach((track) => track.stop());
    activeMediaStream = null;
  }
  clearInterval(recordInterval);
  recordedChunks = [];
  recordedAudioBlob = null;
  recordPing.classList.add('hidden');
  recordTimer.textContent = '00:00';
  recordStatusText.textContent = 'Đã hủy ghi âm. Sẵn sàng ghi âm mới.';
  btnStartRecord.classList.remove('hidden');
  if (btnStartRecordText) btnStartRecordText.textContent = 'Bắt Đầu Ghi Âm';
  btnStopRecord.classList.add('hidden');
  btnCancelRecord.classList.add('hidden');
  recordedAudioContainer.classList.add('hidden');
  updateSubmitState();
  showToast('Đã hủy bản ghi âm.');
});

// =========================================================================
// 4. Meeting Process & Upload
// =========================================================================

processForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentUser) {
    loginModal.classList.remove('hidden');
    showToast('Vui lòng đăng nhập Odoo trước!', true);
    return;
  }

  const isUploadMode = !dropZoneContainer.classList.contains('hidden');

  if (!isUploadMode && mediaRecorder && mediaRecorder.state === 'recording') {
    showToast('Vui lòng bấm "Dừng & Sử Dụng" để hoàn tất ghi âm trước!', true);
    return;
  }

  let audioFile = null;

  if (isUploadMode) {
    audioFile = audioFileInput.files[0];
  } else if (recordedAudioBlob) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = (recordedAudioBlob.type && recordedAudioBlob.type.includes('mp4')) ? 'm4a' : 'webm';
    audioFile = new File([recordedAudioBlob], `meeting-record-${timestamp}.${ext}`, {
      type: recordedAudioBlob.type || 'audio/webm',
    });
  }

  if (!audioFile) {
    showToast('Vui lòng chọn hoặc ghi âm file âm thanh trước!', true);
    return;
  }

  // Check key
  const apiKey = getActiveApiKey();
  if (!serverHasKey && !apiKey) {
    apiKeyModal.classList.remove('hidden');
    showToast('Vui lòng nhập Gemini API Key để tiếp tục!', true);
    return;
  }

  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('file', audioFile); // dual-field for maximum compatibility
  if (meetingTitleInput.value.trim()) {
    formData.append('title', meetingTitleInput.value.trim());
  }
  if (attendeesInput && attendeesInput.value.trim()) {
    formData.append('attendees', attendeesInput.value.trim());
  }
  if (meetingGoalInput && meetingGoalInput.value.trim()) {
    formData.append('meetingGoal', meetingGoalInput.value.trim());
  }
  if (customPromptInput.value.trim()) {
    formData.append('customPrompt', customPromptInput.value.trim());
  }

  // UI state
  btnSubmitRecap.disabled = true;
  processForm.classList.add('hidden');
  processingCard.classList.remove('hidden');

  try {
    const headers = {};
    if (apiKey) {
      headers['x-gemini-api-key'] = apiKey;
    }

    const res = await fetch('/api/meetings/process', {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      if (data.needLogin) {
        currentUser = null;
        loginModal.classList.remove('hidden');
      }
      throw new Error(data.error || 'Xử lý thất bại');
    }

    showToast('Tạo bản tóm tắt cuộc họp thành công!');
    await loadMeetings();
    viewMeeting(data.meeting.id);
  } catch (err) {
    console.error('Processing failed:', err);
    showToast(err.message || 'Lỗi khi gửi lên Gemini API', true);
  } finally {
    processingCard.classList.add('hidden');
    processForm.classList.remove('hidden');
    btnSubmitRecap.disabled = false;
  }
});

// =========================================================================
// 5. Load & Render Meetings List
// =========================================================================

async function loadMeetings() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/meetings');
    const data = await res.json();
    if (res.status === 401 && data.needLogin) {
      currentUser = null;
      loginModal.classList.remove('hidden');
      return;
    }
    allMeetings = data.meetings || [];
    renderMeetingsList(allMeetings);
  } catch (err) {
    console.error('Failed to load meetings:', err);
  }
}

function renderMeetingsList(meetings) {
  meetingsList.innerHTML = '';
  if (meetings.length === 0) {
    emptyListState.classList.remove('hidden');
    meetingsList.appendChild(emptyListState);
    return;
  }
  emptyListState.classList.add('hidden');

  for (const m of meetings) {
    const item = document.createElement('div');
    const isActive = m.id === currentMeetingId;
    item.className = `p-3 rounded-xl cursor-pointer transition-all ${
      isActive
        ? 'bg-blue-50/80 border border-blue-200/80'
        : 'hover:bg-slate-50 border border-transparent'
    }`;

    const date = new Date(m.createdAt).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const odooBadge = m.odooProjectUrl
      ? `<span class="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold text-[9px] border border-purple-200">ODOO ✓</span>`
      : '';

    item.innerHTML = `
      <div class="flex items-start justify-between gap-1">
        <h4 class="font-semibold text-xs text-slate-800 line-clamp-1">${escapeHtml(m.title)}</h4>
        <span class="text-[10px] text-slate-400 shrink-0">${date}</span>
      </div>
      <p class="text-[11px] text-slate-500 mt-1 line-clamp-2">${escapeHtml(m.executiveSummaryPreview || '')}</p>
      <div class="flex items-center space-x-1.5 mt-2 text-[10px]">
        <span class="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">${m.actionItemsCount} tasks</span>
        <span class="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">${m.decisionsCount} quyết định</span>
        ${odooBadge}
      </div>
    `;

    item.addEventListener('click', () => viewMeeting(m.id));
    meetingsList.appendChild(item);
  }
  if (window.lucide) lucide.createIcons();
}

// Search filter
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) {
    renderMeetingsList(allMeetings);
    return;
  }
  const filtered = allMeetings.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      m.executiveSummaryPreview.toLowerCase().includes(q),
  );
  renderMeetingsList(filtered);
});

// =========================================================================
// 6. View Meeting Detail & Render Sections
// =========================================================================

async function viewMeeting(id) {
  closeDrawer();
  currentMeetingId = id;
  renderMeetingsList(allMeetings);

  try {
    const res = await fetch(`/api/meetings/${id}`);
    const data = await res.json();
    if (!res.ok || !data.meeting) throw new Error(data.error || 'Không tìm thấy cuộc họp');

    const m = data.meeting;
    currentMeetingData = m;
    const r = m.recap;

    detailTitle.textContent = r.title || m.title;
    detailDate.textContent = new Date(m.createdAt).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    detailLanguageBadge.textContent = (r.language || 'VI').toUpperCase();
    detailDuration.textContent = r.durationEstimate ? `• ${r.durationEstimate}` : '';

    // Render Odoo Linked Banner
    if (m.odooProject) {
      odooProjectBanner.classList.remove('hidden');
      odooBannerTitle.textContent = `Đã liên kết Dự án Odoo #${m.odooProject.projectId}: ${m.odooProject.projectName}`;
      const dateStr = new Date(m.odooProject.pushedAt).toLocaleString('vi-VN');
      odooBannerMeta.textContent = `Khởi tạo bởi ${m.odooProject.pushedBy} lúc ${dateStr} • ${m.odooProject.tasksCount} tasks`;
      odooBannerLink.href = m.odooProject.projectUrl;
    } else {
      odooProjectBanner.classList.add('hidden');
    }

    // Audio player
    if (m.audioFileName) {
      meetingAudioPlayer.src = `/api/meetings/${id}/audio`;
      document.getElementById('audioPlayerContainer').classList.remove('hidden');
    } else {
      document.getElementById('audioPlayerContainer').classList.add('hidden');
    }

    // Attendees
    if (r.attendees && r.attendees.length > 0) {
      detailAttendeesList.innerHTML = r.attendees
        .map(
          (a) =>
            `<span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]">${escapeHtml(
              a,
            )}</span>`,
        )
        .join('');
      detailAttendeesContainer.classList.remove('hidden');
    } else {
      detailAttendeesContainer.classList.add('hidden');
    }

    // Summary
    detailExecutiveSummary.textContent = r.executiveSummary || 'Chưa có tóm tắt.';

    // Decisions
    detailDecisionsList.innerHTML = '';
    if (!r.decisions || r.decisions.length === 0) {
      detailDecisionsList.innerHTML = '<li class="text-slate-400 italic">Không có quyết định nào được ghi nhận.</li>';
    } else {
      for (const d of r.decisions) {
        const li = document.createElement('li');
        li.className = 'flex items-start space-x-2';
        li.innerHTML = `
          <i data-lucide="check" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
          <span>${escapeHtml(d)}</span>
        `;
        detailDecisionsList.appendChild(li);
      }
    }

    // Action Items
    renderActionItems(m);

    // Open Questions
    detailOpenQuestionsList.innerHTML = '';
    if (r.openQuestions && r.openQuestions.length > 0) {
      openQuestionsSection.classList.remove('hidden');
      for (const q of r.openQuestions) {
        const li = document.createElement('li');
        li.className =
          'flex items-start space-x-2 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/80';
        li.innerHTML = `
          <i data-lucide="help-circle" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
          <div class="flex-1">
            <span class="font-medium text-slate-800">${escapeHtml(q.question)}</span>
            ${
              q.owner
                ? `<span class="block text-[11px] text-amber-700 mt-0.5">Chờ phản hồi từ: <strong>${escapeHtml(
                    q.owner,
                  )}</strong></span>`
                : ''
            }
          </div>
        `;
        detailOpenQuestionsList.appendChild(li);
      }
    } else {
      openQuestionsSection.classList.add('hidden');
    }

    // Risks
    detailRisksList.innerHTML = '';
    if (r.risks && r.risks.length > 0) {
      risksSection.classList.remove('hidden');
      for (const risk of r.risks) {
        const li = document.createElement('li');
        li.className =
          'flex items-start space-x-2 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100/80';
        li.innerHTML = `
          <i data-lucide="alert-octagon" class="w-4 h-4 text-rose-600 shrink-0 mt-0.5"></i>
          <span class="text-slate-800">${escapeHtml(risk)}</span>
        `;
        detailRisksList.appendChild(li);
      }
    } else {
      risksSection.classList.add('hidden');
    }

    // Topics
    detailTopicsContainer.innerHTML = '';
    if (!r.topics || r.topics.length === 0) {
      detailTopicsContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Không có phân mục chủ đề.</p>';
    } else {
      for (const topic of r.topics) {
        const tCard = document.createElement('div');
        tCard.className = 'p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5';
        let keyPointsHtml = '';
        if (topic.keyPoints && topic.keyPoints.length > 0) {
          keyPointsHtml = `<ul class="list-disc list-inside text-xs text-slate-600 space-y-0.5 mt-1">
            ${topic.keyPoints.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
          </ul>`;
        }
        tCard.innerHTML = `
          <h4 class="font-bold text-xs text-slate-800">${escapeHtml(topic.title)}</h4>
          <p class="text-xs text-slate-600">${escapeHtml(topic.summary)}</p>
          ${keyPointsHtml}
        `;
        detailTopicsContainer.appendChild(tCard);
      }
    }

    // Transcript
    detailTranscriptList.innerHTML = '';
    if (r.transcript && r.transcript.length > 0) {
      transcriptCard.classList.remove('hidden');
      for (const seg of r.transcript) {
        const row = document.createElement('div');
        row.className = 'p-2 rounded-lg bg-slate-50 border border-slate-100/80 flex items-start space-x-2 text-xs';
        row.innerHTML = `
          <span class="font-mono text-[11px] text-blue-600 shrink-0 font-semibold">${escapeHtml(seg.timestamp || '')}</span>
          <div>
            ${seg.speaker ? `<span class="font-semibold text-slate-800 mr-1">${escapeHtml(seg.speaker)}:</span>` : ''}
            <span class="text-slate-600">${escapeHtml(seg.text)}</span>
          </div>
        `;
        detailTranscriptList.appendChild(row);
      }
    } else {
      transcriptCard.classList.add('hidden');
    }

    // Switch view
    uploadSection.classList.add('hidden');
    detailSection.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error('Failed to view meeting:', err);
    showToast(err.message, true);
  }
}

function renderActionItems(meeting) {
  const items = meeting.recap.actionItems || [];
  detailActionItemsList.innerHTML = '';

  const completedCount = items.filter((i) => i.completed).length;
  actionItemsProgressBadge.textContent = `${completedCount}/${items.length} Đã xong`;

  if (items.length === 0) {
    detailActionItemsList.innerHTML = '<p class="text-xs text-slate-400 italic py-2">Không có action items nào.</p>';
    return;
  }

  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'py-3 flex items-start justify-between gap-3';

    const priorityBadge =
      item.priority === 'high'
        ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">HIGH</span>'
        : item.priority === 'low'
        ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">LOW</span>'
        : '<span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">MED</span>';

    const isChecked = Boolean(item.completed);

    row.innerHTML = `
      <label class="flex items-start space-x-3 flex-1 cursor-pointer select-none py-1">
        <input type="checkbox" ${isChecked ? 'checked' : ''} class="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0">
        <div class="space-y-0.5 min-w-0 flex-1">
          <p class="text-xs font-semibold text-slate-800 break-words leading-relaxed ${isChecked ? 'line-through text-slate-400' : ''}">${escapeHtml(item.task)}</p>
          ${item.description && item.description !== item.task ? `<p class="text-[11px] text-slate-500 break-words leading-normal mt-0.5 bg-slate-50 p-1.5 rounded border border-slate-100">${escapeHtml(item.description)}</p>` : ''}
          <div class="flex items-center space-x-2.5 text-[11px] text-slate-400 flex-wrap gap-y-0.5 pt-0.5">
            ${item.assignee ? `<span>👤 <strong class="text-slate-700">${escapeHtml(item.assignee)}</strong></span>` : ''}
            ${item.dueDate ? `<span>📅 <strong class="text-slate-700">${escapeHtml(item.dueDate)}</strong></span>` : ''}
          </div>
        </div>
      </label>
      <div class="shrink-0 pt-1">
        ${priorityBadge}
      </div>
    `;

    const checkbox = row.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', async () => {
      try {
        const res = await fetch(`/api/meetings/${meeting.id}/action-items/${index}/toggle`, {
          method: 'POST',
        });
        const d = await res.json();
        if (res.ok && d.meeting) {
          currentMeetingData = d.meeting;
          renderActionItems(d.meeting);
          showToast('Đã cập nhật trạng thái nhiệm vụ!');
        }
      } catch (e) {
        console.error('Toggle failed:', e);
      }
    });

    detailActionItemsList.appendChild(row);
  });
}

// =========================================================================
// 7. Human Review & Push to Odoo Modal Logic
// =========================================================================

function openOdooReviewModal() {
  if (!currentMeetingData) return;

  const m = currentMeetingData;
  const items = m.recap.actionItems || [];

  if (items.length === 0) {
    showToast('Cuộc họp này không có Action Items nào để tạo dự án Odoo!', true);
    return;
  }

  odooProjectNameInput.value = (m.recap.title || m.title || 'Dự án từ Cuộc họp').trim();
  odooProfileSelect.value = currentUser?.profile || 'skillbon';
  odooModalTaskCountBadge.textContent = `${items.length} tasks`;

  // Render tasks preview list
  odooTasksPreviewList.innerHTML = '';
  items.forEach((item, idx) => {
    const taskRow = document.createElement('div');
    taskRow.className = 'py-2 flex items-start justify-between gap-2';
    taskRow.innerHTML = `
      <div class="min-w-0 flex-1">
        <div class="flex items-center space-x-1.5">
          <span class="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1 rounded">TSK-${String(idx + 1).padStart(2, '0')}</span>
          <span class="font-semibold text-slate-800 truncate">${escapeHtml(item.task)}</span>
        </div>
        <div class="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-2">
          <span>Người làm: <strong class="text-slate-600">${escapeHtml(item.assignee || 'Chưa chỉ định')}</strong></span>
          <span>• Hạn: <strong class="text-slate-600">${escapeHtml(item.dueDate || 'Hôm nay')}</strong></span>
        </div>
      </div>
      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${
        item.priority === 'high' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
      }">${(item.priority || 'MED').toUpperCase()}</span>
    `;
    odooTasksPreviewList.appendChild(taskRow);
  });

  // Reset disclaimer and button
  chkOdooDisclaimer.checked = false;
  btnConfirmPushOdoo.disabled = true;

  // Views
  odooModalNormalView.classList.remove('hidden');
  odooModalLoadingView.classList.add('hidden');
  odooModalSuccessView.classList.add('hidden');

  odooModal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

if (btnOpenOdooModal) {
  btnOpenOdooModal.addEventListener('click', openOdooReviewModal);
}

if (btnCloseOdooModal) {
  btnCloseOdooModal.addEventListener('click', () => odooModal.classList.add('hidden'));
}
if (btnCancelOdooModal) {
  btnCancelOdooModal.addEventListener('click', () => odooModal.classList.add('hidden'));
}
if (btnCloseOdooSuccessModal) {
  btnCloseOdooSuccessModal.addEventListener('click', () => odooModal.classList.add('hidden'));
}

// Enable push button ONLY when disclaimer checkbox is checked
if (chkOdooDisclaimer) {
  chkOdooDisclaimer.addEventListener('change', () => {
    btnConfirmPushOdoo.disabled = !chkOdooDisclaimer.checked;
  });
}

// Download Excel directly from modal
if (btnModalDownloadExcel) {
  btnModalDownloadExcel.addEventListener('click', () => {
    if (!currentMeetingId) return;
    window.location.href = `/api/meetings/${currentMeetingId}/excel`;
  });
}

// Submit Push to Odoo
if (btnConfirmPushOdoo) {
  btnConfirmPushOdoo.addEventListener('click', async () => {
    if (!chkOdooDisclaimer.checked) {
      showToast('Vui lòng xác nhận điều khoản trách nhiệm!', true);
      return;
    }

    if (!currentMeetingId) return;

    // Switch to loading
    odooModalNormalView.classList.add('hidden');
    odooModalLoadingView.classList.remove('hidden');

    try {
      const res = await fetch(`/api/meetings/${currentMeetingId}/push-odoo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disclaimerAccepted: true,
          profileName: odooProfileSelect.value,
          projectName: odooProjectNameInput.value.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Khởi tạo dự án Odoo thất bại.');
      }

      const proj = data.project;
      if (currentMeetingData) {
        currentMeetingData.odooProject = proj;
      }

      // Show success view
      odooModalLoadingView.classList.add('hidden');
      odooModalSuccessView.classList.remove('hidden');

      odooSuccessProjectName.textContent = `Tên dự án: ${proj.projectName} (#${proj.projectId})`;
      odooSuccessMeta.textContent = `Đã tạo ${proj.tasksCount} tasks trên Odoo (${proj.profileName}) đứng tên ${currentUser.name}.`;
      odooSuccessLink.href = proj.projectUrl;

      // Update detail banner
      odooProjectBanner.classList.remove('hidden');
      odooBannerTitle.textContent = `Đã liên kết Dự án Odoo #${proj.projectId}: ${proj.projectName}`;
      odooBannerMeta.textContent = `Khởi tạo bởi ${proj.pushedBy} • ${proj.tasksCount} tasks`;
      odooBannerLink.href = proj.projectUrl;

      showToast('🎉 Khởi tạo dự án Odoo thành công!');
      await loadMeetings();
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      console.error('Push Odoo failed:', err);
      odooModalLoadingView.classList.add('hidden');
      odooModalNormalView.classList.remove('hidden');
      showToast(err.message, true);
    }
  });
}

// =========================================================================
// 8. General Actions
// =========================================================================

btnNewRecap.addEventListener('click', () => {
  closeDrawer();
  currentMeetingId = null;
  currentMeetingData = null;
  detailSection.classList.add('hidden');
  uploadSection.classList.remove('hidden');
  renderMeetingsList(allMeetings);
});

btnDownloadMd.addEventListener('click', () => {
  if (!currentMeetingId) return;
  window.location.href = `/api/meetings/${currentMeetingId}/markdown`;
});

if (btnDownloadWord) {
  btnDownloadWord.addEventListener('click', () => {
    if (!currentMeetingId) return;
    window.location.href = `/api/meetings/${currentMeetingId}/word`;
  });
}

if (btnDownloadExcel) {
  btnDownloadExcel.addEventListener('click', () => {
    if (!currentMeetingId) return;
    window.location.href = `/api/meetings/${currentMeetingId}/excel`;
  });
}

btnCopyAll.addEventListener('click', async () => {
  if (!currentMeetingId) return;
  try {
    const res = await fetch(`/api/meetings/${currentMeetingId}/markdown`);
    const md = await res.text();
    await navigator.clipboard.writeText(md);
    showToast('Đã copy toàn bộ nội dung Markdown vào Clipboard!');
  } catch (err) {
    showToast('Không thể copy vào clipboard', true);
  }
});

btnDeleteMeeting.addEventListener('click', async () => {
  if (!currentMeetingId) return;
  if (!confirm('Bạn có chắc chắn muốn xóa cuộc họp này cùng toàn bộ dữ liệu ghi âm?')) return;

  try {
    const res = await fetch(`/api/meetings/${currentMeetingId}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Đã xóa cuộc họp.');
      currentMeetingId = null;
      currentMeetingData = null;
      detailSection.classList.add('hidden');
      uploadSection.classList.remove('hidden');
      await loadMeetings();
    }
  } catch (err) {
    showToast('Lỗi khi xóa cuộc họp', true);
  }
});

// Utility
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initial Boot: Check Auth -> Load Data
checkAuth();
if (window.lucide) lucide.createIcons();
