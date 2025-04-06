package com.tushar.demo.timetracker.service;

import com.tushar.demo.timetracker.exception.TokenExpiredException;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.ArrayList;

import javax.security.auth.login.CredentialExpiredException;


@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) {
        Users user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        if (user.isTokenInvalidated()) {  // Now valid after adding the method
            throw new TokenExpiredException("Session expired");
        }

        return org.springframework.security.core.userdetails.User
            .withUsername(email)
            .password(user.getPassword())
            .authorities(new ArrayList<>())
            .build();
    }

    public Users getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}