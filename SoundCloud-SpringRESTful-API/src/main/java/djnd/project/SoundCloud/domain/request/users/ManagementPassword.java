package djnd.project.SoundCloud.domain.request.users;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
@Data
public class ManagementPassword {
    @NotBlank(message = "Password cannot be empty!")
    @Size(min = 6, message = "Password must be least 6 character!")
    private String password;
    @NotBlank(message = "Confirm Password cannot be Empty!")
    @Size(min = 6, message = "Password must be least 6 character!")
    @JsonProperty("confirm_password")
    private String confirmPassword;
   
}
