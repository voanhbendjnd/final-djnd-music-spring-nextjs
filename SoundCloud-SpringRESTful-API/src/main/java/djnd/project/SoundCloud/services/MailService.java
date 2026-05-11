package djnd.project.SoundCloud.services;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Random;

import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import djnd.project.SoundCloud.domain.entity.User;
import djnd.project.SoundCloud.domain.response.users.ResUser;
import djnd.project.SoundCloud.repositories.UserRepository;
import jakarta.mail.MessagingException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class MailService {
    JavaMailSender javaMailSender;
    SpringTemplateEngine templateEngine;
    PasswordEncoder passwordEncoder;
    UserRepository userRepository;

    public void clearOTP(User user) {
        user.setOneTimePassword(null);
        user.setOtpRequestedTime(null);
        this.userRepository.save(user);
    }

    public String generateOTP(User user) {
        // Clear OTP
        this.clearOTP(user);
        // Create OTP
        Random ran = new Random();
        var otp = ran.nextInt(1000, 9999) + "";
        var hashOTP = this.passwordEncoder.encode(otp);
        user.setOneTimePassword(hashOTP);
        user.setOtpRequestedTime(new Date());
        this.userRepository.save(user);
        return otp;
    }
    /*
     * to: Email người nhận
     * subject: Tiêu đề
     * content: Nội dung
     * isMultipart: true thì sẽ trả html hoặc tệp đính kèm
     * this.javaMailSender.send(mimeMessage): trả về email đồng bộ
     */

    public void sendEmailSync(String to, String subject,
            String content, boolean isMultipart,
            boolean isHtml,
            List<FileSystemResource> attachments) {
        var mimeMessage = this.javaMailSender.createMimeMessage();
        try {
            var message = new MimeMessageHelper(mimeMessage, isMultipart, StandardCharsets.UTF_8.name());
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content, isHtml);
            if (isMultipart) {
                for (var file : attachments) {
                    message.addInline(file.getFilename(), file);
                }
            }
            this.javaMailSender.send(mimeMessage);
        } catch (MailException | MessagingException e) {
            System.out.println("ERROR SEND EMAIL: " + e);
        }
    }

    public void sendOTPToEmail(User user, String msg, boolean otpCheck) {
        if (otpCheck) {
            var otp = this.generateOTP(user);
            this.send(user.getEmail(), otp + msg, "index",
                    user.getName() != null ? user.getName() : user.getEmail(), otp);
        }
    }

    public void setUpAndSendFormUpdatePassword(ResUser user) {
        this.sendNotificationUpdatePassword(user.getEmail(), "Mật Khẩu Sound Cloud Vừa Được Thay Đổi",
                "update-password", user.getEmail(), user.getName());
    }

    /*
     * context: include data
     * tmplate: name file .html
     */
    @Async
    public void send(String to, String subject, String tmplate, String username, String OTP) {
        var ctx = new Context();
        ctx.setVariable("name", username);
        ctx.setVariable("OTP", OTP);
        var at = new ArrayList<FileSystemResource>();
        var content = this.templateEngine.process(tmplate, ctx);
        this.sendEmailSync(to, subject, content, false, true, at);
    }

    @Async
    public void sendNotificationUpdatePassword(String to, String sub, String tmplate, String email, String name) {
        var ctx = new Context();
        ctx.setVariable("name", name);
        ctx.setVariable("email", email);
        var at = new ArrayList<FileSystemResource>();
        var content = this.templateEngine.process(tmplate, ctx);
        this.sendEmailSync(to, sub, content, false, true, at);
    }

}
