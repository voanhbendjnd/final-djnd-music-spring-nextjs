package djnd.project.SoundCloud.domain.request;

import djnd.project.SoundCloud.utils.constains.RoomStatus;

public record RoomDTO(Long id, String name, String code, String password, RoomStatus status, Boolean isActive,
        Boolean isPublic) {

}
