package djnd.project.SoundCloud.configs;

import java.util.Collections;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.util.Base64;

import djnd.project.SoundCloud.utils.SecurityUtils;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true)
public class SecurityConfig {
    @Value("${djnd.jwt.base64-secret}")
    private String jwtKey;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            SmartAuthenticationEntryPoint sap,
            @Qualifier("corsConfigurationSource") CorsConfigurationSource corsConfig
    // PublicEndpointFilter publicEndpointFilter
    ) throws Exception {
        String[] whiteList = {
                "/",
                "/api/v1/**",
                "/storage/**"
        };
        http
                .cors(cors -> cors.configurationSource(corsConfig))
                .csrf(c -> c.disable())
                // .addFilterBefore(publicEndpointFilter,
                // org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter.class)
                .authorizeHttpRequests(
                        authz -> authz
                                .requestMatchers(whiteList).permitAll()
                                .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(publicEndpointJwtAuthenticationTokenConverter()))
                        .authenticationEntryPoint(sap))
                .formLogin(f -> f.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED));
        return http.build();
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(getSecretKey()));
    }

    private SecretKey getSecretKey() {
        byte[] keyBytes = Base64.from(jwtKey).decode();
        return new SecretKeySpec(keyBytes, 0, keyBytes.length,
                SecurityUtils.JWT_ALGORITHM.getName());
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withSecretKey(getSecretKey())
                .macAlgorithm(SecurityUtils.JWT_ALGORITHM).build();
        return token -> {
            try {
                // Nếu token là "undefined" hoặc rác, ném lỗi để
                // Spring Security biết đây không phải là một nỗ lực login hợp lệ
                return jwtDecoder.decode(token);
            } catch (Exception ex) {
                // Log lỗi để debug nhưng hệ thống sẽ hiểu là Unauthenticated
                System.out.println(">>> JWT Error: " + ex.getMessage());
                throw ex;
            }
        };
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter(CustomJwtAuthenticationConverter customConverter) {
        // Cấu hình CustomJwtAuthenticationConverter để validate session
        customConverter.setAuthorityPrefix(""); // Không có prefix cho authorities
        customConverter.setAuthoritiesClaimName("permission"); // Tên claim chứa permissions trong JWT

        // Tạo JWT Authentication Converter với custom converter
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(customConverter);

        return jwtAuthenticationConverter;
    }

    @Bean
    public JwtAuthenticationConverter publicEndpointJwtAuthenticationTokenConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            // For public endpoints, we can skip the JWT validation entirely
            // by returning empty authorities - the permitAll() will handle access
            return Collections.emptyList();
        });

        return converter;
    }

}
