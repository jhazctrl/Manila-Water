// Function to send advisory notifications to affected users
async function sendAdvisoryNotifications(notificationData, affectedUsers) {
    console.log('sendAdvisoryNotifications called with:', { notificationData, affectedUsers });

    try {
        const MAX_RETRIES = 1; // Reduced from 2 to 1 to save quota
        const RETRY_DELAY = 2000; // Increased to 2 seconds to reduce rate limiting issues
        const BATCH_SIZE = 10; // Process emails in smaller batches
        const BATCH_DELAY = 5000; // 5 second delay between batches

        // Validate inputs
        if (!notificationData || !Array.isArray(affectedUsers)) {
            console.error('Invalid input parameters:', { notificationData, affectedUsers });
            throw new Error('Invalid input parameters');
        }

        // Validate required notification data fields
        const requiredFields = ['advisory_type', 'description', 'location', 'start_date', 'end_date'];
        const missingFields = requiredFields.filter(field => !notificationData[field]);
        if (missingFields.length > 0) {
            throw new Error(`Missing required notification fields: ${missingFields.join(', ')}`);
        }

        // Split users into batches
        const batches = [];
        for (let i = 0; i < affectedUsers.length; i += BATCH_SIZE) {
            batches.push(affectedUsers.slice(i, i + BATCH_SIZE));
        }

        let allResults = [];

        // Process each batch
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            console.log(`Processing batch ${batchIndex + 1}/${batches.length}`);

            const notifications = batch.map(async user => {
                const userEmail = user.email || user.guest_email;
                if (!userEmail) {
                    console.error('User object missing email:', user);
                    return { success: false, email: null, error: 'Missing email address' };
                }

                // Validate email format
                const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
                if (!emailRegex.test(userEmail)) {
                    console.error('Invalid email format:', userEmail);
                    return { success: false, email: userEmail, error: 'Invalid email format' };
                }

                const templateParams = {
                    user_email: userEmail,
                    to_name: userEmail.split('@')[0],
                    advisory_type: notificationData.advisory_type,
                    location: notificationData.location,
                    start_date: notificationData.start_date,
                    end_date: notificationData.end_date,
                    description: notificationData.description
                };

                // Single retry attempt with longer delay
                for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                    try {
                        if (attempt > 0) {
                            console.log(`Retrying email to ${userEmail} after failure`);
                            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                        }

                        if (!emailjs) {
                            throw new Error('EmailJS not initialized');
                        }

                        const response = await emailjs.send('service_db0tu54', 'template_a9wc5wq', templateParams);
                        console.log(`Email sent successfully to ${userEmail}`);
                        return { success: true, email: userEmail, response };
                    } catch (error) {
                        console.error(`Failed to send email to ${userEmail}:`, error);

                        // Check for quota exceeded
                        if (error.text && error.text.toLowerCase().includes('quota exceeded')) {
                            console.error('Email quota exceeded. Stopping all sends.');
                            return {
                                success: false,
                                email: userEmail,
                                error: 'Quota exceeded',
                                critical: true,
                                details: error
                            };
                        }

                        if (attempt === MAX_RETRIES) {
                            return {
                                success: false,
                                email: userEmail,
                                error: error.text || error.message || 'Unknown error',
                                details: {
                                    status: error.status,
                                    text: error.text,
                                    message: error.message,
                                    stack: error.stack
                                }
                            };
                        }
                    }
                }
            });

            try {
                const batchResults = await Promise.all(notifications);

                // Check if we hit quota limit
                const quotaExceeded = batchResults.some(result => result.critical);
                if (quotaExceeded) {
                    console.error('Quota exceeded during batch processing. Stopping remaining batches.');
                    allResults = [...allResults, ...batchResults];
                    break;
                }

                allResults = [...allResults, ...batchResults];

                // Add delay between batches if not the last batch
                if (batchIndex < batches.length - 1) {
                    console.log(`Waiting ${BATCH_DELAY}ms before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
                }
            } catch (batchError) {
                console.error('Error processing batch:', batchError);
                throw batchError;
            }
        }

        const successful = allResults.filter(r => r.success);
        const failed = allResults.filter(r => !r.success);

        console.log('Final results:', {
            total: allResults.length,
            successful: successful.length,
            failed: failed.length,
            failedDetails: failed
        });

        if (failed.length > 0) {
            const quotaError = failed.find(f => f.error === 'Quota exceeded');
            if (quotaError) {
                return {
                    success: false,
                    message: 'Email quota exceeded. Please upgrade your plan or wait for quota reset.',
                    failedEmails: failed,
                    quotaExceeded: true,
                    details: quotaError.details
                };
            }

            return {
                success: false,
                message: `${successful.length} sent, ${failed.length} failed`,
                failedEmails: failed,
                details: failed.map(f => ({ email: f.email, error: f.error, details: f.details }))
            };
        }

        return {
            success: true,
            message: `Successfully sent ${successful.length} notifications`
        };
    } catch (error) {
        console.error('Fatal error in sendAdvisoryNotifications:', error);
        return {
            success: false,
            message: 'Fatal error sending notifications',
            error: error.message || 'Unknown error',
            stack: error.stack,
            details: error
        };
    }
} 