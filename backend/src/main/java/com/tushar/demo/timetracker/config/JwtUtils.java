package com.tushar.demo.timetracker.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import com.tushar.demo.timetracker.model.Users;
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

    /**
     * Login token that also says which user row it belongs to.
     *
     * Agentic partitions every piece of stored knowledge by the identity it
     * reads out of the token, preferring the "uid" claim and falling back to
     * the subject. The subject here is an email address, so a login token and
     * a bridge token for the same person resolved to two different namespaces
     * — one holding all the data, one empty. Anything AlterEgo sent across
     * with a plain login token therefore read back as "no data yet".
     *
     * Carrying the id makes both tokens agree.
     */
    public String generateToken(Users user, long tokenVersion) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(TOKEN_VERSION_CLAIM, tokenVersion);
        if (user.getId() != null) {
            claims.put("uid", user.getId().toString());
        }
        claims.put("email", user.getEmail());

        return buildToken(claims, user.getEmail());
    }

    public String generateToken(String username, long tokenVersion) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(TOKEN_VERSION_CLAIM, tokenVersion);
        return buildToken(claims, username);
    }

    private String buildToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                   .setClaims(claims)
                   .setSubject(subject)
                   .setIssuedAt(new Date())
                   .setExpiration(new Date(System.currentTimeMillis() + expiration * 1000L))
                   .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                   .compact();
    }

    public String generateAgenticBridgeToken(Users user, long ttlSeconds) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("scope", "agentic_bridge");
        claims.put("uid", user.getId() != null ? user.getId().toString() : user.getEmail());
        claims.put("email", user.getEmail());
        claims.put("name", user.getName());
        claims.put("source", "alterego");

        long safeTtlSeconds = Math.max(30L, ttlSeconds);
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + safeTtlSeconds * 1000L))
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