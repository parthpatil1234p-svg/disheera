/**
 * contentView.js — Curated Masterclass Content Management Module (Plan 43)
 *
 * Implements YouTube video cataloging, duration/language filters, soft-disable toggle,
 * and YouTube URL allowlist enforcement with strict XSS sanitization.
 * Disheera · Enterprise Administration Service
 */

let contentCurrentPage = 1;
let contentSearchTimeout = null;

async function loadVideos(page = 1) {
  contentCurrentPage = page;
  const tbody = document.getElementById('videosTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Retrieving masterclasses...</td></tr>';

  try {
    const search = document.getElementById('videoSearchInput')?.value || '';
    const status = document.getElementById('videoStatusFilter')?.value || 'all';
    const skill = document.getElementById('videoSkillFilter')?.value || '';

    const params = new URLSearchParams({
      page,
      limit: 12,
      search,
      status,
      skillName: skill
    });

    const res = await adminFetch(`/api/admin/content/videos?${params.toString()}`);
    if (res.success) {
      renderVideosTable(res.videos, res.pagination);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-rose);">${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderVideosTable(videos, pagination) {
  const tbody = document.getElementById('videosTableBody');
  if (!tbody) return;

  if (!videos || videos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No video masterclasses found matching current criteria.</td></tr>';
    renderContentPagination(pagination);
    return;
  }

  tbody.innerHTML = videos.map(v => {
    const statusBadge = v.isActive
      ? '<span class="badge badge-emerald">Active</span>'
      : '<span class="badge badge-rose">Disabled</span>';

    return `
      <tr>
        <td>
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <img src="${escapeHtml(v.thumbnailUrl)}" style="width: 64px; height: 36px; border-radius: 4px; object-fit: cover; border: 1px solid var(--border-subtle);" alt="Thumbnail">
            <div>
              <div style="font-weight: 600; color: var(--text-primary); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <a href="${escapeHtml(v.watchUrl)}" target="_blank" style="color: var(--text-primary); text-decoration: none;" title="${escapeHtml(v.title)}">
                  ${escapeHtml(v.title)} <i class="bi bi-box-arrow-up-right" style="font-size: 0.75rem;"></i>
                </a>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(v.channelTitle)}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-indigo">${escapeHtml(v.skillName)}</span></td>
        <td><span class="badge badge-muted">${escapeHtml(v.durationCategory)}</span></td>
        <td><span class="badge badge-muted">${escapeHtml(v.language)}</span></td>
        <td>${statusBadge}</td>
        <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(v.videoId)}</td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
            <button class="btn-action" onclick="toggleVideoActive('${escapeHtml(v.skillName)}', '${escapeHtml(v.videoId)}', ${v.isActive})" title="${v.isActive ? 'Disable Masterclass' : 'Enable Masterclass'}">
              ${v.isActive ? '<i class="bi bi-pause-fill"></i> Disable' : '<i class="bi bi-play-fill"></i> Enable'}
            </button>
            <button class="btn-action" style="color: var(--accent-rose);" onclick="openDeleteVideoModal('${escapeHtml(v.skillName)}', '${escapeHtml(v.videoId)}', '${escapeHtml(v.title)}')" title="Delete Video">
              <i class="bi bi-trash3-fill"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderContentPagination(pagination);
}

function renderContentPagination(pagination) {
  const container = document.getElementById('contentPagination');
  if (!container || !pagination) return;

  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) {
    container.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">Total Masterclasses: ${escapeHtml(String(total))}</span>`;
    return;
  }

  container.innerHTML = `
    <span style="font-size: 0.8rem; color: var(--text-muted);">Page ${escapeHtml(String(page))} of ${escapeHtml(String(totalPages))} (${escapeHtml(String(total))} masterclasses)</span>
    <div style="display: flex; gap: 0.5rem;">
      <button class="btn-action" ${page <= 1 ? 'disabled style="opacity: 0.5;"' : ''} onclick="loadVideos(${page - 1})">Previous</button>
      <button class="btn-action" ${page >= totalPages ? 'disabled style="opacity: 0.5;"' : ''} onclick="loadVideos(${page + 1})">Next</button>
    </div>
  `;
}

function openAddVideoModal() {
  document.getElementById('addVideoSkill').value = '';
  document.getElementById('addVideoUrl').value = '';
  document.getElementById('addVideoTitle').value = '';
  document.getElementById('addVideoChannel').value = '';
  document.getElementById('addVideoDuration').value = 'medium';
  document.getElementById('addVideoLanguage').value = 'English';
  document.getElementById('addVideoInstructor').value = '';
  openModal('addVideoModal');
}

async function submitAddVideo() {
  const skillName = document.getElementById('addVideoSkill').value.trim();
  const youtubeUrl = document.getElementById('addVideoUrl').value.trim();
  const title = document.getElementById('addVideoTitle').value.trim();
  const channelTitle = document.getElementById('addVideoChannel').value.trim();
  const durationCategory = document.getElementById('addVideoDuration').value;
  const language = document.getElementById('addVideoLanguage').value;
  const instructor = document.getElementById('addVideoInstructor').value.trim();

  if (!skillName || !youtubeUrl || !title || !channelTitle) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  try {
    const res = await adminFetch('/api/admin/content/videos', {
      method: 'POST',
      body: JSON.stringify({
        skillName,
        youtubeUrl,
        title,
        channelTitle,
        durationCategory,
        language,
        instructor: instructor || channelTitle
      })
    });

    if (res.success) {
      showToast(res.message || 'Masterclass added successfully', 'success');
      closeModal('addVideoModal');
      loadVideos(contentCurrentPage);
    }
  } catch (err) {
    showToast(err.message || 'Failed to add video', 'error');
  }
}

async function toggleVideoActive(skillName, videoId, currentlyActive) {
  try {
    const res = await adminFetch(`/api/admin/content/videos/${encodeURIComponent(skillName)}/${encodeURIComponent(videoId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !currentlyActive })
    });

    if (res.success) {
      showToast(res.message || 'Status updated', 'success');
      loadVideos(contentCurrentPage);
    }
  } catch (err) {
    showToast(err.message || 'Failed to toggle status', 'error');
  }
}

function openDeleteVideoModal(skillName, videoId, title) {
  document.getElementById('deleteVideoSkillName').value = skillName;
  document.getElementById('deleteVideoId').value = videoId;
  document.getElementById('deleteVideoTitleDisplay').textContent = title;
  openModal('deleteVideoModal');
}

async function submitDeleteVideo() {
  const skillName = document.getElementById('deleteVideoSkillName').value;
  const videoId = document.getElementById('deleteVideoId').value;
  const isPermanent = document.getElementById('deleteVideoPermanentCheckbox')?.checked || false;

  try {
    const url = `/api/admin/content/videos/${encodeURIComponent(skillName)}/${encodeURIComponent(videoId)}${isPermanent ? '?permanent=true' : ''}`;
    const res = await adminFetch(url, {
      method: 'DELETE'
    });

    if (res.success) {
      showToast(res.message || 'Video removed', 'success');
      closeModal('deleteVideoModal');
      loadVideos(contentCurrentPage);
    }
  } catch (err) {
    showToast(err.message || 'Failed to delete video', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('videoSearchInput');
  if (search) {
    search.addEventListener('input', () => {
      clearTimeout(contentSearchTimeout);
      contentSearchTimeout = setTimeout(() => loadVideos(1), 350);
    });
  }

  const status = document.getElementById('videoStatusFilter');
  if (status) {
    status.addEventListener('change', () => loadVideos(1));
  }

  const skill = document.getElementById('videoSkillFilter');
  if (skill) {
    skill.addEventListener('input', () => {
      clearTimeout(contentSearchTimeout);
      contentSearchTimeout = setTimeout(() => loadVideos(1), 350);
    });
  }
});
