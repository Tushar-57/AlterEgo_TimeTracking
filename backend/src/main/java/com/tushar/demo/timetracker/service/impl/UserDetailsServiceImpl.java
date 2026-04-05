package com.tushar.demo.timetracker.service.impl;

import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.Collections;


@Service
public class UserDetailsServiceImpl implements UserDetailsService {

	private static final Logger logger = LoggerFactory.getLogger(UserDetailsServiceImpl.class);
	  
    @Autowired
    UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) {
    	logger.debug("Attempting to load user by email: {}", email);
        
    	Users user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> {
                    logger.warn("User not found with email: {}", email);
                    return new UsernameNotFoundException("Invalid credentials");
                });

            return User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .disabled(!user.isEnabled())
                .accountExpired(false)
                .credentialsExpired(false)
                .accountLocked(false)
                .authorities(Collections.emptyList())
                .build();
        }

    public Users getCurrentUser(Authentication authentication) {
        if (authentication == null
                || authentication.getName() == null
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            throw new UsernameNotFoundException("User not authenticated");
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}