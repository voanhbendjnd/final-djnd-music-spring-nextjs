package djnd.project.SoundCloud.domain.request.users;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdatePassword {
    @JsonProperty("current_password")
    @NotBlank(message = "Current Password cannot be Empty!")
    private String currentPassword;
    @Valid
    @JsonProperty("management_password")
    private ManagementPassword managementPassword;
}
