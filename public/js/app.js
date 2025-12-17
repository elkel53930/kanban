// Kanban App JavaScript
console.log('Kanban App loaded');

let cards = [];

// API functions
async function fetchCards() {
    try {
        const response = await fetch('/api/cards');
        if (!response.ok) {
            throw new Error('Failed to fetch cards');
        }
        cards = await response.json();
        renderCards();
    } catch (error) {
        console.error('Error fetching cards:', error);
        showError('カードの読み込みに失敗しました');
    }
}

async function createCard(cardData) {
    try {
        const response = await fetch('/api/cards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cardData),
        });
        
        if (!response.ok) {
            throw new Error('Failed to create card');
        }
        
        const newCard = await response.json();
        fetchCards(); // Refresh the display
        return newCard;
    } catch (error) {
        console.error('Error creating card:', error);
        showError('カードの作成に失敗しました');
    }
}

async function moveCard(cardId, newColumn) {
    try {
        const response = await fetch(`/api/cards/${cardId}/move`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ column: newColumn }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to move card');
        }
        
        fetchCards(); // Refresh the display
    } catch (error) {
        console.error('Error moving card:', error);
        showError('カードの移動に失敗しました');
    }
}

// Render cards
function renderCards() {
    // Clear all columns
    document.querySelectorAll('.cards').forEach(container => {
        container.innerHTML = '';
    });

    // Render each card
    cards.forEach(card => {
        const cardElement = createCardElement(card);
        const column = document.querySelector(`#${card.column_name} .cards`);
        if (column) {
            column.appendChild(cardElement);
        }
    });
}

// Create card element
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.draggable = true;
    cardDiv.dataset.cardId = card.id;

    let html = `<div class="card-title">${escapeHtml(card.title)}</div>`;
    
    if (card.tags && card.tags.length > 0) {
        html += '<div class="card-tags">';
        card.tags.forEach(tag => {
            html += `<span class="tag">${escapeHtml(tag)}</span>`;
        });
        html += '</div>';
    }
    
    if (card.due_date) {
        const dueDate = new Date(card.due_date);
        const today = new Date();
        const isOverdue = dueDate < today;
        const dueDateClass = isOverdue ? 'card-due overdue' : 'card-due';
        html += `<div class="${dueDateClass}">期限: ${card.due_date}</div>`;
    }

    cardDiv.innerHTML = html;
    
    // Add drag event listeners
    addDragEvents(cardDiv);
    
    // Add click event for card details
    cardDiv.addEventListener('click', () => {
        showCardDetails(card);
    });
    
    return cardDiv;
}

// Drag and Drop functionality
function addDragEvents(cardElement) {
    cardElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', cardElement.dataset.cardId);
        cardElement.classList.add('dragging');
    });

    cardElement.addEventListener('dragend', () => {
        cardElement.classList.remove('dragging');
    });
}

function setupDropZones() {
    const columns = document.querySelectorAll('.column');
    
    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', (e) => {
            // Only remove if we're actually leaving the column
            if (!column.contains(e.relatedTarget)) {
                column.classList.remove('drag-over');
            }
        });

        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            
            const cardId = e.dataTransfer.getData('text/plain');
            const newColumn = column.id;
            
            if (cardId && newColumn) {
                await moveCard(cardId, newColumn);
            }
        });
    });
}

// Current card being edited
let currentEditCard = null;

// Show card details modal
async function showCardDetails(card) {
    currentEditCard = card;
    
    // Populate form fields
    document.getElementById('edit-title').value = card.title || '';
    document.getElementById('edit-description').value = card.description || '';
    document.getElementById('edit-column').value = card.column_name || 'todo';
    document.getElementById('edit-due-date').value = card.due_date || '';
    document.getElementById('edit-tags').value = card.tags ? card.tags.join(', ') : '';
    
    // Display description as rendered markdown by default
    displayDescription(card.description || '');
    
    // Load and display comments
    await loadComments(card.id);
    
    // Show modal
    document.getElementById('card-details-modal').style.display = 'block';
}

// Display description in view mode
function displayDescription(description) {
    const renderedDiv = document.getElementById('description-rendered');
    if (description.trim()) {
        renderedDiv.innerHTML = renderMarkdown(description);
    } else {
        renderedDiv.innerHTML = '<p style="color: #666; font-style: italic;">説明文がありません</p>';
    }
    
    // Ensure we're in view mode
    document.getElementById('description-display').style.display = 'block';
    document.getElementById('description-edit').style.display = 'none';
    document.getElementById('edit-description-btn').style.display = 'inline';
    document.getElementById('cancel-description-btn').style.display = 'none';
    document.getElementById('save-description-btn').style.display = 'none';
}

// Load comments for a card
async function loadComments(cardId) {
    try {
        const response = await fetch(`/api/cards/${cardId}/comments`);
        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }
        
        const comments = await response.json();
        displayComments(comments);
    } catch (error) {
        console.error('Error loading comments:', error);
        document.getElementById('comments-list').innerHTML = '<p>コメントの読み込みに失敗しました</p>';
    }
}

// Markdown rendering utility
function renderMarkdown(text) {
    if (!text) return '';
    
    // Configure marked for security
    marked.setOptions({
        breaks: true,
        gfm: true,
        sanitize: false, // We'll handle sanitization ourselves
        smartLists: true,
        smartypants: true
    });
    
    // Basic XSS prevention - remove script tags and dangerous attributes
    let sanitized = text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '');
    
    return marked.parse(sanitized);
}

// Display comments
function displayComments(comments) {
    const commentsList = document.getElementById('comments-list');
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p style="color: #666; font-style: italic;">まだコメントはありません</p>';
        return;
    }
    
    const commentsHtml = comments.map(comment => `
        <div class="comment" data-comment-id="${comment.id}">
            <div class="comment-display" id="comment-display-${comment.id}">
                <div class="comment-content markdown-content">${renderMarkdown(comment.content)}</div>
            </div>
            <div class="comment-edit" id="comment-edit-${comment.id}" style="display: none;">
                <textarea class="comment-edit-textarea" id="comment-textarea-${comment.id}">${escapeHtml(comment.content)}</textarea>
                <div class="comment-edit-actions">
                    <button class="btn btn-sm btn-secondary" onclick="cancelEditComment(${comment.id})">キャンセル</button>
                    <button class="btn btn-sm btn-primary" onclick="saveEditComment(${comment.id})">保存</button>
                </div>
            </div>
            <div class="comment-meta">
                <span>${new Date(comment.created_at).toLocaleString('ja-JP')}</span>
                <div class="comment-actions">
                    <button onclick="editComment(${comment.id})">編集</button>
                    <button onclick="deleteComment(${comment.id})">削除</button>
                </div>
            </div>
        </div>
    `).join('');
    
    commentsList.innerHTML = commentsHtml;
}

// Add comment
async function addComment(cardId, content) {
    try {
        const response = await fetch(`/api/cards/${cardId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to add comment');
        }
        
        // Reload comments
        await loadComments(cardId);
        
        // Clear input
        document.getElementById('new-comment').value = '';
        
        showSuccess('コメントが追加されました');
    } catch (error) {
        console.error('Error adding comment:', error);
        showError('コメントの追加に失敗しました');
    }
}

// Edit comment
function editComment(commentId) {
    document.getElementById(`comment-display-${commentId}`).style.display = 'none';
    document.getElementById(`comment-edit-${commentId}`).style.display = 'block';
    
    // Focus on textarea
    const textarea = document.getElementById(`comment-textarea-${commentId}`);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

// Cancel edit comment
function cancelEditComment(commentId) {
    document.getElementById(`comment-display-${commentId}`).style.display = 'block';
    document.getElementById(`comment-edit-${commentId}`).style.display = 'none';
    
    // Reset textarea value
    const originalContent = document.querySelector(`[data-comment-id="${commentId}"] .comment-content`).textContent;
    document.getElementById(`comment-textarea-${commentId}`).value = originalContent;
}

// Save edit comment
async function saveEditComment(commentId) {
    const textarea = document.getElementById(`comment-textarea-${commentId}`);
    const newContent = textarea.value.trim();
    
    if (!newContent) {
        showError('コメントは空にできません');
        return;
    }
    
    try {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: newContent }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to update comment');
        }
        
        // Reload comments to show updated content
        await loadComments(currentEditCard.id);
        
        showSuccess('コメントが更新されました');
    } catch (error) {
        console.error('Error updating comment:', error);
        showError('コメントの更新に失敗しました');
    }
}

// Delete comment
async function deleteComment(commentId) {
    if (!confirm('このコメントを削除しますか？')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete comment');
        }
        
        // Reload comments
        await loadComments(currentEditCard.id);
        
        showSuccess('コメントが削除されました');
    } catch (error) {
        console.error('Error deleting comment:', error);
        showError('コメントの削除に失敗しました');
    }
}

// Update card
async function updateCard(cardId, cardData) {
    try {
        const response = await fetch(`/api/cards/${cardId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cardData),
        });
        
        if (!response.ok) {
            throw new Error('Failed to update card');
        }
        
        fetchCards(); // Refresh the display
        return await response.json();
    } catch (error) {
        console.error('Error updating card:', error);
        showError('カードの更新に失敗しました');
    }
}

// Delete card
async function deleteCard(cardId) {
    if (!confirm('このカードを削除しますか？この操作は取り消せません。')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/cards/${cardId}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete card');
        }
        
        fetchCards(); // Refresh the display
        closeDetailsModal();
        showSuccess('カードが削除されました');
    } catch (error) {
        console.error('Error deleting card:', error);
        showError('カードの削除に失敗しました');
    }
}

// Close card details modal
function closeDetailsModal() {
    document.getElementById('card-details-modal').style.display = 'none';
    currentEditCard = null;
    
    // Reset description edit state
    if (isDescriptionEditMode) {
        isDescriptionEditMode = false;
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Notification system
function showNotification(message, type = 'info', duration = 5000) {
    const notificationArea = document.getElementById('notification-area');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        ${message}
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    notificationArea.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

// Description editing functions
let isDescriptionEditMode = false;

function toggleDescriptionEdit() {
    if (isDescriptionEditMode) {
        cancelDescriptionEdit();
    } else {
        startDescriptionEdit();
    }
}

function startDescriptionEdit() {
    isDescriptionEditMode = true;
    
    document.getElementById('description-display').style.display = 'none';
    document.getElementById('description-edit').style.display = 'block';
    document.getElementById('edit-description-btn').style.display = 'none';
    document.getElementById('cancel-description-btn').style.display = 'inline';
    document.getElementById('save-description-btn').style.display = 'inline';
    
    // Focus on textarea
    const textarea = document.getElementById('edit-description');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

function cancelDescriptionEdit() {
    isDescriptionEditMode = false;
    
    // Reset to original content
    if (currentEditCard) {
        document.getElementById('edit-description').value = currentEditCard.description || '';
        displayDescription(currentEditCard.description || '');
    }
}

async function saveDescriptionEdit() {
    if (!currentEditCard) return;
    
    const newDescription = document.getElementById('edit-description').value;
    
    // Update the card with new description
    const cardData = {
        title: document.getElementById('edit-title').value,
        description: newDescription,
        column_name: document.getElementById('edit-column').value,
        due_date: document.getElementById('edit-due-date').value || null,
        tags: document.getElementById('edit-tags').value ? 
              document.getElementById('edit-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };
    
    try {
        const response = await fetch(`/api/cards/${currentEditCard.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cardData),
        });
        
        if (!response.ok) {
            throw new Error('Failed to update card');
        }
        
        // Update current card data
        currentEditCard.description = newDescription;
        
        // Update display
        displayDescription(newDescription);
        
        // Refresh the main board
        fetchCards();
        
        showSuccess('説明文が更新されました');
        
        isDescriptionEditMode = false;
    } catch (error) {
        console.error('Error updating description:', error);
        showError('説明文の更新に失敗しました');
    }
}

// Modal functions
function openModal() {
    document.getElementById('add-card-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('add-card-modal').style.display = 'none';
    document.getElementById('add-card-form').reset();
}

// History functions
async function fetchHistory(date = null) {
    try {
        document.getElementById('history-loading').style.display = 'block';
        
        let url = '/api/history';
        if (date) {
            url += `?date=${date}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }
        
        const historyCards = await response.json();
        displayHistory(historyCards);
    } catch (error) {
        console.error('Error fetching history:', error);
        showError('履歴の読み込みに失敗しました');
    } finally {
        document.getElementById('history-loading').style.display = 'none';
    }
}

function displayHistory(historyCards) {
    const historyList = document.getElementById('history-list');
    
    if (historyCards.length === 0) {
        historyList.innerHTML = '<div class="history-empty">完了したカードがありません</div>';
        return;
    }
    
    // Group cards by date
    const groupedCards = {};
    historyCards.forEach(card => {
        const date = card.completed_at ? card.completed_at.split('T')[0] : 'unknown';
        if (!groupedCards[date]) {
            groupedCards[date] = [];
        }
        groupedCards[date].push(card);
    });
    
    let html = '';
    Object.keys(groupedCards).sort().reverse().forEach(date => {
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        
        html += `<div class="history-date-group">
            <div class="history-date-header">${formattedDate}</div>`;
        
        groupedCards[date].forEach(card => {
            const completedTime = new Date(card.completed_at).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            html += `
                <div class="history-card" onclick="showHistoryCardDetails(${card.id})">
                    <div class="history-card-title">${escapeHtml(card.title)}</div>
                    <div class="history-card-meta">
                        <span>完了時刻: <span class="history-card-completed">${completedTime}</span></span>
                        ${card.due_date ? `<span>期限: ${card.due_date}</span>` : ''}
                    </div>
                    ${card.tags && card.tags.length > 0 ? `
                        <div class="history-card-tags">
                            ${card.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${card.description ? `
                        <div class="history-card-description">
                            ${renderMarkdown(card.description)}
                        </div>
                    ` : ''}
                </div>`;
        });
        
        html += '</div>';
    });
    
    historyList.innerHTML = html;
}

async function showHistoryCardDetails(cardId) {
    try {
        const response = await fetch(`/api/cards/${cardId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch card details');
        }
        
        const card = await response.json();
        showCardDetails(card);
        
        // Close history modal
        closeHistoryModal();
    } catch (error) {
        console.error('Error fetching card details:', error);
        showError('カードの詳細取得に失敗しました');
    }
}

function openHistoryModal() {
    document.getElementById('history-modal').style.display = 'block';
    fetchHistory();
}

function closeHistoryModal() {
    document.getElementById('history-modal').style.display = 'none';
    document.getElementById('history-date').value = '';
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    fetchCards();
    setupDropZones();
    
    // Add Card Modal event listeners
    document.getElementById('add-card-btn').addEventListener('click', openModal);
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    
    // History Modal event listeners
    document.getElementById('history-btn').addEventListener('click', openHistoryModal);
    document.getElementById('history-close').addEventListener('click', closeHistoryModal);
    document.getElementById('history-cancel-btn').addEventListener('click', closeHistoryModal);
    
    // History date filter
    document.getElementById('history-date').addEventListener('change', (e) => {
        fetchHistory(e.target.value);
    });
    
    document.getElementById('clear-date-btn').addEventListener('click', () => {
        document.getElementById('history-date').value = '';
        fetchHistory();
    });
    
    // Close history modal when clicking outside
    document.getElementById('history-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('history-modal')) {
            closeHistoryModal();
        }
    });
    
    // Card Details Modal event listeners
    document.getElementById('details-close').addEventListener('click', closeDetailsModal);
    document.getElementById('details-cancel-btn').addEventListener('click', closeDetailsModal);
    
    // Close modals when clicking outside
    document.getElementById('add-card-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('add-card-modal')) {
            closeModal();
        }
    });
    
    document.getElementById('card-details-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('card-details-modal')) {
            closeDetailsModal();
        }
    });
    
    // Save changes button
    document.getElementById('save-changes-btn').addEventListener('click', async () => {
        if (!currentEditCard) return;
        
        const cardData = {
            title: document.getElementById('edit-title').value,
            description: document.getElementById('edit-description').value,
            column_name: document.getElementById('edit-column').value,
            due_date: document.getElementById('edit-due-date').value || null,
            tags: document.getElementById('edit-tags').value ? 
                  document.getElementById('edit-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag) : []
        };
        
        const result = await updateCard(currentEditCard.id, cardData);
        if (result) {
            closeDetailsModal();
            showSuccess('カードが更新されました');
        }
    });
    
    // Delete card button
    document.getElementById('delete-card-btn').addEventListener('click', () => {
        if (currentEditCard) {
            deleteCard(currentEditCard.id);
        }
    });
    
    // Add comment button
    document.getElementById('add-comment-btn').addEventListener('click', async () => {
        const content = document.getElementById('new-comment').value.trim();
        if (content && currentEditCard) {
            await addComment(currentEditCard.id, content);
        }
    });
    
    // Export button
    document.getElementById('export-btn').addEventListener('click', async () => {
        try {
            const response = await fetch('/api/export');
            if (!response.ok) {
                throw new Error('Failed to export data');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kanban-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showSuccess('データをエクスポートしました');
        } catch (error) {
            console.error('Error exporting data:', error);
            showError('データのエクスポートに失敗しました');
        }
    });
    
    // Import button
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-modal').style.display = 'block';
    });
    
    // Import modal close
    document.getElementById('import-close').addEventListener('click', () => {
        closeImportModal();
    });
    document.getElementById('import-cancel-btn').addEventListener('click', () => {
        closeImportModal();
    });
    
    // Import file input
    document.getElementById('import-file').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await previewImportFile(file);
        }
    });
    
    // Import execute button
    document.getElementById('import-execute-btn').addEventListener('click', async () => {
        await executeImport();
    });
    
    // Today buttons
    document.getElementById('set-today-add').addEventListener('click', () => {
        setTodayDate('card-due-date');
    });
    
    document.getElementById('set-today-edit').addEventListener('click', () => {
        setTodayDate('edit-due-date');
    });
    
    // Form submission
    document.getElementById('add-card-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const cardData = {
            title: formData.get('title'),
            description: formData.get('description'),
            column_name: formData.get('column_name'),
            due_date: formData.get('due_date') || null,
            tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag) : []
        };
        
        const result = await createCard(cardData);
        if (result) {
            closeModal();
            showSuccess('カードが作成されました');
        }
    });
});

// Import/Export functions
let importData = null;

async function previewImportFile(file) {
    try {
        const text = await file.text();
        importData = JSON.parse(text);
        
        if (!importData || !importData.cards) {
            throw new Error('Invalid file format');
        }
        
        const preview = document.getElementById('import-preview');
        const info = document.getElementById('import-info');
        
        info.innerHTML = `
            <p><strong>ファイル名:</strong> ${file.name}</p>
            <p><strong>カード数:</strong> ${importData.cards.length}</p>
            <p><strong>エクスポート日時:</strong> ${importData.timestamp ? new Date(importData.timestamp).toLocaleString('ja-JP') : '不明'}</p>
            <p><strong>バージョン:</strong> ${importData.version || '不明'}</p>
        `;
        
        preview.style.display = 'block';
        document.getElementById('import-execute-btn').disabled = false;
        
    } catch (error) {
        console.error('Error reading file:', error);
        showError('ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。');
        
        const preview = document.getElementById('import-preview');
        preview.style.display = 'none';
        document.getElementById('import-execute-btn').disabled = true;
        importData = null;
    }
}

async function executeImport() {
    if (!importData) {
        showError('インポートするデータがありません');
        return;
    }
    
    const mode = document.getElementById('import-mode').value;
    const confirmMessage = mode === 'replace' 
        ? '既存のデータを全て削除して新しいデータで置き換えます。この操作は元に戻せません。続行しますか？'
        : `${importData.cards.length}件のカードをインポートします。既存のカードはそのまま保持されます。続行しますか？`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const response = await fetch('/api/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: importData,
                mode: mode
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to import data');
        }
        
        const result = await response.json();
        
        let message = `インポートが完了しました。\n`;
        message += `インポート済み: ${result.imported}件\n`;
        if (result.skipped > 0) {
            message += `スキップ: ${result.skipped}件\n`;
        }
        if (result.errors && result.errors.length > 0) {
            message += `エラー: ${result.errors.length}件\n`;
            message += result.errors.slice(0, 3).join('\n');
            if (result.errors.length > 3) {
                message += `\n...他${result.errors.length - 3}件`;
            }
        }
        
        alert(message);
        closeImportModal();
        fetchCards(); // Refresh the display
        
    } catch (error) {
        console.error('Error importing data:', error);
        showError('データのインポートに失敗しました');
    }
}

function closeImportModal() {
    document.getElementById('import-modal').style.display = 'none';
    document.getElementById('import-file').value = '';
    document.getElementById('import-preview').style.display = 'none';
    document.getElementById('import-execute-btn').disabled = true;
    importData = null;
}

// Today date functionality
function setTodayDate(inputId) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    const input = document.getElementById(inputId);
    if (input) {
        input.value = dateString;
    }
}

function showSuccess(message) {
    console.log('Success:', message);
    // TODO: Implement proper success notification
}