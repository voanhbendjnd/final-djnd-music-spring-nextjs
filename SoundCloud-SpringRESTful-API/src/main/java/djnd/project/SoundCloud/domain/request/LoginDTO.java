package djnd.project.SoundCloud.domain.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginDTO {
    @NotBlank(message = "Email cannot be Empty!")
    @Email(message = "Email Invalid Format!")
    String email;
    @NotBlank(message = "Password cannot be Empty!")
    String password;

}
