package djnd.project.SoundCloud.configs;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class DelayInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String delayHeader = request.getHeader("delay");
        if (delayHeader != null) {
            try {
                long delay = Long.parseLong(delayHeader);
                Thread.sleep(delay); // delay tính bằng ms
            } catch (NumberFormatException e) {
                // nếu header không hợp lệ thì bỏ qua
            }
        }
        return true; // cho request tiếp tục
    }
}