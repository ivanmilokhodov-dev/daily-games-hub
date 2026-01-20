package com.dailygames.hub.service;

import com.dailygames.hub.dto.RegisterRequest;
import com.dailygames.hub.model.User;
import com.dailygames.hub.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private RegisterRequest registerRequest;
    private User user;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setDisplayName("Test User");

        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("encodedPassword");
        user.setDisplayName("Test User");
    }

    @Test
    @DisplayName("Should register user successfully")
    void registerUser_Success() {
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        User result = userService.registerUser(registerRequest);

        assertThat(result).isNotNull();
        assertThat(result.getUsername()).isEqualTo("testuser");
        assertThat(result.getEmail()).isEqualTo("test@example.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when username already exists")
    void registerUser_UsernameExists() {
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        assertThatThrownBy(() -> userService.registerUser(registerRequest))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Username already exists");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when email already exists")
    void registerUser_EmailExists() {
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.registerUser(registerRequest))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Email already exists");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should find user by username")
    void findByUsername_Success() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        User result = userService.findByUsername("testuser");

        assertThat(result).isNotNull();
        assertThat(result.getUsername()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void findByUsername_NotFound() {
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findByUsername("nonexistent"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("User not found");
    }

    @Test
    @DisplayName("Should update user profile")
    void updateProfile_Success() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(user);

        User result = userService.updateProfile(user, "New Name", "new@example.com");

        assertThat(result).isNotNull();
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("Should change password successfully")
    void changePassword_Success() {
        when(passwordEncoder.matches("oldPassword", user.getPassword())).thenReturn(true);
        when(passwordEncoder.encode("newPassword")).thenReturn("newEncodedPassword");

        userService.changePassword(user, "oldPassword", "newPassword");

        verify(userRepository).save(user);
        verify(passwordEncoder).encode("newPassword");
    }

    @Test
    @DisplayName("Should throw exception when current password is incorrect")
    void changePassword_WrongPassword() {
        when(passwordEncoder.matches("wrongPassword", user.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword(user, "wrongPassword", "newPassword"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Incorrect current password");

        verify(userRepository, never()).save(any(User.class));
    }
}
