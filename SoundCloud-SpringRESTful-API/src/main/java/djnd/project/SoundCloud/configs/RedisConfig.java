package djnd.project.SoundCloud.configs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;

import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import djnd.project.SoundCloud.services.realtime.RoomStateManager;
import org.springframework.context.annotation.Lazy;

@Configuration
@SuppressWarnings("unused")
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        ObjectMapper mapper = new ObjectMapper();
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY);

        Jackson2JsonRedisSerializer<Object> serializer = new Jackson2JsonRedisSerializer<>(mapper, Object.class);

        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(serializer);
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(serializer);

        template.setDefaultSerializer(serializer);

        return template;
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {

        ObjectMapper mapper = new ObjectMapper();
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY);

        Jackson2JsonRedisSerializer<Object> serializer = new Jackson2JsonRedisSerializer<>(mapper, Object.class);

        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(serializer))
                .entryTtl(Duration.ofMinutes(10));

        return RedisCacheManager.builder(factory)
                .cacheDefaults(config)
                .build();
    }

    @Bean
    public MessageListenerAdapter roomEventAdapter(@Lazy RoomStateManager roomStateManager, ObjectMapper objectMapper) {
        Jackson2JsonRedisSerializer<Object> serializer = new Jackson2JsonRedisSerializer<>(objectMapper, Object.class);
        return new MessageListenerAdapter(new Object() {
            public void handleMessage(Object message) {
                if (message instanceof djnd.project.SoundCloud.domain.realtime.RoomEvent event) {
                    roomStateManager.handleRedisEvent(event);
                }
            }
        }, "handleMessage") {
            {
                setSerializer(serializer);
            }
        };
    }

    @Bean
    public RedisMessageListenerContainer redisContainer(RedisConnectionFactory factory,
            MessageListenerAdapter roomEventAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);
        container.addMessageListener(roomEventAdapter, new ChannelTopic("room_events"));
        return container;
    }
}
