package djnd.project.SoundCloud.domain.request.users;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String name;
    @Email(message = "Email in correct format!")
    @NotBlank(message = "Email cannot be empty!")
    private String email;
    @Valid
    @JsonProperty("management_password")
    private ManagementPassword managementPassword;
    @JsonProperty("one_time_password")
    private String oneTimePassword;
    private Long roleId;
}
