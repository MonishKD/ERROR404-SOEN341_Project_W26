// frontend/js/notifications.js

class NotificationManager {
  constructor() {
    this.container = this.createContainer();
  }

  createContainer() {
    // Create container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 350px;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      padding: 15px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    `;

    // Set colors based on type
    const colors = {
      success: { bg: '#d4edda', border: '#28a745', text: '#155724', icon: '✓' },
      error: { bg: '#f8d7da', border: '#dc3545', text: '#721c24', icon: '✗' },
      warning: { bg: '#fff3cd', border: '#ffc107', text: '#856404', icon: '⚠' },
      info: { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460', icon: 'ℹ' }
    };

    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.borderLeft = `4px solid ${color.border}`;
    notification.style.color = color.text;

    notification.innerHTML = `
      <span style="font-size: 18px; font-weight: bold;">${color.icon}</span>
      <span style="flex: 1;">${message}</span>
      <button class="notification-close" style="
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: ${color.text};
        opacity: 0.6;
      ">&times;</button>
    `;

    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.onclick = () => this.remove(notification);

    this.container.appendChild(notification);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(notification), duration);
    }

    return notification;
  }

  remove(notification) {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }

  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 4000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 3000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  // For confirm dialogs
  confirm(message, onConfirm, onCancel) {
    const modal = this.createConfirmModal(message, onConfirm, onCancel);
    document.body.appendChild(modal);
  }

  createConfirmModal(message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      animation: slideIn 0.2s ease;
    `;

    modal.innerHTML = `
      <h3 style="margin: 0 0 12px 0; font-size: 18px;">Confirm Action</h3>
      <p style="margin: 0 0 20px 0; color: #666;">${message}</p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="confirm-cancel" style="
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        ">Cancel</button>
        <button class="confirm-ok" style="
          padding: 8px 16px;
          border: none;
          background: #28a745;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        ">OK</button>
      </div>
    `;

    overlay.appendChild(modal);

    const cancelBtn = modal.querySelector('.confirm-cancel');
    const okBtn = modal.querySelector('.confirm-ok');

    // Add hover animations for cancel button
    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.transform = 'scale(1.05)';
      cancelBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      cancelBtn.style.borderColor = '#999';
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.transform = 'scale(1)';
      cancelBtn.style.boxShadow = 'none';
      cancelBtn.style.borderColor = '#ddd';
    });

    // Add hover animations for OK button
    okBtn.addEventListener('mouseenter', () => {
      okBtn.style.transform = 'scale(1.05)';
      okBtn.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
      okBtn.style.background = '#218838';
    });
    okBtn.addEventListener('mouseleave', () => {
      okBtn.style.transform = 'scale(1)';
      okBtn.style.boxShadow = 'none';
      okBtn.style.background = '#28a745';
    });

    cancelBtn.onclick = () => {
      overlay.remove();
      if (onCancel) onCancel();
    };

    okBtn.onclick = () => {
      overlay.remove();
      if (onConfirm) onConfirm();
    };

    return overlay;
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Create global instance
globalThis.notifications = new NotificationManager();

// Export for module usage
export { NotificationManager };