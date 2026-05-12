package djnd.project.SoundCloud.configs;

import djnd.project.SoundCloud.utils.SecurityUtils;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import djnd.project.SoundCloud.domain.realtime.RoomPresenceEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Collections;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j

public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final SecurityUtils securityUtils;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic")
                .setHeartbeatValue(new long[] { 10000, 10000 }) // 10s heartbeat
                .setTaskScheduler(taskScheduler());
        config.setApplicationDestinationPrefixes("/app");
    }

    @Bean(name = "taskScheduler")
    public TaskScheduler taskScheduler() {
        return new ThreadPoolTaskScheduler();
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                String destination = accessor.getDestination();
                if (destination != null && destination.contains("/NaN")) {
                    log.warn("Detected NaN in destination: {}. Dropping message.", destination);
                    return null;
                }

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authToken = accessor.getFirstNativeHeader("Authorization");
                    if (authToken != null && authToken.startsWith("Bearer ")) {
                        String token = authToken.substring(7);
                        try {
                            Claims claims = securityUtils.parseRefreshToken(token); // Reusing for access token parsing
                            String email = claims.getSubject();
                            @SuppressWarnings("unchecked")
                            Map<String, Object> userClaim = claims.get("user", Map.class);
                            Long userId = Long.valueOf(userClaim.get("id").toString());

                            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                    email, null, Collections.emptyList());
                            // Store userId in session attributes for easy access
                            accessor.getSessionAttributes().put("userId", userId);
                            accessor.setUser(auth);
                        } catch (Exception e) {
                            log.error("WebSocket auth failed: {}", e.getMessage());
                            return null; // Deny connection
                        }
                    } else {
                        return null; // No token, deny
                    }
                }

                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    // String destination = accessor.getDestination();
                    if (destination != null && destination.startsWith("/topic/room/")) {
                        try {
                            String roomIdStr = destination.substring("/topic/room/".length());
                            if ("NaN".equals(roomIdStr)) {
                                log.warn("Detected NaN roomId subscription attempt. Ignoring.");
                                return null;
                            }
                            Long roomId = Long.valueOf(roomIdStr);
                            accessor.getSessionAttributes().put("roomId", roomId);

                            // Trigger join logic
                            Long userId = (Long) accessor.getSessionAttributes().get("userId");
                            eventPublisher.publishEvent(
                                    new RoomPresenceEvent(this, roomId, userId, RoomPresenceEvent.Type.JOIN));
                        } catch (Exception e) {
                            log.error("Failed to parse roomId from destination: {}", destination);
                        }
                    }
                }
                return message;
            }
        });
    }
}
