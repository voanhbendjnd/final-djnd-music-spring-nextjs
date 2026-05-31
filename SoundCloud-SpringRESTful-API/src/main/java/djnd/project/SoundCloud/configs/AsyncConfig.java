package djnd.project.SoundCloud.configs;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import java.util.concurrent.Executor;

@Configuration
@EnableAsync // Bật tính năng Async cho toàn bộ dự án
public class AsyncConfig {

    @Bean(name = "wsNotificationExecutor")
    public Executor wsNotificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10); // Số lượng thread luôn luôn bật sẵn
        executor.setMaxPoolSize(50);  // Số lượng thread tối đa khi hệ thống quá tải
        executor.setQueueCapacity(10000); // Kích thước hàng đợi chứa các task chờ xử lý
        executor.setThreadNamePrefix("WS-Notify-"); // Đặt tên thread để dễ debug/đọc log
        executor.initialize();
        return executor;
    }
}