package com.tushar.demo.timetracker.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.SecretKey;

@Component
public class JwtUtils {
    
	@Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private int expiration;
    
    public SecretKey getSecretKey() {
        return Keys.secretKeyFor(SignatureAlgorithm.HS512);
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
    
    public String generateToken() {
        // Use this to generate a secure key for HS512
        SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS512);
        
        // Now use this key for signing the JWT token
        String token = Jwts.builder()
            .setSubject("subject")
            .signWith(key)
            .compact();
        
        return token;
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration * 1000L))
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }
    public String generateToken(String username) {
        SecretKey key = getSecretKey();
        return Jwts.builder()
                   .setSubject(username)
                   .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                   .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
}