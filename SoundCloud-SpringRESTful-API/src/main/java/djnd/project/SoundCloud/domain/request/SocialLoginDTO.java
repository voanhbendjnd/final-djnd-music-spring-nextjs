package djnd.project.SoundCloud.domain.request;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class SocialLoginDTO {
    @NotBlank(message = "Email cannot be Empty!")
    @Email(message = "Email Invalid Format!")
    String email;
    @NotBlank(message = "Name cannot be Empty!")
    String name;
    @NotBlank(message = "Type cannot be Empty!")
    String type;
    String avatar;
    @JsonProperty("accessToken")
    String accessToken;
}
