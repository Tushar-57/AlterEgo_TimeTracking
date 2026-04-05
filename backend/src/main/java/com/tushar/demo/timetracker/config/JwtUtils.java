package com.tushar.demo.timetracker.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtils {

    private static final String TOKEN_VERSION_CLAIM = "tv";
    
	@Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private int expiration;

    @PostConstruct
    public void validateSecretConfiguration() {
        if (secret == null || secret.length() < 64) {
            throw new IllegalStateException("JWT secret must be at least 64 characters for HS512");
        }
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(userDetails, 0L);
    }

    public String generateToken(UserDetails userDetails, long tokenVersion) {
        return generateToken(userDetails.getUsername(), tokenVersion);
    }

    public String generateToken(String username) {
        return generateToken(username, 0L);
    }

    public String generateToken(String username, long tokenVersion) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(TOKEN_VERSION_CLAIM, tokenVersion);
        return Jwts.builder()
                   .setClaims(claims)
                   .setSubject(username)
                   .setIssuedAt(new Date())
                   .setExpiration(new Date(System.currentTimeMillis() + expiration * 1000L))
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
        return getClaimsFromToken(token).getSubject();
    }

    public long getTokenVersion(String token) {
        Object claimValue = getClaimsFromToken(token).get(TOKEN_VERSION_CLAIM);
        if (claimValue instanceof Number numberClaim) {
            return numberClaim.longValue();
        }

        if (claimValue instanceof String stringClaim) {
            try {
                return Long.parseLong(stringClaim);
            } catch (NumberFormatException ignored) {
                return 0L;
            }
        }

        return 0L;
    }

    public boolean isTokenVersionValid(String token, long expectedTokenVersion) {
        return getTokenVersion(token) == expectedTokenVersion;
    }

    private Claims getClaimsFromToken(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
}