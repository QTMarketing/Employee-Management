export const API_BASE = '/api';

export function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString();
}

export function getExpiryDiffDays(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

export function getComplianceStatus(expiryDateStr) {
    const diffDays = getExpiryDiffDays(expiryDateStr);

    // Categorize exactly based on the days difference between today and expiry
    if (diffDays < 0) {
        return { label: 'Expired', colorClass: 'badge-danger' }; // Red
    } else if (diffDays <= 7) {
        return { label: 'Expiring (< 7 Days)', colorClass: 'badge-danger' }; // Red for urgent
    } else if (diffDays <= 30) {
        return { label: 'Expiring (< 30 Days)', colorClass: 'badge-warning' }; // Orange
    } else if (diffDays <= 60) {
        return { label: 'Expiring (< 60 Days)', colorClass: 'badge-warning' }; // Orange
    } else {
        return { label: 'Valid', colorClass: 'badge-active' }; // Green
    }
}
