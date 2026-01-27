package com.dailygames.hub.service;

import com.dailygames.hub.model.PasswordResetToken;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.PasswordResetTokenRepository;
import com.dailygames.hub.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("encodedPassword");

        ReflectionTestUtils.setField(passwordResetService, "frontendUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(passwordResetService, "fromEmail", "noreply@scorle.app");
    }

    @Test
    @DisplayName("Should create password reset token and send email")
    void createPasswordResetToken_Success() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        passwordResetService.createPasswordResetToken("test@example.com");

        verify(tokenRepository).deleteByUser(testUser);
        verify(tokenRepository).save(any(PasswordResetToken.class));
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void createPasswordResetToken_UserNotFound() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.createPasswordResetToken("unknown@example.com"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("No user found with this email");

        verify(tokenRepository, never()).save(any());
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Should throw runtime exception when email sending fails")
    void createPasswordResetToken_EmailFails() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        doThrow(new MailSendException("SMTP error")).when(mailSender).send(any(SimpleMailMessage.class));

        assertThatThrownBy(() -> passwordResetService.createPasswordResetToken("test@example.com"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Failed to send password reset email");
    }

    @Test
    @DisplayName("Should send email with correct reset link")
    void createPasswordResetToken_CorrectEmailContent() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        passwordResetService.createPasswordResetToken("test@example.com");

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage sentMessage = messageCaptor.getValue();
        assertThat(sentMessage.getTo()).contains("test@example.com");
        assertThat(sentMessage.getSubject()).isEqualTo("Scordle - Password Reset Request");
        assertThat(sentMessage.getText()).contains("http://localhost:5173/reset-password?token=");
    }

    @Test
    @DisplayName("Should reset password successfully")
    void resetPassword_Success() {
        PasswordResetToken token = new PasswordResetToken(testUser);
        when(tokenRepository.findByToken(token.getToken())).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("newPassword")).thenReturn("encodedNewPassword");

        passwordResetService.resetPassword(token.getToken(), "newPassword");

        verify(userRepository).save(testUser);
        verify(tokenRepository).save(token);
        assertThat(testUser.getPassword()).isEqualTo("encodedNewPassword");
        assertThat(token.isUsed()).isTrue();
    }

    @Test
    @DisplayName("Should throw exception for invalid token")
    void resetPassword_InvalidToken() {
        when(tokenRepository.findByToken("invalid-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.resetPassword("invalid-token", "newPassword"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invalid or expired reset token");
    }

    @Test
    @DisplayName("Should throw exception for expired token")
    void resetPassword_ExpiredToken() {
        PasswordResetToken token = mock(PasswordResetToken.class);
        when(token.isExpired()).thenReturn(true);
        when(tokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.resetPassword("expired-token", "newPassword"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Reset token has expired");
    }

    @Test
    @DisplayName("Should throw exception for already used token")
    void resetPassword_UsedToken() {
        PasswordResetToken token = mock(PasswordResetToken.class);
        when(token.isExpired()).thenReturn(false);
        when(token.isUsed()).thenReturn(true);
        when(tokenRepository.findByToken("used-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.resetPassword("used-token", "newPassword"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Reset token has already been used");
    }

    @Test
    @DisplayName("Should return true for valid token")
    void isValidToken_Valid() {
        PasswordResetToken token = new PasswordResetToken(testUser);
        when(tokenRepository.findByToken(token.getToken())).thenReturn(Optional.of(token));

        boolean result = passwordResetService.isValidToken(token.getToken());

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should return false for expired token")
    void isValidToken_Expired() {
        PasswordResetToken token = mock(PasswordResetToken.class);
        when(token.isExpired()).thenReturn(true);
        when(tokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        boolean result = passwordResetService.isValidToken("expired-token");

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should return false for used token")
    void isValidToken_Used() {
        PasswordResetToken token = mock(PasswordResetToken.class);
        when(token.isExpired()).thenReturn(false);
        when(token.isUsed()).thenReturn(true);
        when(tokenRepository.findByToken("used-token")).thenReturn(Optional.of(token));

        boolean result = passwordResetService.isValidToken("used-token");

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should return false for non-existent token")
    void isValidToken_NotFound() {
        when(tokenRepository.findByToken("nonexistent-token")).thenReturn(Optional.empty());

        boolean result = passwordResetService.isValidToken("nonexistent-token");

        assertThat(result).isFalse();
    }
}
