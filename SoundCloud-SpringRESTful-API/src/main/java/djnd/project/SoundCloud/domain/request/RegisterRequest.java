package djnd.project.SoundCloud.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterRequest {
    @NotBlank(message = "Name null")
    String name;
    String email;
    String username;
    @NotBlank(message = "Password null")
    String password;
    @NotBlank(message = "Confirm password null")
    String confirmPassword;
}
