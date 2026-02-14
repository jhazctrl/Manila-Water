/**
 * Application Constants
 * Enums and static values used throughout the application
 */
module.exports = {
    // User Roles — matches existing MongoDB Roles collection
    ROLES: {
        ACCOUNT_HOLDER: 1,
        BARANGAY_ADMIN: 2,
        CENTRAL_ADMIN: 3,
    },

    ROLE_NAMES: {
        1: 'Account Holder',
        2: 'Barangay Admin',
        3: 'Central Admin',
    },

    // Complaint Statuses
    COMPLAINT_STATUS: {
        PENDING: 'Pending',
        VERIFIED: 'Verified',
        RESOLVED: 'Resolved',
        REJECTED: 'Rejected',
        UNRESOLVED: 'Unresolved',
    },

    // Advisory Statuses
    ADVISORY_STATUS: {
        UPCOMING: 'upcoming',
        ONGOING: 'ongoing',
        RESOLVED: 'Resolved',
    },

    // Complaint ID prefix
    COMPLAINT_ID_PREFIX: 'MWC',

    // Pagination defaults
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100,
    },
};
