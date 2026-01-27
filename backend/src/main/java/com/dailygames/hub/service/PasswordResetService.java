package com.dailygames.hub.service;

import com.dailygames.hub.model.PasswordResetToken;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.PasswordResetTokenRepository;
import com.dailygames.hub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Transactional
    public void createPasswordResetToken(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("No user found with this email"));

        // Delete any existing tokens for this user
        tokenRepository.deleteByUser(user);

        // Create new token
        PasswordResetToken resetToken = new PasswordResetToken(user);
        tokenRepository.save(resetToken);

        // Send email
        sendResetEmail(user.getEmail(), resetToken.getToken());
    }

    private void sendResetEmail(String toEmail, String token) {
        String resetUrl = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Scordle - Password Reset Request");
        message.setText(
            "Hello,\n\n" +
            "You have requested to reset your password for your Scordle account.\n\n" +
            "Click the following link to reset your password:\n" +
            resetUrl + "\n\n" +
            "This link will expire in 1 hour.\n\n" +
            "If you did not request a password reset, please ignore this email.\n\n" +
            "Best regards,\n" +
            "The Scordle Team"
        );

        try {
            mailSender.send(message);
            log.info("Password reset email sent successfully to: {}", toEmail);
        } catch (MailException e) {
            log.error("Failed to send password reset email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send password reset email. Please try again later.");
        }
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("Reset token has expired");
        }

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("Reset token has already been used");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
    }

    public boolean isValidToken(String token) {
        return tokenRepository.findByToken(token)
            .map(t -> !t.isExpired() && !t.isUsed())
            .orElse(false);
    }
}
