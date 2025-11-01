const nodemailer = require('nodemailer');
const logger = require('../logger');

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        logger.error('Email transporter configuration error:', error);
    } else {
        logger.info('Email server is ready to send messages');
    }
});

/**
 * Send booking confirmation email
 * @param {Object} bookingData - Booking details
 * @param {string} userEmail - User's email address
 */
const sendBookingConfirmation = async (bookingData, userEmail) => {
    try {
        const { bookingId, date, timeSlot, seatNumber, customerName } = bookingData;
        
        // Format the date for display
        const bookingDate = new Date(date).toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking Confirmation - ${bookingId}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
                        .header { background-color: #ffffff; color: #333; padding: 20px; text-align: center; border-bottom: 2px solid #f0f0f0; }
                        .logo-text { font-size: 48px; font-weight: bold; color: #333; margin: 0; letter-spacing: 3px; }
                        .content { padding: 20px; background-color: #ffffff; }
                        .booking-details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #e0e0e0; }
                        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
                        .label { font-weight: bold; color: #555; }
                        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
                        .confirmation-title { color: #4CAF50; font-size: 24px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 class="logo-text">TERRAIN</h1>
                        </div>
                        <div class="content">
                            <h2 class="confirmation-title">Booking Confirmed!</h2>
                            <p>Dear ${customerName},</p>
                            <p>Your booking has been successfully confirmed. Here are your booking details:</p>
                            
                            <div class="booking-details">
                                <div class="detail-row">
                                    <span class="label">Booking ID:</span>
                                    <span>${bookingId}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Date:</span>
                                    <span>${bookingDate}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Time Slot:</span>
                                    <span>${timeSlot}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Seat Number:</span>
                                    <span>${seatNumber}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Customer Name:</span>
                                    <span>${customerName}</span>
                                </div>
                            </div>

                            <p><strong>Important:</strong> Please pay at the counter when you arrive.</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        logger.info(`Booking confirmation email sent successfully to ${userEmail}`, { messageId: result.messageId });
        return { success: true, messageId: result.messageId };
        
    } catch (error) {
        logger.error('Error sending booking confirmation email:', error);
        throw new Error(`Failed to send confirmation email: ${error.message}`);
    }
};

/**
 * Send booking cancellation email
 * @param {Object} bookingData - Booking details
 * @param {string} userEmail - User's email address
 * @param {string} cancellationReason - Reason for cancellation
 */
const sendBookingCancellation = async (bookingData, userEmail, cancellationReason) => {
    try {
        const { bookingId, date, timeSlot, seatNumber, customerName } = bookingData;
        
        const bookingDate = new Date(date).toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const mailOptions = {
            from: process.env.EMAIL_USER || 'email@gmail.com',
            to: userEmail,
            subject: `Booking Cancellation - ${bookingId}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
                        .header { background-color: #ffffff; color: #333; padding: 20px; text-align: center; border-bottom: 2px solid #f0f0f0; }
                        .logo-text { font-size: 48px; font-weight: bold; color: #333; margin: 0; letter-spacing: 3px; }
                        .content { padding: 20px; background-color: #ffffff; }
                        .booking-details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #e0e0e0; }
                        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
                        .label { font-weight: bold; color: #555; }
                        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
                        .cancellation-title { color: #f44336; font-size: 24px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 class="logo-text">TERRAIN</h1>
                        </div>
                        <div class="content">
                            <h2 class="cancellation-title">Booking Cancelled</h2>
                            <p>Dear ${customerName},</p>
                            <p>Your booking has been cancelled. Here are the details:</p>
                            
                            <div class="booking-details">
                                <div class="detail-row">
                                    <span class="label">Booking ID:</span>
                                    <span>${bookingId}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Date:</span>
                                    <span>${bookingDate}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Time Slot:</span>
                                    <span>${timeSlot}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Seat Number:</span>
                                    <span>${seatNumber}</span>
                                </div>
                                ${cancellationReason ? `
                                <div class="detail-row">
                                    <span class="label">Cancellation Reason:</span>
                                    <span>${cancellationReason}</span>
                                </div>
                                ` : 'unspecified reason'}
                            </div>
                            
                            <p>We're sorry to see you cancel your booking. If you have any questions or need assistance, please don't hesitate to contact us.</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        logger.info(`Booking cancellation email sent successfully to ${userEmail}`, { messageId: result.messageId });
        return { success: true, messageId: result.messageId };
        
    } catch (error) {
        logger.error('Error sending booking cancellation email:', error);
        throw new Error(`Failed to send cancellation email: ${error.message}`);
    }
};

module.exports = {
    transporter,
    sendBookingConfirmation,
    sendBookingCancellation
};