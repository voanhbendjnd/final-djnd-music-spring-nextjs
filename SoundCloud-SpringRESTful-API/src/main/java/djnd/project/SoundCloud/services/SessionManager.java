package djnd.project.SoundCloud.services;

import java.util.UUID;

import org.springframework.stereotype.Service;

import djnd.project.SoundCloud.domain.entity.User;
import djnd.project.SoundCloud.repositories.UserRepository;

@Service
public class SessionManager {
    private final UserRepository userRepository;

    public SessionManager(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Tạo session ID mới cho user
     * 
     * QUAN TRỌNG: Đây là method được gọi khi user login
     * - Tạo UUID mới làm sessionId
     * - Lưu vào database → tự động đè lên session cũ (nếu có)
     * - Đảm bảo chỉ có 1 session active tại một thời điểm
     * 
     * @param user User cần tạo session mới
     * @return Session ID mới (UUID string)
     */
    public String createNewSession(User user) {
        // Tạo session ID mới bằng UUID
        String newSessionId = UUID.randomUUID().toString();

        // Cập nhật session ID mới cho user trong database
        user.setSessionId(newSessionId);
        userRepository.save(user);

        return newSessionId;
    }

    /**
     * Kiểm tra xem session ID có hợp lệ với user không
     * 
     * QUAN TRỌNG: Đây là method được gọi trong CustomJwtAuthenticationConverter
     * - Lấy sessionId hiện tại từ database
     * - So sánh với sessionId trong JWT token
     * - Return false nếu session đã bị invalidate (login từ nơi khác)
     * 
     * @param email     Email của user
     * @param sessionId Session ID cần kiểm tra (từ JWT token)
     * @return true nếu session hợp lệ, false nếu session đã bị invalidate
     */
    public boolean isValidSession(String email, String sessionId) {
        User user = userRepository.findByEmail(email);

        // Kiểm tra user tồn tại và có sessionId
        if (user == null || user.getSessionId() == null) {
            return false; // User không tồn tại hoặc chưa login
        }

        // So sánh sessionId trong JWT với sessionId trong database
        return user.getSessionId().equals(sessionId);
    }

    /**
     * Invalidate session của user (logout)
     * 
     * Được gọi khi user logout thủ công
     * - Set sessionId = null trong database
     * - Session sẽ không còn hợp lệ
     * 
     * @param email Email của user
     */
    public void invalidateSession(String email) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            user.setSessionId(null); // Xóa sessionId
            userRepository.save(user);
        }
    }
}
