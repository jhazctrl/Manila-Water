/**
 * Client-side Validators
 */

export const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isStrongPassword = (password) => {
    if (!password || password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasUpper && hasLower && hasNumber && hasSpecial;
};

export const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: 'None', color: '#ccc' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    const levels = [
        { label: 'Very Weak', color: '#ff4444' },
        { label: 'Weak', color: '#ff8800' },
        { label: 'Fair', color: '#ffcc00' },
        { label: 'Good', color: '#88cc00' },
        { label: 'Strong', color: '#44bb44' },
        { label: 'Very Strong', color: '#00aa44' },
    ];

    const idx = Math.min(score, 5);
    return { score: idx, label: levels[idx].label, color: levels[idx].color };
};

export const isValidPhone = (phone) => {
    if (!phone) return true;
    return /^(\+?63|0)?9\d{9}$/.test(String(phone).replace(/\s+/g, ''));
};

export const isValidName = (name) => {
    return /^[a-zA-ZÀ-ÿ\s.\-']{1,100}$/.test(name?.trim() || '');
};

export const passwordsMatch = (password, confirmPassword) => {
    return password === confirmPassword;
};
