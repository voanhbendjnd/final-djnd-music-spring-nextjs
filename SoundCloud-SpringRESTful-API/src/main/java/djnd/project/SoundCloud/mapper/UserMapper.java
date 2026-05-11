package djnd.project.SoundCloud.mapper;

import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import djnd.project.SoundCloud.domain.entity.User;
import djnd.project.SoundCloud.domain.request.users.UserDTO;
import djnd.project.SoundCloud.domain.request.users.UserUpdateDTO;
import djnd.project.SoundCloud.domain.response.users.ResUser;

// @Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, nullValueCheckStrategy = NullValueCheckStrategy.ON_IMPLICIT_CONVERSION)
public interface UserMapper {
    @Mapping(target = "id", ignore = true)
    User toUser(UserDTO userDTO);

    ResUser toResUser(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    void updateUserFromDTO(UserUpdateDTO userDTO, @MappingTarget User user);
}
