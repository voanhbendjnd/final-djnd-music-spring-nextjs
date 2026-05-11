package djnd.project.SoundCloud.domain.request.users;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateDTO {
    @NotNull(message = "ID cannot be null!")
    Long id;
    @NotBlank(message = "Name cannot be null!")
    String name;
    @NotBlank(message = "Email cannot be null!")
    String email;
    @NotNull(message = "Role ID cannot be null!")
    Long roleId;
    @NotNull(message = "Status cannot be null!")
    Boolean status;
    // Role role;
}
