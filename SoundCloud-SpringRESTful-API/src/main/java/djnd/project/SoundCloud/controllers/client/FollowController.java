package djnd.project.SoundCloud.controllers.client;

import java.util.Map;

import org.apache.coyote.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import djnd.project.SoundCloud.services.FollowService;
import djnd.project.SoundCloud.utils.annotation.ApiMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/v1/follows")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class FollowController {
    FollowService followService;

    @PostMapping
    @ApiMessage("Update follow")
    public ResponseEntity<?> updateFollowerAndCreateRecord(@RequestBody Map<String, String> mapRequest)
            throws BadRequestException {
        var followingIdStr = mapRequest.get("followingId");
        if (followingIdStr != null && !followingIdStr.isEmpty()) {
            try {
                var followingId = Long.parseLong(followingIdStr);
                if (followingId <= 0) {
                    throw new BadRequestException("Following ID must be positive number!");
                }
                return ResponseEntity.status(HttpStatus.CREATED).body(this.followService.toggleFollow(followingId));
            } catch (NumberFormatException ne) {
                throw new BadRequestException("Following ID must be number!");
            }
        }
        throw new BadRequestException("Following ID not found!");

    }
}
